import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import VideoPlayer from './components/VideoPlayer';
import Bookmarks from './components/Bookmarks';

// Static Curriculum List
const LESSONS = [
    {
        id: "lesson-1",
        title: "Introduction to HTML5 Semantic Structures",
        description: "Learn how to build accessible, searchable, and clean layout architectures using modern HTML5 semantic elements. This lesson covers layout tags, hierarchy, and industry best practices.",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        duration: "15:00",
        durationSec: 900
    },
    {
        id: "lesson-2",
        title: "Mastering CSS Grid and Flexbox Layouts",
        description: "Dive deep into modern CSS page layout engines. Understand visual alignment, alignment axes, grid templates, responsive wrapping, and interactive styling methodologies.",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        duration: "12:30",
        durationSec: 750
    },
    {
        id: "lesson-3",
        title: "Asynchronous JavaScript & ES6 Promises",
        description: "Master modern JS concurrency. Explore async/await, call stack operations, event loops, promises chaining, error handling, and networking endpoints communication.",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        duration: "18:45",
        durationSec: 1125
    },
    {
        id: "lesson-4",
        title: "Building Component States with React Hooks",
        description: "Understand reactive application architectures. Study rendering cycles, state dependencies, standard hooks usage, custom side-effects, and optimization patterns.",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        duration: "22:15",
        durationSec: 1335
    }
];

export default function App() {
    // 1. Core Hooks & Persistence States
    const [activeLessonIndex, setActiveLessonIndex] = useState(() => {
        const saved = localStorage.getItem("edu_active_lesson_index");
        return saved !== null ? parseInt(saved, 10) : 0;
    });

    const [bookmarks, setBookmarks] = useState(() => {
        const saved = localStorage.getItem("edu_bookmarks");
        return saved ? JSON.parse(saved) : {};
    });

    const [progressStore, setProgressStore] = useState(() => {
        const saved = localStorage.getItem("edu_progress");
        return saved ? JSON.parse(saved) : {};
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("details"); // 'details' | 'security'
    const [currentTime, setCurrentTime] = useState(0);

    // Communicate timeline jumps to player ref
    const [seekTrigger, setSeekTrigger] = useState(null);

    // Save states to local storage on modifications
    useEffect(() => {
        localStorage.setItem("edu_active_lesson_index", activeLessonIndex);
    }, [activeLessonIndex]);

    useEffect(() => {
        localStorage.setItem("edu_bookmarks", JSON.stringify(bookmarks));
    }, [bookmarks]);

    useEffect(() => {
        localStorage.setItem("edu_progress", JSON.stringify(progressStore));
    }, [progressStore]);

    const activeLesson = LESSONS[activeLessonIndex];

    // ==========================================================================
    // 2. CURRICULUM & PROGRESS HANDLERS
    // ==========================================================================

    const handleLessonSelect = (index) => {
        setActiveLessonIndex(index);
        setCurrentTime(0);
        setSeekTrigger(null);
    };

    const handleProgressUpdate = (time, duration) => {
        setCurrentTime(time);
        if (!duration) return;

        const percent = (time / duration) * 100;

        setProgressStore(prev => ({
            ...prev,
            [activeLesson.id]: {
                watchedTime: time,
                progressPercent: percent
            }
        }));
    };

    // Calculate aggregated watch time
    const calculateTotalWatchTime = () => {
        let totalSecs = 0;
        Object.values(progressStore).forEach(p => {
            totalSecs += p.watchedTime || 0;
        });
        return Math.round(totalSecs / 60);
    };

    // ==========================================================================
    // 3. BOOKMARK LIFECYCLE HANDLERS
    // ==========================================================================

    const handleSaveBookmark = (timestamp, noteText) => {
        const displayTime = noteText.trim();
        const finalNote = displayTime || `Bookmark at ${formatTime(timestamp)}`;

        const newBookmark = {
            id: `bm-${Date.now()}`,
            timestamp: timestamp,
            note: finalNote
        };

        setBookmarks(prev => {
            const list = prev[activeLesson.id] ? [...prev[activeLesson.id]] : [];
            list.push(newBookmark);
            list.sort((a, b) => a.timestamp - b.timestamp);
            return {
                ...prev,
                [activeLesson.id]: list
            };
        });
    };

    const handleQuickBookmark = (timestamp) => {
        handleSaveBookmark(timestamp, "");
    };

    const handleDeleteBookmark = (bmId) => {
        if (confirm("Are you sure you want to delete this bookmark?")) {
            setBookmarks(prev => {
                const list = prev[activeLesson.id] || [];
                return {
                    ...prev,
                    [activeLesson.id]: list.filter(item => item.id !== bmId)
                };
            });
        }
    };

    const handleEditBookmark = (bmId) => {
        const list = bookmarks[activeLesson.id] || [];
        const item = list.find(x => x.id === bmId);
        if (!item) return;

        const newNote = prompt("Edit bookmark description:", item.note);
        if (newNote !== null) {
            setBookmarks(prev => {
                const updatedList = (prev[activeLesson.id] || []).map(x => {
                    if (x.id === bmId) {
                        return { ...x, note: newNote.trim() || `Bookmark at ${formatTime(x.timestamp)}` };
                    }
                    return x;
                });
                return {
                    ...prev,
                    [activeLesson.id]: updatedList
                };
            });
        }
    };

    const handleClearAllBookmarks = () => {
        if (confirm(`Clear all saved bookmarks for "${activeLesson.title}"?`)) {
            setBookmarks(prev => ({
                ...prev,
                [activeLesson.id]: []
            }));
        }
    };

    const handleSeekToTime = (timestamp) => {
        setSeekTrigger({
            time: timestamp,
            trigger: Date.now() // Force key trigger uniqueness
        });
    };

    // Format utility
    const formatTime = (secs) => {
        if (isNaN(secs)) return "00:00";
        const minutes = Math.floor(secs / 60);
        const seconds = Math.floor(secs % 60);
        const pad = (num) => num < 10 ? `0${num}` : num;
        return `${pad(minutes)}:${pad(seconds)}`;
    };

    const lessonBookmarks = bookmarks[activeLesson.id] || [];
    const currentLessonResumeTime = progressStore[activeLesson.id]?.watchedTime || 0;

    return (
        <div className="dashboard-container">
            {/* Sidebar drawer navigation */}
            <Sidebar
                lessons={LESSONS}
                activeLessonIndex={activeLessonIndex}
                progressStore={progressStore}
                onLessonSelect={handleLessonSelect}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            {/* Dashboard main column */}
            <main className="main-content">
                <header className="main-header">
                    <div className="header-left">
                        <button
                            className="mobile-toggle"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <i className="fa-solid fa-bars"></i>
                        </button>
                        <div>
                            <span className="category-tag">Web Development Masterclass</span>
                            <h1>{activeLesson.title}</h1>
                        </div>
                    </div>

                    <div className="header-right">
                        <div className="stats-card">
                            <i className="fa-solid fa-clock-rotate-left"></i>
                            <div>
                                <span className="label">Total Watch Time</span>
                                <span className="value">{calculateTotalWatchTime()}m</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="portal-grid">
                    {/* Left: Custom Video Player & Meta details */}
                    <div className="video-section">
                        <VideoPlayer
                            lesson={activeLesson}
                            onProgressUpdate={handleProgressUpdate}
                            onQuickBookmark={handleQuickBookmark}
                            savedResumeTime={currentLessonResumeTime}
                            seekTrigger={seekTrigger}
                        />

                        {/* Interactive Info Cards Tabs */}
                        <div className="details-card">
                            <div className="tabs-header">
                                <button
                                    className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('details')}
                                >
                                    Overview
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('security')}
                                >
                                    Security Policy
                                </button>
                            </div>

                            {activeTab === 'details' ? (
                                <div className="tab-content">
                                    <h3>Lesson Description</h3>
                                    <p className="lesson-desc-text">{activeLesson.description}</p>

                                    <div className="course-metadata">
                                        <div className="meta-item">
                                            <i className="fa-solid fa-graduation-cap"></i>
                                            <span>Instructor: Prof. Sarah Jenkins</span>
                                        </div>
                                        <div className="meta-item">
                                            <i className="fa-solid fa-clock"></i>
                                            <span>Duration: {activeLesson.duration.split(":")[0]} mins</span>
                                        </div>
                                        <div className="meta-item">
                                            <i className="fa-solid fa-circle-check"></i>
                                            <span>Category: Full-Stack Engineering</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="tab-content">
                                    <h3>Active Security Features</h3>
                                    <div className="security-grid">
                                        <div className="sec-feature-card">
                                            <i className="fa-solid fa-fingerprint"></i>
                                            <h4>Dynamic Watermarking</h4>
                                            <p>Semi-transparent student credentials and IP address float dynamically across the player area, making screenshot sharing easily traceable.</p>
                                        </div>
                                        <div className="sec-feature-card">
                                            <i className="fa-solid fa-eye-slash"></i>
                                            <h4>Focus-Loss Blur</h4>
                                            <p>The screen blurs and video pauses automatically when the user loses window focus, switches tabs, or initiates screenshot software overlaying this window.</p>
                                        </div>
                                        <div className="sec-feature-card">
                                            <i className="fa-solid fa-keyboard"></i>
                                            <h4>Keyboard Shortcut Blocking</h4>
                                            <p>Standard shortcut keys for system commands such as printing, taking snapshots, and inspecting elements are intercepted and blocked inside this app.</p>
                                        </div>
                                        <div className="sec-feature-card">
                                            <i className="fa-solid fa-ban"></i>
                                            <h4>Menu Restrictions</h4>
                                            <p>Right-click and copy-paste utilities are disabled on educational assets to prevent scraping of visual and code structures.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Bookmarks Module Panel */}
                    <Bookmarks
                        lesson={activeLesson}
                        bookmarksList={lessonBookmarks}
                        currentTime={currentTime}
                        onSaveBookmark={handleSaveBookmark}
                        onDeleteBookmark={handleDeleteBookmark}
                        onEditBookmark={handleEditBookmark}
                        onClearAllBookmarks={handleClearAllBookmarks}
                        onSeekToTime={handleSeekToTime}
                    />
                </div>
            </main>
        </div>
    );
}
