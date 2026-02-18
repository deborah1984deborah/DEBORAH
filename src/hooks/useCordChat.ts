import { useState, useEffect } from 'react';
import { ChatSession, ChatMessage } from '../types';

const STORAGE_KEY_SESSIONS = 'cord_chat_sessions';
const STORAGE_KEY_MESSAGES_PREFIX = 'cord_chat_messages_';

export const useCordChat = (currentStoryId?: string) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

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

    // Action: Add Message (Handles Validation & Saving)
    const addMessage = (role: 'user' | 'ai' | 'system', content: string) => {
        let activeSessionId = currentSessionId;
        let currentSessions = sessions;

        // 1. If no session is active, create one NOW
        if (!activeSessionId) {
            const newSession: ChatSession = {
                id: Date.now().toString(),
                title: 'New Chat', // TODO: Generate title from content later
                storyId: currentStoryId, // Link to current story if exists
                isGlobal: !currentStoryId, // Global if no story selected
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            // Update local list for THIS render cycle
            currentSessions = [newSession, ...sessions];
            activeSessionId = newSession.id;
            setCurrentSessionId(activeSessionId);

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

        // 3. Save Message
        // Ensure we combine existing messages correctly
        const currentMessages = currentSessionId ? messages : [];
        const updatedMessages = [...currentMessages, newMessage];

        localStorage.setItem(STORAGE_KEY_MESSAGES_PREFIX + activeSessionId!, JSON.stringify(updatedMessages));
        setMessages(updatedMessages);

        // 4. Update Session Timestamp & Save Sessions (Using currentSessions which includes new session if any)
        const updatedSessions = currentSessions.map(s =>
            s.id === activeSessionId ? { ...s, updatedAt: Date.now() } : s
        );
        saveSessionsToStorage(updatedSessions);
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

    return {
        sessions,
        currentSessionId,
        messages,
        setCurrentSessionId,
        startNewSession, // Renamed from createNewSession
        addMessage,
        deleteSession,
        // Filter helper
        filteredSessions: sessions.filter(s =>
            s.isGlobal || (currentStoryId && s.storyId === currentStoryId)
        )
    };
};
