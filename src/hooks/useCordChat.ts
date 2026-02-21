import { useState, useEffect } from 'react';
import { ChatSession, ChatMessage } from '../types';

const STORAGE_KEY_SESSIONS = 'cord_chat_sessions';
const STORAGE_KEY_MESSAGES_PREFIX = 'cord_chat_messages_';

export const useCordChat = (currentStoryId?: string) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState<boolean>(false);

    // Default chat scope preference
    const [chatScope, setChatScope] = useState<'global' | 'story'>('story');

    // 1. Load Sessions on Mount
    useEffect(() => {
        const storedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
        if (storedSessions) {
            setSessions(JSON.parse(storedSessions));
        }
    }, []);

    // 2. Load Messages when Session Changes
    useEffect(() => {
        if (!currentSessionId) {
            setMessages([]);
            return;
        }

        const storedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES_PREFIX + currentSessionId);
        if (storedMessages) {
            setMessages(JSON.parse(storedMessages));
        } else {
            setMessages([]);
        }
    }, [currentSessionId]);

    // Helper: Save Sessions to LocalStorage
    const saveSessionsToStorage = (updatedSessions: ChatSession[]) => {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updatedSessions));
        setSessions(updatedSessions);
    };



    // Action: Start New Session (View Reset Only)
    const startNewSession = () => {
        setCurrentSessionId(null);
        setMessages([]);
    };

    // Action: Add Message (Handles Validation & Saving locally)
    const addMessage = (role: 'user' | 'ai' | 'system', content: string, sessionIdOverride?: string) => {
        // ALWAYS read from localStorage first to prevent closure staleness during async calls
        const storedSessionsStr = localStorage.getItem(STORAGE_KEY_SESSIONS);
        let currentSessions: ChatSession[] = storedSessionsStr ? JSON.parse(storedSessionsStr) : sessions;

        let activeSessionId = sessionIdOverride || currentSessionId;

        // 1. If no session is active, create one NOW
        if (!activeSessionId) {
            // Determine scope based on user preference AND whether a story is actually open
            const isGlobalScope = chatScope === 'global' || !currentStoryId;

            const newSession: ChatSession = {
                id: Date.now().toString(),
                title: 'New Chat',
                storyId: isGlobalScope ? undefined : currentStoryId,
                isGlobal: isGlobalScope,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            // Update local list
            currentSessions = [newSession, ...currentSessions];
            activeSessionId = newSession.id;
            setCurrentSessionId(activeSessionId); // Note: this is async, but we use activeSessionId locally

            // Initialize message storage for this new session
            localStorage.setItem(STORAGE_KEY_MESSAGES_PREFIX + newSession.id, JSON.stringify([]));
        }

        // 2. Create the message object
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            sessionId: activeSessionId!,
            role,
            content,
            createdAt: Date.now()
        };

        // 3. Save Message: Read FRESH from local storage
        const storedMessagesStr = localStorage.getItem(STORAGE_KEY_MESSAGES_PREFIX + activeSessionId!);
        let currentMessages: ChatMessage[] = [];
        if (storedMessagesStr) {
            currentMessages = JSON.parse(storedMessagesStr);
        } else if (activeSessionId === currentSessionId) {
            currentMessages = messages; // Fallback only if it's the current view
        }

        const updatedMessages = [...currentMessages, newMessage];

        localStorage.setItem(STORAGE_KEY_MESSAGES_PREFIX + activeSessionId!, JSON.stringify(updatedMessages));

        // Only update message state if we are currently viewing this session
        // (Though usually we are, but just to be safe)
        if (!currentSessionId || currentSessionId === activeSessionId) {
            setMessages(updatedMessages);
        }

        // 4. Update Session Timestamp & Save Sessions 
        const updatedSessions = currentSessions.map(s =>
            s.id === activeSessionId ? { ...s, updatedAt: Date.now() } : s
        );
        saveSessionsToStorage(updatedSessions);

        return activeSessionId; // Return ID in case caller needs to trigger AI immediately
    };

    // Action: Generate AI Response
    // We pass API details here because this hook doesn't own them
    const generateAiResponse = async (
        sessionId: string,
        apiKey: string,
        aiModel: 'gemini-2.5-flash' | 'gemini-3.1-pro-preview',
        lang: 'ja' | 'en',
        getWombContext?: () => Promise<{ systemInstruction: string, scanTargetContent: string, matchedLoreItems: any[], cleanedContent: string }>
    ) => {
        if (!apiKey) {
            // Fallback mock if no API key
            setIsTyping(true);
            setTimeout(() => {
                const responseText = lang === 'ja'
                    ? 'なるほど、それは興味深いですね。（※APIキーが未設定のためモック応答です）'
                    : 'I see, that sounds interesting. (Mock response due to missing API key)';
                addMessage('ai', responseText, sessionId);
                setIsTyping(false);
            }, 1000);
            return;
        }

        setIsTyping(true);
        try {
            const { callGeminiChat, callGemini } = await import('../utils/gemini');

            // Get latest messages for this session from state/localStorage
            const storedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES_PREFIX + sessionId);
            const currentMessages: ChatMessage[] = storedMessages ? JSON.parse(storedMessages) : messages;

            const freshSessionsStrForCheck = localStorage.getItem(STORAGE_KEY_SESSIONS);
            const freshCurrentSessions: ChatSession[] = freshSessionsStrForCheck ? JSON.parse(freshSessionsStrForCheck) : sessions;
            const currentSession = freshCurrentSessions.find(s => s.id === sessionId);

            // System prompt for CORD
            let systemPrompt = lang === 'ja'
                ? "あなたはCORDという名のアシスタントです。ユーザーの執筆やアイデア出しをクリエイティブにサポートしてください。"
                : "You are an assistant named CORD. Creatively support the user's writing and brainstorming.";

            if (currentSession?.isAwareOfWombStory && getWombContext) {
                try {
                    const wombContext = await getWombContext();
                    if (wombContext) {
                        systemPrompt += `\n\n[WOMB Story Context]\n`;
                        if (wombContext.systemInstruction) {
                            systemPrompt += `--- Matched Entities ---\n${wombContext.systemInstruction}\n\n`;
                        }
                        if (wombContext.cleanedContent) {
                            systemPrompt += `--- Story Body Text ---\n${wombContext.cleanedContent}`;
                        }
                    }
                } catch (e) {
                    console.error("Failed to load WOMB context for CORD", e);
                }
            }

            // Call Chat API
            const aiContent = await callGeminiChat(apiKey, currentMessages, aiModel, systemPrompt);

            // Add the AI message
            addMessage('ai', aiContent, sessionId);

            // --- Auto Titling Logic ---
            // If this is the FIRST exchange (User asked something, AI replied, total 2 messages)
            // Fetch fresh sessions from localStorage to avoid closure overwrite
            const freshSessionsStr = localStorage.getItem(STORAGE_KEY_SESSIONS);
            const freshSessions: ChatSession[] = freshSessionsStr ? JSON.parse(freshSessionsStr) : sessions;

            if (currentMessages.length === 1 && currentMessages[0].role === 'user') {
                const sessionToUpdate = freshSessions.find(s => s.id === sessionId);
                if (sessionToUpdate && sessionToUpdate.title === 'New Chat') {
                    try {
                        // Prompt AI to generate a title with a suitable length limit, without restricting expression
                        const titlePrompt = lang === 'ja'
                            ? `次のユーザーの入力を元に、このチャットのタイトルを20文字以内で作成してください。\n※「(〇〇文字)」のような文字数のカウントやカッコなどの補足情報は一切含めず、純粋なタイトル文字列のみを出力してください。\n\nユーザー入力: "${currentMessages[0].content}"`
                            : `Create a title for this chat based on the following user input. Keep it under 20 characters.\n* Output ONLY the pure title string without quotes, parentheses, or character counts.\n\nUser input: "${currentMessages[0].content}"`;

                        const generatedTitle = await callGemini(apiKey, titlePrompt, 'gemini-2.5-flash');
                        const cleanTitle = generatedTitle.replace(/["']/g, '').trim();

                        const updatedSessions = freshSessions.map(s =>
                            s.id === sessionId ? { ...s, title: cleanTitle } : s
                        );
                        saveSessionsToStorage(updatedSessions);
                    } catch (titleError) {
                        console.error("Failed to generate title:", titleError);
                    }
                }
            }

        } catch (error: any) {
            console.error("CORD AI Generate Error:", error);
            // Fallback to mock on API Error (e.g., invalid key)
            const responseText = lang === 'ja'
                ? 'なるほど、それは興味深いですね。（※API通信エラーのためモック応答です）'
                : 'I see, that sounds interesting. (Mock response due to API error)';
            addMessage('ai', responseText, sessionId);
        } finally {
            setIsTyping(false);
        }
    };

    // Action: Delete Session
    const deleteSession = (sessionId: string) => {
        // 1. Remove from sessions list
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(updatedSessions);
        saveSessionsToStorage(updatedSessions);

        // 2. Remove messages for this session
        localStorage.removeItem(STORAGE_KEY_MESSAGES_PREFIX + sessionId);

        // 3. Reset View if current session was deleted
        if (currentSessionId === sessionId) {
            setCurrentSessionId(null);
            setMessages([]);
        }
    };

    // Action: Toggle WOMB Awareness
    const toggleWombAwareness = (sessionId: string, isAware: boolean) => {
        const storedSessionsStr = localStorage.getItem(STORAGE_KEY_SESSIONS);
        let currentSessions: ChatSession[] = storedSessionsStr ? JSON.parse(storedSessionsStr) : sessions;

        const updatedSessions = currentSessions.map(s =>
            s.id === sessionId ? { ...s, isAwareOfWombStory: isAware } : s
        );
        saveSessionsToStorage(updatedSessions);
    };

    // Action: Edit Message
    const editMessage = (messageId: string, newContent: string) => {
        if (!currentSessionId) return;

        const updatedMessages = messages.map(msg =>
            msg.id === messageId ? { ...msg, content: newContent } : msg
        );

        setMessages(updatedMessages);
        localStorage.setItem(STORAGE_KEY_MESSAGES_PREFIX + currentSessionId, JSON.stringify(updatedMessages));
    };

    // Action: Delete Message
    const deleteMessage = (messageId: string) => {
        if (!currentSessionId) return;

        const updatedMessages = messages.filter(msg => msg.id !== messageId);

        setMessages(updatedMessages);
        localStorage.setItem(STORAGE_KEY_MESSAGES_PREFIX + currentSessionId, JSON.stringify(updatedMessages));
    };

    return {
        sessions,
        currentSessionId,
        messages,
        isTyping,
        setCurrentSessionId,
        startNewSession, // Renamed from createNewSession
        addMessage,
        generateAiResponse,
        deleteSession,
        editMessage,
        deleteMessage,
        toggleWombAwareness,
        chatScope,
        setChatScope,
        // Filter helper
        filteredSessions: sessions.filter(s =>
            s.isGlobal || (currentStoryId && s.storyId === currentStoryId)
        )
    };
};
