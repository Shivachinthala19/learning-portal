import React from 'react';

export default function Sidebar({
    lessons,
    activeLessonIndex,
    progressStore,
    onLessonSelect,
    searchQuery,
    setSearchQuery,
    sidebarOpen,
    setSidebarOpen
}) {
    const activeLesson = lessons[activeLessonIndex];

    return (
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <i className="fa-solid fa-graduation-cap logo-icon"></i>
                    <span>Study Path</span>
                </div>
                <button
                    className="mobile-close"
                    id="sidebarCloseBtn"
                    onClick={() => setSidebarOpen(false)}
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div className="user-profile">
                <div className="avatar">JD</div>
                <div className="user-info">
                    <h4>SHIVA</h4>
                    <p>Student ID: ST-2026-9042</p>
                </div>
            </div>

            <div className="search-box">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                    type="text"
                    placeholder="Search lessons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <nav className="course-nav">
                <div className="nav-section-title">ACTIVE CURRICULUM</div>
                <ul className="lesson-list">
                    {lessons.map((lesson, index) => {
                        // Skip if searched query does not match
                        if (searchQuery && !lesson.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                            return null;
                        }

                        const isActive = index === activeLessonIndex;
                        const prog = progressStore[lesson.id] || { progressPercent: 0 };
                        const percent = Math.min(100, Math.round(prog.progressPercent || 0));
                        const isWatched = percent > 90;

                        return (
                            <li
                                key={lesson.id}
                                className={`lesson-item ${isActive ? 'active' : ''} ${isWatched ? 'watched' : ''}`}
                                onClick={() => {
                                    onLessonSelect(index);
                                    setSidebarOpen(false); // Auto-close drawer on mobile
                                }}
                            >
                                <i className={`status-icon fa-solid ${isWatched ? 'fa-circle-check' : 'fa-circle-play'}`}></i>
                                <div className="lesson-content">
                                    <h5>{lesson.title}</h5>
                                    <div className="lesson-meta">
                                        <span className="badge category">{lesson.category}</span>
                                        <span className="badge level">{lesson.level}</span>
                                    </div>
                                    <div className="lesson-progress-container">
                                        <div
                                            className="lesson-progress-bar"
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <div className="security-badge">
                    <i className="fa-solid fa-shield-halved"></i>
                    <span>Screenshot Protection Active</span>
                </div>
            </div>
        </aside>
    );
}
