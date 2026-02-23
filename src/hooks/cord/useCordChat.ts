import { useCordSession } from './useCordSession';
import { useCordGeneration } from './useCordGeneration';
import { useCordDebug } from './useCordDebug';

export const useCordChat = (currentStoryId?: string) => {
    // 1. Session & Storage Management
    const session = useCordSession(currentStoryId);

    // 2. Debug State Management
    const debug = useCordDebug();

    // 3. AI Generation & Tool Execution Logic
    const generation = useCordGeneration({
        lang: 'ja', // Defaulting to 'ja' or could be passed via context/props if useCordChat takes it
        sessions: session.sessions,
        messages: session.messages,
        addMessage: session.addMessage,
        cordDebug: {
            setCordDebugSystemPrompt: debug.setCordDebugSystemPrompt,
            setCordDebugInputText: debug.setCordDebugInputText,
            setCordDebugMatchedEntities: debug.setCordDebugMatchedEntities
        },
        STORAGE_KEY_SESSIONS: session.STORAGE_KEY_SESSIONS,
        STORAGE_KEY_MESSAGES_PREFIX: session.STORAGE_KEY_MESSAGES_PREFIX,
        saveSessionsToStorage: session.saveSessionsToStorage
    });

    return {
        // --- Session State & Actions ---
        sessions: session.sessions,
        currentSessionId: session.currentSessionId,
        messages: session.messages,
        chatScope: session.chatScope,
        setChatScope: session.setChatScope,
        isNewChatAwareOfWombStory: session.isNewChatAwareOfWombStory,
        setIsNewChatAwareOfWombStory: session.setIsNewChatAwareOfWombStory,
        setCurrentSessionId: session.setCurrentSessionId,
        startNewSession: session.startNewSession,
        addMessage: session.addMessage,
        deleteSession: session.deleteSession,
        editMessage: session.editMessage,
        deleteMessage: session.deleteMessage,
        toggleWombAwareness: session.toggleWombAwareness,

        // Filter helper
        filteredSessions: session.sessions.filter(s =>
            s.isGlobal || (currentStoryId && s.storyId === currentStoryId)
        ),

        // --- Generation State & Actions ---
        isTyping: generation.isTyping,
        generateAiResponse: generation.generateAiResponse,

        // --- Debug State ---
        cordDebugSystemPrompt: debug.cordDebugSystemPrompt,
        cordDebugInputText: debug.cordDebugInputText,
        cordDebugMatchedEntities: debug.cordDebugMatchedEntities
    };
};
