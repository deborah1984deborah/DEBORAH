import React from 'react';
import { ChatMessage } from '../../../types';
import { CordChatMessageSystem } from './CordChatMessageSystem';
import { CordChatInlineEditor } from './CordChatInlineEditor';
import { CordChatMessageThought } from './CordChatMessageThought';
import { CordChatMessageBlueprint } from './CordChatMessageBlueprint';

interface CordChatMessageProps {
    msg: ChatMessage;
    lang: 'ja' | 'en';
    isLocked: boolean;
    editingMessageId: string | null;
    editValue: string;
    setEditValue: (val: string) => void;
    setEditingMessageId: (id: string | null) => void;
    hoveredMessageId: string | null;
    setHoveredMessageId: (id: string | null) => void;
    editMessage: (id: string, newContent: string) => void;
    deleteMessage: (id: string) => void;
    showDebugInfo: boolean;
}

export const CordChatMessage: React.FC<CordChatMessageProps> = ({
    msg,
    lang,
    isLocked,
    editingMessageId,
    editValue,
    setEditValue,
    setEditingMessageId,
    hoveredMessageId,
    setHoveredMessageId,
    editMessage,
    deleteMessage,
    showDebugInfo
}) => {
    // Skip rendering empty messages that are purely function calls (no text AND no thought)
    if (msg.role === 'ai' && !msg.content && !msg.thoughtSummary && msg.functionCall) {
        return null;
    }

    // Style 'function' role messages as system logs
    if (msg.role === 'function' || msg.role === 'system') {
        return <CordChatMessageSystem msg={msg} />;
    }

    return (
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
                        disabled={isLocked}
                        onClick={() => {
                            setEditingMessageId(msg.id);
                            setEditValue(msg.content);
                        }}
                        style={{
                            background: 'none', border: 'none', color: '#38bdf8', cursor: isLocked ? 'not-allowed' : 'pointer', padding: '0.2rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: isLocked ? 0.3 : 1
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
                        disabled={isLocked}
                        onClick={() => {
                            if (window.confirm(lang === 'ja' ? 'このメッセージを削除しますか？' : 'Delete this message?')) {
                                deleteMessage(msg.id);
                            }
                        }}
                        style={{
                            background: 'none', border: 'none', color: '#f87171', cursor: isLocked ? 'not-allowed' : 'pointer', padding: '0.2rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: isLocked ? 0.3 : 1
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
                backgroundColor: msg.role === 'user'
                    ? (msg.isAutoGenerated ? 'rgba(56, 189, 248, 0.15)' : '#38bdf8') // Muted blue for auto-generated
                    : 'rgba(255, 255, 255, 0.05)',
                color: msg.role === 'user'
                    ? (msg.isAutoGenerated ? '#e0f2fe' : '#0f172a') // Light text for auto-generated
                    : '#e2e8f0',
                border: msg.isAutoGenerated ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
                borderTopRightRadius: msg.role === 'user' ? '2px' : '12px',
                borderTopLeftRadius: msg.role === 'ai' ? '2px' : '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                {editingMessageId === msg.id ? (
                    <CordChatInlineEditor
                        msg={msg}
                        lang={lang}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        setEditingMessageId={setEditingMessageId}
                        editMessage={editMessage}
                    />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <CordChatMessageThought msg={msg} lang={lang} showDebugInfo={showDebugInfo} />
                        {showDebugInfo && msg.role === 'ai' && msg.rawParts && msg.rawParts.some(p => p.functionCall) && (
                            msg.rawParts.filter(p => p.functionCall).map((p, i) => {
                                if (p && p.functionCall) {
                                    return (
                                        <div key={`fn-${i}`}>
                                            <details style={{
                                                fontSize: '0.8rem',
                                                color: 'rgba(255,255,255,0.6)',
                                                backgroundColor: 'rgba(0,0,0,0.2)',
                                                padding: '0.4rem',
                                                borderRadius: '4px',
                                                marginBottom: '0.5rem',
                                                cursor: 'pointer'
                                            }}>
                                                <summary style={{ outline: 'none', userSelect: 'none', fontWeight: 'bold' }}>
                                                    {lang === 'ja' ? `⚙️ ${p.functionCall.name} (内部プロセス)` : `⚙️ ${p.functionCall.name} (Internal Process)`}
                                                </summary>
                                                <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8' }}>
                                                    {JSON.stringify(p.functionCall.args, null, 2)}
                                                </pre>
                                            </details>
                                        </div>
                                    );
                                }
                                return null;
                            })
                        )}
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {msg.isAutoGenerated && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    marginBottom: '0.4rem',
                                    fontSize: '0.75rem',
                                    color: '#38bdf8',
                                    fontWeight: 'bold',
                                    opacity: 0.9
                                }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                    </svg>
                                    <span>{lang === 'ja' ? 'システムからの自動リクエスト' : 'Auto System Request'}</span>
                                </div>
                            )}

                            {/* --- Split and render tool calls inline --- */}
                            {(() => {
                                const TOOL_START_TAG = "===BEGIN_TOOL_CALL===";
                                const TOOL_END_TAG = "===END_TOOL_CALL===";

                                if (msg.role === 'ai' && msg.content && msg.content.includes(TOOL_START_TAG) && msg.content.includes(TOOL_END_TAG)) {
                                    // Split the text into parts (before tool, the tool, after tool)
                                    // We'll use a simple regex to capture the blocks
                                    const regex = /===BEGIN_TOOL_CALL===([\s\S]*?)===END_TOOL_CALL===/g;
                                    const parts = [];
                                    let lastIndex = 0;
                                    let match;

                                    while ((match = regex.exec(msg.content)) !== null) {
                                        // Text before the tool
                                        if (match.index > lastIndex) {
                                            const preText = msg.content.substring(lastIndex, match.index).trim();
                                            if (preText) {
                                                parts.push(<span key={`text-${lastIndex}`}>{preText}{'\n\n'}</span>);
                                            }
                                        }

                                        // The tool json block
                                        const jsonStr = match[1].replace(/^```json/g, "").replace(/^```/g, "").replace(/```$/g, "").trim();
                                        try {
                                            const parsedTool = JSON.parse(jsonStr.replace(/\n/g, "\\n").replace(/\r/g, "\\r"));
                                            if (parsedTool.name) {
                                                parts.push(
                                                    <details key={`tool-${match.index}`} style={{
                                                        marginTop: '0.8rem',
                                                        marginBottom: '0.8rem',
                                                        fontSize: '0.85rem',
                                                        color: 'rgba(255,255,255,0.8)',
                                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                                        borderRadius: '8px',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <summary style={{
                                                            outline: 'none',
                                                            userSelect: 'none',
                                                            fontWeight: 'bold',
                                                            padding: '0.6rem 0.8rem',
                                                            backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            color: '#bae6fd'
                                                        }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                                                            </svg>
                                                            {lang === 'ja' ? `ツールを使用しました: ${parsedTool.name}` : `Used Tool: ${parsedTool.name}`}
                                                        </summary>
                                                        <pre style={{
                                                            margin: 0,
                                                            whiteSpace: 'pre-wrap',
                                                            wordBreak: 'break-word',
                                                            padding: '0.8rem',
                                                            fontFamily: 'monospace',
                                                            fontSize: '0.75rem',
                                                            color: '#94a3b8'
                                                        }}>
                                                            {JSON.stringify(parsedTool.args, null, 2)}
                                                        </pre>
                                                    </details>
                                                );
                                            }
                                        } catch (e) {
                                            // Fallback if JSON parse fails inside UI (should never happen)
                                            parts.push(<span key={`fail-${match.index}`}>{match[0]}{'\n\n'}</span>);
                                        }

                                        lastIndex = regex.lastIndex;
                                    }

                                    // Text after the last tool
                                    if (lastIndex < msg.content.length) {
                                        const postText = msg.content.substring(lastIndex).trim();
                                        if (postText) {
                                            parts.push(<span key={`text-${lastIndex}`}>{postText}</span>);
                                        }
                                    }

                                    return parts.length > 0 ? parts : msg.content;
                                }

                                // Fallback for normal messages or when regex fails
                                return msg.content;
                            })()}

                            {/* If this AI message has a womb generation command with a blueprint, show it prominently at the bottom */}
                            <CordChatMessageBlueprint msg={msg} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
