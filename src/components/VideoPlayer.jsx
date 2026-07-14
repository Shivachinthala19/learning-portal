import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function VideoPlayer({
    lesson,
    onProgressUpdate,
    onQuickBookmark,
    savedResumeTime,
    seekTrigger
}) {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const watermarkRef = useRef(null);
    const controlsTimerRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [bufferProgress, setBufferProgress] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [showCenterPlay, setShowCenterPlay] = useState(false);

    const [showBlurWarning, setShowBlurWarning] = useState(false);
    const [showSecurityWarning, setShowSecurityWarning] = useState(false);
    const [watermarkPos, setWatermarkPos] = useState({ top: '20px', left: '20px' });

    // ── Load new lesson ────────────────────────────────────────────────────────
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setBufferProgress(0);
        setIsLoading(true);

        const onLoaded = () => {
            setDuration(video.duration);
            setIsLoading(false);
            if (savedResumeTime && savedResumeTime > 5) {
                video.currentTime = savedResumeTime;
            }
        };
        const onWaiting = () => setIsLoading(true);
        const onCanPlay = () => setIsLoading(false);

        video.addEventListener('loadedmetadata', onLoaded);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('canplay', onCanPlay);
        return () => {
            video.removeEventListener('loadedmetadata', onLoaded);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('canplay', onCanPlay);
        };
    }, [lesson.id]);

    // ── Seek trigger from bookmark ─────────────────────────────────────────────
    useEffect(() => {
        if (seekTrigger && videoRef.current) {
            videoRef.current.currentTime = seekTrigger.time;
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
    }, [seekTrigger]);

    // ── Controls auto-hide ─────────────────────────────────────────────────────
    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        clearTimeout(controlsTimerRef.current);
        if (isPlaying) {
            controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [isPlaying]);

    useEffect(() => {
        return () => clearTimeout(controlsTimerRef.current);
    }, []);

    // ── Play / Pause ───────────────────────────────────────────────────────────
    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play().then(() => {
                setIsPlaying(true);
                resetControlsTimer();
            }).catch(() => {});
        } else {
            video.pause();
            setIsPlaying(false);
            setShowControls(true);
            clearTimeout(controlsTimerRef.current);
        }
        // Flash center play/pause icon
        setShowCenterPlay(true);
        setTimeout(() => setShowCenterPlay(false), 600);
    }, [resetControlsTimer]);

    const handleSkip = (seconds) => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
            resetControlsTimer();
        }
    };

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (!video) return;
        setCurrentTime(video.currentTime);
        onProgressUpdate(video.currentTime, video.duration);
        if (video.buffered.length > 0 && video.duration) {
            const bufferedEnd = video.buffered.end(video.buffered.length - 1);
            setBufferProgress((bufferedEnd / video.duration) * 100);
        }
    };

    const handleTimelineSeek = (e) => {
        const video = videoRef.current;
        if (!video || !video.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        video.currentTime = pct * video.duration;
        setCurrentTime(video.currentTime);
        resetControlsTimer();
    };

    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            videoRef.current.muted = val === 0;
            setIsMuted(val === 0);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            const next = !isMuted;
            videoRef.current.muted = next;
            setIsMuted(next);
            if (!next) { videoRef.current.volume = 0.8; setVolume(0.8); }
            else setVolume(0);
        }
    };

    const toggleFullscreen = () => {
        const el = containerRef.current;
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    };

    const formatTime = (secs) => {
        if (isNaN(secs) || !isFinite(secs)) return '00:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // ── Screenshot Protection ──────────────────────────────────────────────────
    useEffect(() => {
        const video = videoRef.current;

        const triggerSecurityOverlay = () => {
            if (video && !video.paused) { video.pause(); setIsPlaying(false); }
            setShowSecurityWarning(true);
            setShowBlurWarning(false);
        };

        const handleFocusLoss = () => {
            if (video && !video.paused) { video.pause(); setIsPlaying(false); }
            setShowBlurWarning(true);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') handleFocusLoss();
        };

        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
            if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); togglePlay(); return; }
            if (e.key === 'ArrowLeft') { e.preventDefault(); handleSkip(-10); return; }
            if (e.key === 'ArrowRight') { e.preventDefault(); handleSkip(10); return; }
            if (e.key === 'PrintScreen' || e.keyCode === 44) { e.preventDefault(); triggerSecurityOverlay(); }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) { e.preventDefault(); triggerSecurityOverlay(); }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['S','s','I','i'].includes(e.key)) { e.preventDefault(); triggerSecurityOverlay(); }
            if (e.key === 'F12' || e.keyCode === 123) { e.preventDefault(); triggerSecurityOverlay(); }
        };

        const handleContextMenu = (e) => e.preventDefault();

        window.addEventListener('blur', handleFocusLoss);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('keydown', handleKeyDown);
        const container = containerRef.current;
        if (container) container.addEventListener('contextmenu', handleContextMenu);

        return () => {
            window.removeEventListener('blur', handleFocusLoss);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('keydown', handleKeyDown);
            if (container) container.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [togglePlay]);

    const resumeFromBlur = () => {
        setShowBlurWarning(false);
        if (videoRef.current) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
    };

    // ── Watermark drift ────────────────────────────────────────────────────────
    useEffect(() => {
        const drift = () => {
            const c = containerRef.current;
            const w = watermarkRef.current;
            if (!c || !w) return;
            const maxL = Math.max(10, c.clientWidth - (w.clientWidth || 260) - 20);
            const maxT = Math.max(10, c.clientHeight - (w.clientHeight || 28) - 65);
            setWatermarkPos({
                left: `${Math.floor(Math.random() * maxL)}px`,
                top:  `${Math.floor(Math.random() * maxT)}px`,
            });
        };
        drift();
        const id = setInterval(drift, 4000);
        window.addEventListener('resize', drift);
        return () => { clearInterval(id); window.removeEventListener('resize', drift); };
    }, [lesson.id]);

    const progressPercentage = duration ? (currentTime / duration) * 100 : 0;
    const securityActive = showBlurWarning || showSecurityWarning;

    return (
        <div
            className={`video-container ${securityActive ? 'blur-active' : ''}`}
            ref={containerRef}
            onMouseMove={resetControlsTimer}
            onMouseEnter={() => setShowControls(true)}
        >
            {/* ── Focus-Loss Warning ── */}
            <div className={`security-warning-overlay ${showBlurWarning ? 'show' : ''}`}>
                <div className="warning-box">
                    <div className="warning-icon-wrap">
                        <i className="fa-solid fa-eye-slash"></i>
                    </div>
                    <h3>Playback Suspended</h3>
                    <p>Window focus lost. Content is protected and hidden during background state.</p>
                    <button className="btn btn-primary" onClick={resumeFromBlur}>
                        <i className="fa-solid fa-play"></i> Resume Learning
                    </button>
                </div>
            </div>

            {/* ── Security Key Warning ── */}
            <div className={`security-warning-overlay ${showSecurityWarning ? 'show' : ''}`}>
                <div className="warning-box warning-danger">
                    <div className="warning-icon-wrap danger">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <h3>Security Alert</h3>
                    <p>Screenshot or screen-capture shortcut detected. This action is prohibited.</p>
                    <button className="btn btn-danger" onClick={() => setShowSecurityWarning(false)}>
                        <i className="fa-solid fa-check"></i> Acknowledge
                    </button>
                </div>
            </div>

            {/* ── Loading Spinner ── */}
            {isLoading && (
                <div className="video-loading">
                    <div className="spinner"></div>
                </div>
            )}

            {/* ── Center Play/Pause Flash ── */}
            <div className={`center-play-flash ${showCenterPlay ? 'visible' : ''}`}>
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            </div>

            {/* ── Big Center Play Button (when paused & not loading) ── */}
            {!isPlaying && !isLoading && !securityActive && (
                <button className="big-play-btn" onClick={togglePlay} title="Play Video">
                    <i className="fa-solid fa-play"></i>
                </button>
            )}

            {/* ── Watermark ── */}
            <div
                className="video-watermark"
                ref={watermarkRef}
                style={{ top: watermarkPos.top, left: watermarkPos.left }}
            >
                🔒 ST-2026-9042 · SHIVA · EduShield Secure
            </div>

            {/* ── Native Video ── */}
            <video
                ref={videoRef}
                src={lesson.url}
                playsInline
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                style={{ cursor: 'pointer' }}
            >
                Your browser does not support HTML5 video.
            </video>

            {/* ── Custom Controls Bar ── */}
            <div className={`custom-controls ${showControls || !isPlaying ? 'visible' : ''}`}>
                {/* Timeline */}
                <div
                    className="progress-bar-container"
                    onClick={handleTimelineSeek}
                    title="Click to seek"
                >
                    <div className="progress-buffer" style={{ width: `${bufferProgress}%` }}></div>
                    <div className="progress-bar"      style={{ width: `${progressPercentage}%` }}></div>
                    <div className="progress-thumb"    style={{ left: `${progressPercentage}%` }}></div>
                </div>

                <div className="controls-row">
                    {/* Left group */}
                    <div className="controls-left">
                        <button className="control-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                        </button>
                        <button className="control-btn" onClick={() => handleSkip(-10)} title="Rewind 10s">
                            <i className="fa-solid fa-backward-10"></i>
                        </button>
                        <button className="control-btn" onClick={() => handleSkip(10)} title="Forward 10s">
                            <i className="fa-solid fa-forward-10"></i>
                        </button>

                        <div className="volume-container">
                            <button className="control-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                                <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : volume < 0.4 ? 'fa-volume-low' : 'fa-volume-high'}`}></i>
                            </button>
                            <input
                                type="range" className="volume-slider"
                                min="0" max="1" step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                            />
                        </div>

                        <span className="time-display">
                            {formatTime(currentTime)} <span className="time-sep">/</span> {formatTime(duration)}
                        </span>
                    </div>

                    {/* Right group */}
                    <div className="controls-right">
                        <button
                            className="control-btn accent-btn"
                            onClick={() => onQuickBookmark(currentTime)}
                            title="Bookmark current timestamp"
                        >
                            <i className="fa-solid fa-bookmark"></i>
                            <span>Bookmark</span>
                        </button>
                        <button className="control-btn" onClick={toggleFullscreen} title="Fullscreen">
                            <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
