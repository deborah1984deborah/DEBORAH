import React, { useState, useEffect, useRef } from 'react';
import { WombChatInteraction } from '../../types';

interface WombChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    storyId: string | null;
    lang: 'ja' | 'en';
    showWombDebugInfo?: boolean;
    onCutContext?: () => void;
}

export const WombChatModal: React.FC<WombChatModalProps> = ({ isOpen, onClose, storyId, lang, showWombDebugInfo, onCutContext }) => {
    const [interactions, setInteractions] = useState<WombChatInteraction[]>([]);
    const [selectedChunk, setSelectedChunk] = useState<number | null>(null);
    const [expandedThoughts, setExpandedThoughts] = useState<Set<string>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Compute available chunks
    const availableChunks = Array.from(new Set(interactions.map(i => i.chunkId || 0))).sort((a, b) => a - b);
    const maxChunk = availableChunks.length > 0 ? availableChunks[availableChunks.length - 1] : 0;

    useEffect(() => {
        if (isOpen && storyId) {
            const storageKey = `womb_chat_${storyId}`;
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    // Filter out the dummy cutoff message so it doesn't render as a chat bubble
                    const filteredParsed = parsed.filter((i: any) => i.content !== '-- Context manually cleared --');
                    setInteractions(filteredParsed);

                    // Auto-select max chunk on load if not already tracking
                    const newMaxChunk = filteredParsed.length > 0 ? Math.max(...filteredParsed.map((i: any) => i.chunkId || 0)) : 0;
                    setSelectedChunk(newMaxChunk);
                } catch (e) {
                    console.error("Failed to parse WOMB chat history", e);
                }
            } else {
                setInteractions([]); // Clear if none found
                setSelectedChunk(null);
            }
        }
    }, [isOpen, storyId]);

    // Scroll to bottom when opening or loading new messages
    useEffect(() => {
        if (isOpen && interactions.length > 0) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [isOpen, interactions]);

    if (!isOpen) return null;

    const toggleThought = (id: string) => {
        setExpandedThoughts(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
        }}>
            <div style={{
                backgroundColor: '#1A1A20',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                width: '100%',
                maxWidth: '900px',
                height: '85vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0
                }}>
                    <h2 style={{
                        margin: 0,
                        color: 'white',
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>💬</span>
                        {lang === 'ja' ? 'WOMB 生成履歴 ' : 'WOMB Interaction History'}
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Cut Context Button */}
                        {onCutContext && (
                            <button
                                onClick={() => {
                                    if (window.confirm(lang === 'ja' ? 'これまでのコンテキスト（記憶）を切り離し、次回の生成から新規チャットとして開始します。よろしいですか？' : 'Are you sure you want to sever the context? The next generation will start a new chunk.')) {
                                        onCutContext();
                                        onClose(); // Optional: close the modal after cutting
                                    }
                                }}
                                style={{
                                    background: 'rgba(244, 63, 94, 0.1)', // Rose-500 tinted background
                                    border: '1px solid rgba(244, 63, 94, 0.3)',
                                    color: '#fda4af', // Rose-300
                                    cursor: 'pointer',
                                    padding: '0.4rem 0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.2)';
                                    e.currentTarget.style.color = '#fff1f2';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.1)';
                                    e.currentTarget.style.color = '#fda4af';
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 7h-9"></path>
                                    <path d="M14 17H5"></path>
                                    <circle cx="17" cy="17" r="3"></circle>
                                    <circle cx="7" cy="7" r="3"></circle>
                                    <path d="m9.2 10 3.2 4"></path>
                                    <path d="m14.8 10-3.2 4"></path>
                                </svg>
                                {lang === 'ja' ? 'コンテキストを切り離す' : 'Sever Context'}
                            </button>
                        )}

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                transition: 'background-color 0.2s, color 0.2s'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#94a3b8';
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Chunk Selector */}
                {availableChunks.length > 1 && (
                    <div style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        gap: '0.5rem',
                        overflowX: 'auto',
                        whiteSpace: 'nowrap',
                        alignItems: 'center',
                        flexShrink: 0
                    }}>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginRight: '0.5rem' }}>
                            {lang === 'ja' ? 'コンテキスト区切り (Chunk) :' : 'Context Chunks:'}
                        </span>
                        {availableChunks.map(chunkIndex => (
                            <button
                                key={`chunk_btn_${chunkIndex}`}
                                onClick={() => setSelectedChunk(chunkIndex)}
                                style={{
                                    background: selectedChunk === chunkIndex ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                                    color: selectedChunk === chunkIndex ? 'white' : '#cbd5e1',
                                    border: '1px solid',
                                    borderColor: selectedChunk === chunkIndex ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
                                    padding: '0.35rem 0.8rem',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: selectedChunk === chunkIndex ? '0 0 10px rgba(56, 189, 248, 0.4)' : 'none'
                                }}
                            >
                                Part {chunkIndex + 1} {chunkIndex === maxChunk ? '(Current)' : ''}
                            </button>
                        ))}
                    </div>
                )}

                {/* Chat Log Body */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}>
                    {interactions.length === 0 ? (
                        <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '2rem' }}>
                            {lang === 'ja' ? 'このストーリーにはまだ生成履歴がありません。' : 'No generation history for this story yet.'}
                        </div>
                    ) : (
                        interactions
                            .filter(msg => (msg.chunkId || 0) === selectedChunk)
                            .map((msg) => {
                                const isSystem = msg.role === 'system';
                                const isUser = msg.role === 'user';
                                const isAi = msg.role === 'ai';

                                return (
                                    <div key={msg.id} style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: isUser ? 'flex-end' : 'flex-start',
                                        alignSelf: isSystem ? 'center' : 'auto',
                                        width: isSystem ? '100%' : '100%'
                                    }}>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: '#64748b',
                                            marginBottom: '0.25rem',
                                            marginLeft: isUser ? 0 : '0.5rem',
                                            marginRight: isUser ? '0.5rem' : 0,
                                            alignSelf: isSystem ? 'center' : (isUser ? 'flex-end' : 'flex-start')
                                        }}>
                                            {formatDate(msg.createdAt)}
                                        </div>

                                        {isSystem && (
                                            <div style={{
                                                backgroundColor: 'rgba(234, 179, 8, 0.1)', // Yellow tint for system
                                                border: '1px solid rgba(234, 179, 8, 0.2)',
                                                color: '#fde047',
                                                padding: '0.75rem 1rem',
                                                borderRadius: '8px',
                                                maxWidth: '90%',
                                                fontFamily: 'monospace',
                                                fontSize: '0.85rem',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                width: '100%'
                                            }}>
                                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#fef08a' }}>SYSTEM PROMPT</div>
                                                {msg.content}
                                            </div>
                                        )}

                                        {isUser && (
                                            <div style={{
                                                backgroundColor: '#3b82f6', // Blue for User
                                                color: 'white',
                                                padding: '1rem',
                                                borderRadius: '16px 16px 0 16px',
                                                maxWidth: '85%',
                                                fontSize: '0.95rem',
                                                lineHeight: '1.5',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}>
                                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.85rem', opacity: 0.8 }}>PAYLOAD (Context + Editor Content)</div>
                                                {msg.content}
                                            </div>
                                        )}

                                        {isAi && (
                                            <div style={{
                                                backgroundColor: '#27272a', // Dark Gray for AI
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                color: '#e2e8f0',
                                                padding: '1rem',
                                                borderRadius: '16px 16px 16px 0',
                                                maxWidth: '85%',
                                                fontSize: '0.95rem',
                                                lineHeight: '1.6',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}>
                                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#38bdf8', fontSize: '0.85rem' }}>WOMB / GEMINI</div>

                                                {/* Thought Process Accordion */}
                                                {msg.thoughtSummary && (
                                                    <div style={{ marginBottom: '1rem' }}>
                                                        <button
                                                            onClick={() => toggleThought(msg.id)}
                                                            style={{
                                                                background: 'rgba(56, 189, 248, 0.1)',
                                                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                                                color: '#7dd3fc',
                                                                padding: '0.5rem 0.75rem',
                                                                borderRadius: '6px',
                                                                fontSize: '0.8rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                cursor: 'pointer',
                                                                width: '100%',
                                                                textAlign: 'left'
                                                            }}
                                                        >
                                                            <svg
                                                                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                                style={{ transform: expandedThoughts.has(msg.id) ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                                                            >
                                                                <polyline points="6 9 12 15 18 9"></polyline>
                                                            </svg>
                                                            {expandedThoughts.has(msg.id)
                                                                ? (lang === 'ja' ? '思考プロセスを隠す' : 'Hide Thought Process')
                                                                : (lang === 'ja' ? '思考プロセスを表示 (Thinking Log)' : 'Show Thought Process (Thinking Log)')
                                                            }
                                                        </button>
                                                        {expandedThoughts.has(msg.id) && (
                                                            <div style={{
                                                                marginTop: '0.5rem',
                                                                padding: '0.75rem',
                                                                backgroundColor: 'rgba(0,0,0,0.3)',
                                                                borderLeft: '2px solid #38bdf8',
                                                                borderRadius: '0 4px 4px 0',
                                                                fontSize: '0.85rem',
                                                                color: '#cbd5e1',
                                                                fontFamily: 'monospace',
                                                                whiteSpace: 'pre-wrap'
                                                            }}>
                                                                {msg.thoughtSummary}

                                                                {/* Debug: Raw Thought Parts (Inside Accordion) */}
                                                                {showWombDebugInfo && msg.rawParts && msg.rawParts.length > 0 && (
                                                                    (() => {
                                                                        const signatures = msg.rawParts
                                                                            .filter(p => typeof p.thoughtSignature === 'string')
                                                                            .map(p => p.thoughtSignature);

                                                                        const thoughtCalls = msg.rawParts
                                                                            .filter(p => !!p.thoughtCall);

                                                                        if (signatures.length === 0 && thoughtCalls.length === 0) return null;

                                                                        return (
                                                                            <div style={{
                                                                                marginTop: '1rem',
                                                                                paddingTop: '0.75rem',
                                                                                borderTop: '1px dashed rgba(56, 189, 248, 0.4)'
                                                                            }}>
                                                                                <div style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                                                                                    [DEBUG] Raw Signature:
                                                                                </div>
                                                                                <pre style={{
                                                                                    margin: 0,
                                                                                    color: '#94a3b8',
                                                                                    fontSize: '0.75rem',
                                                                                    overflowX: 'auto',
                                                                                    whiteSpace: 'pre-wrap',
                                                                                    wordBreak: 'break-all'
                                                                                }}>
                                                                                    {signatures.join('\n\n')}
                                                                                    {thoughtCalls.map(tc => `\n\n[cord.thoughtCall] ${tc.thoughtCall?.name}: ${tc.thoughtCall?.args?.thought}`).join('')}
                                                                                </pre>
                                                                            </div>
                                                                        );
                                                                    })()
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Generated Content */}
                                                {msg.content}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div>
    );
};
