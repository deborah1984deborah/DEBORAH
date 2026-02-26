import React, { useState, useEffect, useRef } from 'react';
import { TooltipButton } from '../shared/TooltipButton';
import { useCordChat } from '../../hooks/cord/useCordChat';
import { CordSessionModal } from './CordSessionModal';

interface CordChatProps {
    lang: 'ja' | 'en';
    currentStoryId?: string;
    showDebugInfo?: boolean;
    apiKey: string;
    aiModel: 'gemini-2.5-flash' | 'gemini-3.1-pro-preview';
    getWombContext?: () => Promise<{ systemInstruction: string, entityContext?: string, scanTargetContent?: string, matchedLoreItems: any[], allActiveLoreItems: any[], allLoreItems: any[], cleanedContent: string, storyTitle: string }>;
    onProcessingChange?: (isProcessing: boolean) => void;
    onDebugDataChange?: (debugData: { systemPrompt: string, inputText: string, matchedEntities: any[] }) => void;
    isBackgroundProcessing?: boolean;
    processingTargetName?: string | null;
    triggerAutoHistory?: () => void;
    triggerWombGeneration?: (blueprintOverride?: string) => Promise<void>;
}

export const CordChat: React.FC<CordChatProps> = ({
    lang, currentStoryId, showDebugInfo = false, apiKey, aiModel,
    getWombContext, onProcessingChange, onDebugDataChange,
    isBackgroundProcessing = false, processingTargetName = null,
    triggerAutoHistory, triggerWombGeneration
}) => {
    // Integrate Custom Hook
    const {
        sessions,
        currentSessionId,
        messages,
        isTyping,
        isStreaming,
        streamingText,
        streamingThought,
        addMessage,
        generateAiResponse,
        deleteSession,
        startNewSession,
        setCurrentSessionId,
        editMessage,
        deleteMessage,
        toggleWombAwareness,
        chatScope,
        setChatScope,
        isNewChatAwareOfWombStory,
        setIsNewChatAwareOfWombStory,
        cordDebugSystemPrompt,
        cordDebugInputText,
        cordDebugMatchedEntities
    } = useCordChat(currentStoryId, lang, triggerAutoHistory, triggerWombGeneration);

    const [inputValue, setInputValue] = useState('');
    const [showHistory, setShowHistory] = useState(false); // Modal State
    // Edit Message State
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    // Hover State for showing icons
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isLocked = isTyping || isBackgroundProcessing;

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

    useEffect(() => {
        if (onProcessingChange) {
            onProcessingChange(isTyping);
        }
    }, [isTyping, onProcessingChange]);

    useEffect(() => {
        if (onDebugDataChange) {
            onDebugDataChange({
                systemPrompt: cordDebugSystemPrompt,
                inputText: cordDebugInputText,
                matchedEntities: cordDebugMatchedEntities
            });
        }
    }, [cordDebugSystemPrompt, cordDebugInputText, cordDebugMatchedEntities, onDebugDataChange]);

    const handleSend = () => {
        if (!inputValue.trim() || isTyping) return;

        // 1. Add User Message (Returns active sessionId)
        const activeSessionId = addMessage('user', inputValue, currentSessionId || undefined);
        setInputValue('');

        // 2. Trigger AI Response
        if (activeSessionId) {
            generateAiResponse(activeSessionId, apiKey, aiModel, getWombContext);
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

    // --- Event Listener setup for Background/Remote triggers ---
    useEffect(() => {
        const handleStartBackgroundMode = (e: Event) => {
            const customEvent = e as CustomEvent<{ targetName: string, isFullHistory: boolean }>;
            const { targetName } = customEvent.detail;

            // Set Scope to Global to allow history extraction
            setChatScope('global');

            // Generate system prompt/message asking AI to perform history extraction
            const instructionMsg = lang === 'ja'
                ? `【自動ヒストリー抽出リクエスト】\n現在エディタに書かれている最新の本文を分析し、「${targetName}」に関する新しい出来事や情報を抽出してください。\n抽出内容があれば、追加ツール(add_womb_history)を使用してデータベースに登録してください。`
                : `[Auto History Extraction Request]\nPlease analyze the latest text in the editor and extract any new events or information regarding "${targetName}".\nIf there is new information, use the add_womb_history tool to register it to the database.`;

            // Adding the message will automatically trigger the API if we call generateAiResponse
            // Pass undefined for functionCall, rawParts, thoughtSummary, and true for isAutoGenerated
            const newSessionId = addMessage('user', instructionMsg, currentSessionId || undefined, undefined, undefined, undefined, true);
            generateAiResponse(newSessionId, apiKey, aiModel, getWombContext);

            // Close modal if open to show the work (handled by parent usually, but we manage state here)
            setShowHistory(false);
        };

        const handleRequestWombGen = () => {
            console.log("[CordChat] Received cord:request-womb-gen event.");
            // Always ensure the active session is aware of WOMB
            if (!chatScope) setChatScope('story');
            if (currentSessionId) {
                const session = sessions.find(s => s.id === currentSessionId);
                if (session && !session.isAwareOfWombStory) {
                    toggleWombAwareness(currentSessionId, true);
                }
            } else {
                setIsNewChatAwareOfWombStory(true);
            }

            // Create the user message that triggers the generation
            const instructionMsg = lang === 'ja'
                ? `【自動生成リクエスト】\n現在の本文の展開をもとに、Narrative Blueprint（執筆指示）を作成し、WOMBへ物語の続きの執筆処理を開始させてください。`
                : `[Auto Generation Request]\nBased on the current text, create a Narrative Blueprint (writing instructions) and trigger WOMB to write the continuation of the story.`;

            // Add the message to chat and immediately trigger generation
            // Pass undefined for functionCall, rawParts, thoughtSummary, and true for isAutoGenerated
            const newSessionId = addMessage('user', instructionMsg, currentSessionId || undefined, undefined, undefined, undefined, true);
            generateAiResponse(newSessionId, apiKey, aiModel, getWombContext);
        };

        window.addEventListener('cord:start-background-mode', handleStartBackgroundMode);
        window.addEventListener('cord:request-womb-gen', handleRequestWombGen);

        return () => {
            window.removeEventListener('cord:start-background-mode', handleStartBackgroundMode);
            window.removeEventListener('cord:request-womb-gen', handleRequestWombGen);
        };
    }, [lang, currentSessionId, setChatScope, addMessage, sessions, toggleWombAwareness, setIsNewChatAwareOfWombStory, chatScope]);

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
                    zIndex: 900,
                    pointerEvents: 'none',
                    borderBottomLeftRadius: '4px'
                }}>
                    Sessions: {sessions.length} | ID: {currentSessionId || 'null'}
                </div>
            )}

            {/* BACKGROUND PROCESSING INDICATOR */}
            {isBackgroundProcessing && (
                <div style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
                    padding: '0.4rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#38bdf8',
                    fontSize: '0.8rem',
                    zIndex: 10,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                    {/* Spinner */}
                    <svg style={{ animation: 'spin 1.5s linear infinite' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="2" x2="12" y2="6"></line>
                        <line x1="12" y1="18" x2="12" y2="22"></line>
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                        <line x1="2" y1="12" x2="6" y2="12"></line>
                        <line x1="18" y1="12" x2="22" y2="12"></line>
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                        <line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line>
                    </svg>
                    <span>
                        {lang === 'ja'
                            ? `Active CORD: ヒストリーを自動更新中... ${processingTargetName ? `(${processingTargetName})` : ''}`
                            : `Active CORD: Auto-updating history... ${processingTargetName ? `(${processingTargetName})` : ''}`}
                    </span>
                    {/* Inject spin keyframes here for simplicity since we don't have a global css yet */}
                    <style>{`
                        @keyframes spin { 100% { transform: rotate(360deg); } }
                    `}</style>
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
                    {messages.map((msg) => {
                        // Skip rendering empty messages that are purely function calls (no text AND no thought)
                        if (msg.role === 'ai' && !msg.content && !msg.thoughtSummary && msg.functionCall) {
                            return null;
                        }

                        // Style 'function' role messages as system logs
                        if (msg.role === 'function' || msg.role === 'system') {
                            return (
                                <div key={msg.id} style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    margin: '0.5rem 0'
                                }}>
                                    <div style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        color: '#94a3b8',
                                        padding: '0.8rem 1rem',
                                        borderRadius: '16px',
                                        fontSize: '0.8rem',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.5rem',
                                        maxWidth: '85%'
                                    }}>
                                        <svg style={{ flexShrink: 0, marginTop: '0.1rem' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="16" x2="12" y2="12"></line>
                                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                        </svg>
                                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            );
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
                                                if (confirm(lang === 'ja' ? 'このメッセージを削除しますか？' : 'Delete this message?')) {
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
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            {msg.role === 'ai' && (msg.thoughtSummary || (showDebugInfo && msg.rawParts?.some(p => p.thought_signature || p.thoughtSignature))) && (
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
                                                        {lang === 'ja' ? '💭 思考プロセス (Thinking)' : '💭 Thinking Process'}
                                                    </summary>
                                                    <div style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                                                        {msg.thoughtSummary && (
                                                            <div style={{ marginBottom: '0.5rem' }}>{msg.thoughtSummary}</div>
                                                        )}
                                                        {showDebugInfo && msg.rawParts && (
                                                            msg.rawParts.filter(p => p.thought_signature || p.thoughtSignature).map((p, i) => (
                                                                <div key={`sig-${i}`} style={{ color: '#fbbf24', fontSize: '0.7rem', wordBreak: 'break-all', fontFamily: 'monospace', marginTop: '0.5rem' }}>
                                                                    [Signature {i + 1}]: {p.thought_signature || p.thoughtSignature}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </details>
                                            )}
                                            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                {/* If this AI message has a womb generation command with a blueprint, show it prominently */}
                                                {msg.role === 'ai' && msg.functionCall?.name === 'trigger_womb_generation' && msg.functionCall?.args?.blueprint_text && (
                                                    <div style={{
                                                        marginTop: msg.content ? '1rem' : '0',
                                                        marginBottom: '1rem',
                                                        padding: '1rem',
                                                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                                        border: '1px solid rgba(56, 189, 248, 0.3)',
                                                        borderRadius: '8px',
                                                        borderLeft: '4px solid #38bdf8'
                                                    }}>
                                                        <div style={{
                                                            fontSize: '0.8rem',
                                                            color: '#38bdf8',
                                                            fontWeight: 'bold',
                                                            marginBottom: '0.5rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem'
                                                        }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                            </svg>
                                                            Narrative Blueprint
                                                        </div>
                                                        <div style={{ color: '#e0f2fe', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                                            {msg.functionCall.args.blueprint_text}
                                                        </div>
                                                    </div>
                                                )}
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
                                                {msg.content}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Streaming AI Message */}
                    {isStreaming && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                position: 'relative',
                                marginBottom: '1rem'
                            }}
                        >
                            <div style={{
                                width: 'auto',
                                maxWidth: '70%',
                                padding: '0.8rem 1.2rem',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: '#e2e8f0',
                                borderTopLeftRadius: '2px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {streamingThought && (
                                        <details open style={{
                                            fontSize: '0.8rem',
                                            color: 'rgba(255,255,255,0.6)',
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            padding: '0.4rem',
                                            borderRadius: '4px',
                                            marginBottom: '0.5rem',
                                            cursor: 'pointer'
                                        }}>
                                            <summary style={{ outline: 'none', userSelect: 'none', fontWeight: 'bold' }}>
                                                {lang === 'ja' ? '💭 思考プロセス (Thinking...)' : '💭 Thinking Process...'}
                                            </summary>
                                            <div style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                                                <div style={{ marginBottom: '0.5rem' }}>
                                                    {streamingThought}
                                                    {(!streamingText) && <span style={{ opacity: 0.7 }}>_</span>}
                                                </div>
                                            </div>
                                        </details>
                                    )}
                                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {streamingText}
                                        {(!streamingThought || streamingText) && <span style={{ opacity: 0.7 }}>_</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Typing Indicator */}
                    {isTyping && !isStreaming && (
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
                    left: '1rem',
                    right: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.4rem',
                }}>
                    {/* Story Awareness Toggle (Visual Only for now) */}
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.8rem',
                        color: '#94a3b8',
                        cursor: isLocked ? 'default' : 'pointer',
                        userSelect: 'none',
                        marginTop: '6px' // Pushed down slightly more
                    }}>
                        <input
                            type="checkbox"
                            checked={currentSessionId ? (activeSession?.isAwareOfWombStory || false) : isNewChatAwareOfWombStory}
                            onChange={(e) => {
                                if (currentSessionId) {
                                    toggleWombAwareness(currentSessionId, e.target.checked);
                                } else {
                                    setIsNewChatAwareOfWombStory(e.target.checked);
                                }
                            }}
                            disabled={isLocked}
                            style={{
                                accentColor: '#38bdf8',
                                width: '14px',
                                height: '14px',
                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                opacity: isLocked ? 0.5 : 1
                            }}
                        />
                        {lang === 'ja' ? 'CORDがWOMBのストーリーを把握する' : 'CORD is aware of WOMB Story'}
                    </label>

                    {/* Right side icons */}
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                        {/* View History / Save (Folder) */}
                        <TooltipButton
                            label={lang === 'ja' ? '保存済み / 履歴' : 'Saved / History'}
                            placement="top"
                            variant="neon-blue"
                            onClick={handleSaveHistory}
                            disabled={isLocked}
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
                            disabled={isLocked}
                            icon={
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Input Area Container (Reverted to simple row) */}
            <div style={{
                padding: '1rem',
                borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-end',
                opacity: isLocked ? 0.5 : 1, // Visually dim when locked
                pointerEvents: isLocked ? 'none' : 'auto', // Lock inputs
                transition: 'opacity 0.2s'
            }}>
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={lang === 'ja' ? 'メッセージを入力...' : 'Type a message...'}
                    disabled={isLocked}
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
                        cursor: isLocked ? 'not-allowed' : 'text'
                    }}
                    rows={1}
                />
                <button
                    onClick={handleSend}
                    disabled={isLocked}
                    style={{
                        backgroundColor: '#38bdf8',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.8rem 1.2rem',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => { if (!isLocked) e.currentTarget.style.opacity = '0.9'; }}
                    onMouseOut={(e) => { if (!isLocked) e.currentTarget.style.opacity = '1'; }}
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
