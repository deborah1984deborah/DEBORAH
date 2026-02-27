import React, { useState, useEffect, useRef } from 'react';
import { useCordChat } from '../../../hooks/cord/useCordChat';
import { CordSessionModal } from '../CordSessionModal';
import { CordChatMessage } from './CordChatMessage';
import { CordChatInput } from './CordChatInput';
import { CordChatToolbar } from './CordChatToolbar';
import { CordChatScopeSelector } from './CordChatScopeSelector';
import { CordChatStreamingMessage } from './CordChatStreamingMessage';
import { CordChatBackgroundIndicator, CordChatTypingIndicator } from './CordChatIndicators';

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
    isWombGenerating?: boolean;
    cordOutputLength: number;
}

export const CordChat: React.FC<CordChatProps> = ({
    lang, currentStoryId, showDebugInfo = false, apiKey, aiModel,
    getWombContext, onProcessingChange, onDebugDataChange,
    isBackgroundProcessing = false, processingTargetName = null,
    triggerAutoHistory, triggerWombGeneration, isWombGenerating = false,
    cordOutputLength
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
    } = useCordChat(currentStoryId, lang, triggerAutoHistory, triggerWombGeneration, cordOutputLength);

    const [inputValue, setInputValue] = useState('');
    const [showHistory, setShowHistory] = useState(false); // Modal State
    // Edit Message State
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    // Hover State for showing icons
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isLocked = isTyping || isBackgroundProcessing || isWombGenerating;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Determine which scope to DISPLAY:
    // If a session is active, show that session's actual scope.
    // Otherwise, show the user's current selected preference for the NEXT session.
    const activeSession = currentSessionId ? sessions.find(s => s.id === currentSessionId) || null : null;
    const displayedScope = activeSession ? (activeSession.isGlobal ? 'global' : 'story') : chatScope;

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isStreaming, streamingText]);

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
        if (window.confirm(lang === 'ja' ? '新しいチャットを開始しますか？' : 'Start a new chat?')) {
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
            if (newSessionId) {
                generateAiResponse(newSessionId, apiKey, aiModel, getWombContext);
            }

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
            if (newSessionId) {
                generateAiResponse(newSessionId, apiKey, aiModel, getWombContext);
            }
        };

        window.addEventListener('cord:start-background-mode', handleStartBackgroundMode);
        window.addEventListener('cord:request-womb-gen', handleRequestWombGen);

        return () => {
            window.removeEventListener('cord:start-background-mode', handleStartBackgroundMode);
            window.removeEventListener('cord:request-womb-gen', handleRequestWombGen);
        };
    }, [lang, currentSessionId, setChatScope, addMessage, sessions, toggleWombAwareness, setIsNewChatAwareOfWombStory, chatScope, apiKey, aiModel, getWombContext, generateAiResponse]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            position: 'relative' // Ensure clean stacking
        }}>
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
            <CordChatBackgroundIndicator
                lang={lang}
                isBackgroundProcessing={isBackgroundProcessing}
                processingTargetName={processingTargetName}
            />

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
                    <CordChatScopeSelector
                        lang={lang}
                        isLocked={isLocked}
                        displayedScope={displayedScope}
                        currentSessionId={currentSessionId}
                        setChatScope={setChatScope}
                    />

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

                    {messages.map((msg) => (
                        <CordChatMessage
                            key={msg.id}
                            msg={msg}
                            lang={lang}
                            isLocked={isLocked}
                            editingMessageId={editingMessageId}
                            setEditingMessageId={setEditingMessageId}
                            editValue={editValue}
                            setEditValue={setEditValue}
                            hoveredMessageId={hoveredMessageId}
                            setHoveredMessageId={setHoveredMessageId}
                            editMessage={editMessage}
                            deleteMessage={deleteMessage}
                            showDebugInfo={showDebugInfo}
                        />
                    ))}

                    {/* Streaming AI Message */}
                    {isStreaming && (
                        <CordChatStreamingMessage
                            lang={lang}
                            streamingThought={streamingThought}
                            streamingText={streamingText}
                        />
                    )}

                    {/* Typing Indicator */}
                    <CordChatTypingIndicator
                        lang={lang}
                        isTyping={isTyping}
                        isStreaming={isStreaming}
                    />

                    <div ref={messagesEndRef} />
                </div>

                <CordChatToolbar
                    lang={lang}
                    isLocked={isLocked}
                    currentSessionId={currentSessionId}
                    activeSession={activeSession}
                    isNewChatAwareOfWombStory={isNewChatAwareOfWombStory}
                    setIsNewChatAwareOfWombStory={setIsNewChatAwareOfWombStory}
                    toggleWombAwareness={toggleWombAwareness}
                    handleSaveHistory={handleSaveHistory}
                    handleNewChat={handleNewChat}
                />
            </div>

            <CordChatInput
                lang={lang}
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleKeyDown={handleKeyDown}
                handleSend={handleSend}
                isLocked={isLocked}
            />

            {/* History Modal */}
            {showHistory && (
                <CordSessionModal
                    onClose={() => setShowHistory(false)}
                    sessions={sessions}
                    currentStoryId={currentStoryId}
                    onSelectSession={handleSelectSession}
                    onDeleteSession={deleteSession}
                    lang={lang}
                />
            )}
        </div>
    );
};
