import React from 'react';
import { ChatSession } from '../../types';

interface CordSessionModalProps {
    onClose: () => void;
    sessions: ChatSession[];
    onSelectSession: (sessionId: string) => void;
    onDeleteSession?: (sessionId: string) => void;
}

export const CordSessionModal: React.FC<CordSessionModalProps> = ({ onClose, sessions, onSelectSession, onDeleteSession }) => {
    // Helper to format date
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const [hoveredSessionId, setHoveredSessionId] = React.useState<string | null>(null);

    const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this chat?')) {
            onDeleteSession?.(sessionId);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            <div style={{
                width: '600px',
                maxHeight: '80vh',
                backgroundColor: 'rgba(26, 26, 32, 0.95)',
                border: '1px solid rgba(249, 115, 22, 0.3)', // Neon Orange Border
                borderRadius: '16px',
                boxShadow: '0 0 20px rgba(249, 115, 22, 0.1), 0 8px 32px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(to right, rgba(249, 115, 22, 0.05), transparent)'
                }}>
                    <h2 style={{
                        margin: 0,
                        color: '#fb923c', // Neon Orange Text
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem' // Correct gap as per user request
                    }}>
                        {/* Chat / Speech Bubble SVG Icon */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        SAVED CHATS
                    </h2>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        padding: '0 0.5rem',
                        transition: 'color 0.2s'
                    }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}>
                        ×
                    </button>
                </div>

                {/* List Container */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1rem'
                }}>
                    {sessions.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                            No saved chats yet. Use "New Chat" to start one.
                        </div>
                    )}
                    {sessions.map(session => (
                        <div key={session.id}
                            onClick={() => onSelectSession(session.id)}
                            style={{
                                padding: '1rem',
                                borderRadius: '12px',
                                backgroundColor: hoveredSessionId === session.id ? 'rgba(249, 115, 22, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                                border: hoveredSessionId === session.id ? '1px solid rgba(249, 115, 22, 0.3)' : '1px solid rgba(148, 163, 184, 0.1)',
                                marginBottom: '0.8rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '0.4rem',
                                position: 'relative'
                            }}
                            onMouseEnter={() => setHoveredSessionId(session.id)}
                            onMouseLeave={() => setHoveredSessionId(null)}
                        >
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{session.title}</span>
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{formatDate(session.updatedAt)}</span>
                            </div>

                            {/* Delete Button (Visible on Hover) */}
                            {hoveredSessionId === session.id && (
                                <button
                                    onClick={(e) => handleDeleteClick(e, session.id)}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.2)', // Red background
                                        border: '1px solid rgba(239, 68, 68, 0.5)',
                                        color: '#f87171',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        lineHeight: 1,
                                        marginLeft: '1rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => {
                                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.4)';
                                        e.currentTarget.style.color = '#fff';
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                                        e.currentTarget.style.color = '#f87171';
                                    }}
                                    title="Delete Chat"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem',
                    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '0.8rem'
                }}>
                    Select a chat to resume
                </div>
            </div>
        </div>
    );
};
