import React, { useState } from 'react';

export default function Bookmarks({
    lesson,
    bookmarksList = [],
    currentTime,
    onSaveBookmark,
    onDeleteBookmark,
    onEditBookmark,
    onClearAllBookmarks,
    onSeekToTime
}) {
    const [note, setNote] = useState('');

    const formatTime = (secs) => {
        if (isNaN(secs)) return "00:00";
        const minutes = Math.floor(secs / 60);
        const seconds = Math.floor(secs % 60);
        const pad = (num) => num < 10 ? `0${num}` : num;
        return `${pad(minutes)}:${pad(seconds)}`;
    };

    const handleSave = () => {
        onSaveBookmark(currentTime, note);
        setNote(''); // Reset note input
    };

    return (
        <aside className="bookmarks-panel">
            <div className="panel-header">
                <h3>
                    <i className="fa-solid fa-bookmark header-icon"></i> 
                    Video Bookmarks
                </h3>
                <span className="bookmark-count">{bookmarksList.length}</span>
            </div>

            {/* Save Bookmark Form Card */}
            <div className="add-bookmark-card">
                <h4>Create New Bookmark</h4>
                <div className="input-group">
                    <span className="timestamp-tag">
                        {formatTime(currentTime)}
                    </span>
                    <input 
                        type="text" 
                        placeholder="Optional bookmark note..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                        }}
                    />
                </div>
                <button 
                    className="btn btn-primary btn-block" 
                    onClick={handleSave}
                >
                    <i className="fa-solid fa-plus"></i> Save Bookmark
                </button>
            </div>

            {/* Saved Bookmarks List */}
            <div className="bookmarks-list-container">
                <div className="list-header">
                    <span>Saved Timestamps</span>
                    {bookmarksList.length > 0 && (
                        <button 
                            className="text-btn-danger" 
                            onClick={onClearAllBookmarks}
                            title="Remove all bookmarks for this lesson"
                        >
                            <i className="fa-solid fa-trash-can"></i> Clear All
                        </button>
                    )}
                </div>

                {bookmarksList.length === 0 ? (
                    <div className="empty-bookmarks">
                        <i className="fa-regular fa-bookmark"></i>
                        <p>No bookmarks saved yet for this lesson.</p>
                        <p className="subtitle">Use "Add Bookmark" to save timestamps with notes.</p>
                    </div>
                ) : (
                    <ul className="bookmarks-list">
                        {bookmarksList.map(bm => (
                            <li 
                                key={bm.id} 
                                className="bookmark-item"
                                onClick={() => onSeekToTime(bm.timestamp)}
                                title="Click to resume watching from here"
                            >
                                <div className="bookmark-item-top">
                                    <span className="bookmark-time-badge">
                                        <i className="fa-solid fa-play"></i> {formatTime(bm.timestamp)}
                                    </span>
                                    <div className="bookmark-actions">
                                        <button 
                                            className="action-icon-btn edit-btn" 
                                            title="Edit description"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Avoid triggering play seek
                                                onEditBookmark(bm.id);
                                            }}
                                        >
                                            <i className="fa-solid fa-pen"></i>
                                        </button>
                                        <button 
                                            className="action-icon-btn delete-btn" 
                                            title="Delete bookmark"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Avoid triggering play seek
                                                onDeleteBookmark(bm.id);
                                            }}
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <p className="bookmark-note">{bm.note}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </aside>
    );
}
