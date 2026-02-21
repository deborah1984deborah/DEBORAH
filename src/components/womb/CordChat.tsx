import React, { useState, useEffect, useRef } from 'react';
import { TooltipButton } from '../shared/TooltipButton';
import { useCordChat } from '../../hooks/useCordChat';
import { CordSessionModal } from './CordSessionModal';

interface CordChatProps {
    lang: 'ja' | 'en';
    currentStoryId?: string;
    showDebugInfo?: boolean;
    apiKey: string;
    aiModel: 'gemini-2.5-flash' | 'gemini-3.1-pro-preview';
}

export const CordChat: React.FC<CordChatProps> = ({ lang, currentStoryId, showDebugInfo = false, apiKey, aiModel }) => {
    // Integrate Custom Hook
    const {
        sessions,
        currentSessionId,
        messages,
        isTyping,
        addMessage,
        generateAiResponse,
        deleteSession,
        startNewSession,
        setCurrentSessionId,
        editMessage,
        deleteMessage,
        chatScope,
        setChatScope
    } = useCordChat(currentStoryId);

    const [inputValue, setInputValue] = useState('');
    const [showHistory, setShowHistory] = useState(false); // Modal State
    // Edit Message State
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    // Hover State for showing icons
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Determine which scope to DISPLAY:
    // If a session is active, show that session's actual scope.
    // Otherwise, show the user's current selected preference for the NEXT session.
    const activeSession = currentSessionId ? sessions.find(s => s.id === currentSessionId) : null;
    const displayedScope = activeSession ? (activeSession.isGlobal ? 'global' : 'story') : chatScope;

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!inputValue.trim() || isTyping) return;

        // 1. Add User Message (Returns active sessionId)
        const activeSessionId = addMessage('user', inputValue);
        setInputValue('');

        // 2. Trigger AI Response
        if (activeSessionId) {
            generateAiResponse(activeSessionId, apiKey, aiModel, lang);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Toolbar Actions
    const handleNewChat = () => {
        if (confirm(lang === 'ja' ? '新しいチャットを開始しますか？' : 'Start a new chat?')) {
            startNewSession();
        }
    };

    const handleSaveHistory = () => {
        // Toggle Modal
        setShowHistory(true);
    };

    const handleSelectSession = (sessionId: string) => {
        setCurrentSessionId(sessionId);
        setShowHistory(false);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            position: 'relative' // Ensure clean stacking
        }}>
            {/* DEBUG OVERLAY - REMOVE LATER */}
            {/* DEBUG OVERLAY */}
            {showDebugInfo && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: 'rgba(255,0,0,0.8)',
                    color: 'white',
                    fontSize: '10px',
                    padding: '2px',
                    zIndex: 9999,
                    pointerEvents: 'none',
                    borderBottomLeftRadius: '4px'
                }}>
                    Sessions: {sessions.length} | ID: {currentSessionId || 'null'}
                </div>
            )}
            {/* Message List Area (Relative Wrapper for Floating Toolbar) */}
            <div style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden' // Important for inner scroll
            }}>
                {/* Scrollable Messages */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    overflowY: 'auto',
                    padding: '1rem',
                    paddingBottom: '3rem', // Add space for floating toolbar
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    {/* SCOPE SELECTOR (Only shown/enabled when NO session is active) */}
                    <div style={{
                        alignSelf: 'flex-start',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: 1, // Keep fully visible, just disable interaction
                        pointerEvents: currentSessionId ? 'none' : 'auto',
                        transition: 'all 0.3s ease',
                        marginBottom: '0.5rem',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '20px', // Capsule shape
                        padding: '0.2rem 0.5rem',
                        position: 'relative'
                    }}>
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            backgroundColor: displayedScope === 'global' ? '#10b981' : '#38bdf8',
                            boxShadow: `0 0 5px ${displayedScope === 'global' ? '#10b981' : '#38bdf8'}`
                        }}></div>
                        <select
                            value={displayedScope}
                            onChange={(e) => setChatScope(e.target.value as 'global' | 'story')}
                            style={{
                                appearance: 'none',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: displayedScope === 'global' ? '#10b981' : '#38bdf8', // Emerald for Global, Cyan for Story
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                outline: 'none',
                                cursor: currentSessionId ? 'default' : 'pointer',
                                paddingRight: currentSessionId ? '0' : '1rem', // Collapse space when arrow is hidden
                                transition: 'padding 0.3s ease',
                            }}
                            disabled={!!currentSessionId}
                        >
                            <option value="story" style={{ backgroundColor: '#1A1A20', color: '#38bdf8' }}>{lang === 'ja' ? 'Story Scope' : 'Story Scope'}</option>
                            <option value="global" style={{ backgroundColor: '#1A1A20', color: '#10b981' }}>{lang === 'ja' ? 'Global Scope' : 'Global Scope'}</option>
                        </select>
                        {/* Dropdown Arrow: Hide when a session is active to make it look like a badge */}
                        <svg style={{
                            position: 'absolute',
                            right: '0.5rem',
                            pointerEvents: 'none',
                            opacity: currentSessionId ? 0 : 1,
                            transition: 'opacity 0.3s'
                        }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={displayedScope === 'global' ? '#10b981' : '#38bdf8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>


                    {messages.length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            color: '#94a3b8',
                            marginTop: '2rem',
                            fontSize: '0.9rem'
                        }}>
                            {lang === 'ja' ? '新しいチャットを開始...' : 'Start a new chat...'}
                        </div>
                    )}
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            style={{
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                position: 'relative'
                            }}
                            onMouseEnter={() => setHoveredMessageId(msg.id)}
                            onMouseLeave={() => setHoveredMessageId(null)}
                        >
                            {/* Actions (Edit / Delete) - Show on Hover */}
                            {hoveredMessageId === msg.id && editingMessageId !== msg.id && (
                                <div style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    alignItems: 'center',
                                    padding: '0 0.5rem',
                                    // Position based on role
                                    ...(msg.role === 'user' ? { marginRight: '0.5rem' } : { marginLeft: '0.5rem' }),
                                    order: msg.role === 'user' ? -1 : 1, // Place before user msg, after AI msg
                                    opacity: 0.7,
                                    transition: 'opacity 0.2s',
                                }}>
                                    {/* Edit Button */}
                                    <button
                                        onClick={() => {
                                            setEditingMessageId(msg.id);
                                            setEditValue(msg.content);
                                        }}
                                        style={{
                                            background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '0.2rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                        title={lang === 'ja' ? '編集' : 'Edit'}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                    {/* Delete Button */}
                                    <button
                                        onClick={() => {
                                            if (confirm(lang === 'ja' ? 'このメッセージを削除しますか？' : 'Delete this message?')) {
                                                deleteMessage(msg.id);
                                            }
                                        }}
                                        style={{
                                            background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.2rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                        title={lang === 'ja' ? '削除' : 'Delete'}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            )}

                            <div style={{
                                width: editingMessageId === msg.id ? '100%' : 'auto',
                                maxWidth: editingMessageId === msg.id ? '100%' : '70%',
                                padding: '0.8rem 1.2rem',
                                borderRadius: '12px',
                                backgroundColor: msg.role === 'user' ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                                color: msg.role === 'user' ? '#0f172a' : '#e2e8f0',
                                borderTopRightRadius: msg.role === 'user' ? '2px' : '12px',
                                borderTopLeftRadius: msg.role === 'ai' ? '2px' : '12px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                {editingMessageId === msg.id ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                                        <textarea
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Escape') {
                                                    setEditingMessageId(null);
                                                } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                                    editMessage(msg.id, editValue);
                                                    setEditingMessageId(null);
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                minHeight: '60px',
                                                backgroundColor: 'rgba(0,0,0,0.2)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                borderRadius: '4px',
                                                color: msg.role === 'user' ? '#0f172a' : '#e2e8f0',
                                                padding: '0.5rem',
                                                resize: 'vertical',
                                                outline: 'none',
                                                fontFamily: 'inherit',
                                                fontSize: 'inherit'
                                            }}
                                            autoFocus
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => setEditingMessageId(null)}
                                                style={{ background: 'transparent', border: 'none', color: msg.role === 'user' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >
                                                {lang === 'ja' ? 'キャンセル (Esc)' : 'Cancel (Esc)'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    editMessage(msg.id, editValue);
                                                    setEditingMessageId(null);
                                                }}
                                                style={{ background: msg.role === 'user' ? '#0f172a' : '#38bdf8', color: msg.role === 'user' ? '#38bdf8' : '#0f172a', border: 'none', borderRadius: '4px', padding: '0.2rem 0.8rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                            >
                                                {lang === 'ja' ? '保存 (Ctrl+Enter)' : 'Save (Ctrl+Enter)'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {msg.content}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            opacity: 0.7,
                            padding: '0.5rem 1rem',
                            color: '#e2e8f0',
                            fontSize: '0.9rem',
                            fontStyle: 'italic',
                        }}>
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <span style={{ animation: 'blink 1.4s infinite both', animationDelay: '0s' }}>.</span>
                                <span style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.2s' }}>.</span>
                                <span style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.4s' }}>.</span>
                            </div>
                            <span style={{ marginLeft: '0.5rem' }}>{lang === 'ja' ? 'CORDが入力中...' : 'CORD is typing...'}</span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Floating Toolbar (Save/Load & New Chat) */}
                <div style={{
                    position: 'absolute',
                    bottom: '0.2rem',
                    right: '1rem',
                    display: 'flex',
                    gap: '0.8rem',
                    padding: '0.4rem',
                }}>
                    {/* View History / Save (Folder) */}
                    <TooltipButton
                        label={lang === 'ja' ? '保存済み / 履歴' : 'Saved / History'}
                        placement="top"
                        variant="neon-blue"
                        onClick={handleSaveHistory}
                        icon={
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            </svg>
                        }
                    />

                    {/* New Chat (Paper & Pen) */}
                    <TooltipButton
                        label={lang === 'ja' ? '新しいチャット' : 'New Chat'}
                        placement="top"
                        variant="neon-blue"
                        onClick={handleNewChat}
                        icon={
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        }
                    />
                </div>
            </div>

            {/* Input Area Container (Reverted to simple row) */}
            <div style={{
                padding: '1rem',
                borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-end',
                opacity: isTyping ? 0.5 : 1, // Visually dim when locked
                pointerEvents: isTyping ? 'none' : 'auto', // Lock inputs
                transition: 'opacity 0.2s'
            }}>
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={lang === 'ja' ? 'メッセージを入力...' : 'Type a message...'}
                    disabled={isTyping}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        padding: '0.8rem',
                        color: '#e2e8f0',
                        resize: 'none',
                        minHeight: '24px',
                        maxHeight: '120px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        cursor: isTyping ? 'not-allowed' : 'text'
                    }}
                    rows={1}
                />
                <button
                    onClick={handleSend}
                    disabled={isTyping}
                    style={{
                        backgroundColor: '#38bdf8',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.8rem 1.2rem',
                        cursor: isTyping ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => { if (!isTyping) e.currentTarget.style.opacity = '0.9'; }}
                    onMouseOut={(e) => { if (!isTyping) e.currentTarget.style.opacity = '1'; }}
                >
                    {lang === 'ja' ? '送信' : 'Send'}
                </button>
            </div>

            {/* History Modal */}
            {showHistory && (
                <CordSessionModal
                    onClose={() => setShowHistory(false)}
                    sessions={sessions}
                    currentStoryId={currentStoryId}
                    lang={lang}
                    onSelectSession={handleSelectSession}
                    onDeleteSession={deleteSession}
                />
            )}
        </div>
    );
};
