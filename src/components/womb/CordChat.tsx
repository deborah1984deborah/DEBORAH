import React, { useState, useEffect, useRef } from 'react';
import { TooltipButton } from '../shared/TooltipButton';
import { useCordChat } from '../../hooks/useCordChat';
import { CordSessionModal } from './CordSessionModal';

interface CordChatProps {
    lang: 'ja' | 'en';
    currentStoryId?: string;
    showDebugInfo?: boolean;
}

export const CordChat: React.FC<CordChatProps> = ({ lang, currentStoryId, showDebugInfo = false }) => {
    // Integrate Custom Hook
    const {
        sessions,
        currentSessionId,
        messages,
        addMessage,
        deleteSession,
        startNewSession,
        setCurrentSessionId
    } = useCordChat(currentStoryId);

    const [inputValue, setInputValue] = useState('');
    const [showHistory, setShowHistory] = useState(false); // Modal State
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();

        // Auto-reply mock (AI Response)
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'user') {
                const timer = setTimeout(() => {
                    const responseText = lang === 'ja'
                        ? 'なるほど、それは興味深いですね。詳しく聞かせてください。'
                        : 'I see, that sounds interesting. Please tell me more.';
                    addMessage('ai', responseText);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [messages, addMessage, lang]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        // User Message
        addMessage('user', inputValue);
        setInputValue('');
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
                        <div key={msg.id} style={{
                            display: 'flex',
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                        }}>
                            <div style={{
                                maxWidth: '70%',
                                padding: '0.8rem 1.2rem',
                                borderRadius: '12px',
                                backgroundColor: msg.role === 'user' ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                                color: msg.role === 'user' ? '#0f172a' : '#e2e8f0',
                                borderTopRightRadius: msg.role === 'user' ? '2px' : '12px',
                                borderTopLeftRadius: msg.role === 'ai' ? '2px' : '12px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
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
                alignItems: 'flex-end'
            }}>
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={lang === 'ja' ? 'メッセージを入力...' : 'Type a message...'}
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
                        fontFamily: 'inherit'
                    }}
                    rows={1}
                />
                <button
                    onClick={handleSend}
                    style={{
                        backgroundColor: '#38bdf8',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.8rem 1.2rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                    {lang === 'ja' ? '送信' : 'Send'}
                </button>
            </div>

            {/* History Modal */}
            {showHistory && (
                <CordSessionModal
                    onClose={() => setShowHistory(false)}
                    sessions={sessions}
                    onSelectSession={handleSelectSession}
                    onDeleteSession={deleteSession}
                />
            )}
        </div>
    );
};
