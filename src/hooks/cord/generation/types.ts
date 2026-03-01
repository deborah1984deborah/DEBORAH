import { ChatSession, ChatMessage } from '../../../types';

export interface UseCordGenerationProps {
    lang: 'ja' | 'en';
    sessions: ChatSession[];
    messages: ChatMessage[];
    addMessage: (role: 'user' | 'ai' | 'system' | 'function', content: string, sessionIdOverride?: string, functionCall?: any, rawParts?: any[], thoughtSummary?: string) => string;
    cordDebug: {
        setCordDebugSystemPrompt: (v: string) => void;
        setCordDebugInputText: (v: string) => void;
        setCordDebugMatchedEntities: (v: any[]) => void;
    };
    STORAGE_KEY_SESSIONS: string;
    STORAGE_KEY_MESSAGES_PREFIX: string;
    saveSessionsToStorage: (updatedSessions: ChatSession[]) => void;
    triggerAutoHistory?: () => void;
    triggerWombGeneration?: (blueprintOverride?: string) => Promise<void>;
    cordOutputLength: number;
    checkIsBackgroundProcessing?: () => boolean;
    isPseudoThinkingModeEnabled?: boolean;
}
