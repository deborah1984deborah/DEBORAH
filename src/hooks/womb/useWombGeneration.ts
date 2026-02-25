import { useState, useCallback } from 'react';
import { Story, StoryLoreRelation, LoreItem, WombChatInteraction } from '../../types';

interface UseWombGenerationProps {
    lang: 'ja' | 'en';
    apiKey: string;
    aiModel: 'gemini-2.5-flash' | 'gemini-3.1-pro-preview';
    content: string;
    setContent: (c: string) => void;
    currentStoryId: string | null;
    setCurrentStoryId: (id: string) => void;
    savedStories: Story[];
    globalRelations: StoryLoreRelation[];
    activeMommyIds: string[];
    activeNerdIds: string[];
    activeLoreIds: string[];
    saveGlobalStoryState: (id: string, content: string, type: 'manual' | 'generate_pre' | 'generate_post', m: string[], n: string[], l: string[]) => void;
    lastSavedContentRef: React.MutableRefObject<string>;
    aiThinkingLevel: 'low' | 'medium' | 'high';
    wombChunkLimit: number;
    showWombDebugInfo: boolean;
    buildWombContext: () => Promise<any>;
}

export const useWombGeneration = ({
    lang, apiKey, aiModel, content, setContent, currentStoryId, setCurrentStoryId,
    activeMommyIds, activeNerdIds, activeLoreIds, saveGlobalStoryState,
    lastSavedContentRef, showWombDebugInfo, buildWombContext, aiThinkingLevel, wombChunkLimit
}: UseWombGenerationProps) => {

    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // WOMB Debug State
    const [debugSystemPrompt, setDebugSystemPrompt] = useState<string>('');
    const [debugInputText, setDebugInputText] = useState<string>('');
    const [debugMatchedEntities, setDebugMatchedEntities] = useState<LoreItem[]>([]);

    // Action: Save System (Generate Story)
    const handleSave = useCallback(async () => {
        if (!content.trim()) return;

        setIsGenerating(true);

        try {
            const { callGeminiChat } = await import('../../utils/gemini');

            // Call the shared context builder
            const { systemInstruction, dynamicStoryContext, cleanedContent, matchedLoreItems } = await buildWombContext();

            // Construction of payload
            const payloadContent = `${dynamicStoryContext}\n\n=== CONTINUE FROM HERE ===\n\n${cleanedContent}`;

            // Set debug info
            if (showWombDebugInfo) {
                setDebugSystemPrompt(systemInstruction);
                setDebugInputText(payloadContent);
                setDebugMatchedEntities(matchedLoreItems);
            }

            let newId = currentStoryId;
            if (!newId) {
                newId = Date.now().toString();
                setCurrentStoryId(newId);
            }

            // Save PRE-GEN if content changed
            if (content !== lastSavedContentRef.current) {
                saveGlobalStoryState(
                    newId,
                    content,
                    'generate_pre',
                    activeMommyIds,
                    activeNerdIds,
                    activeLoreIds
                );
            }

            // Load existing chat history from localStorage
            const storageKey = `womb_chat_${newId}`;
            const existingChatJson = localStorage.getItem(storageKey);
            const existingChat: WombChatInteraction[] = existingChatJson ? JSON.parse(existingChatJson) : [];

            let currentChunkId = existingChat.length > 0 ? (existingChat[existingChat.length - 1].chunkId || 0) : 0;
            const currentChunkInteractions = existingChat.filter(i => (i.chunkId || 0) === currentChunkId);
            const aiMessageCount = currentChunkInteractions.filter(i => i.role === 'ai').length;

            if (aiMessageCount >= wombChunkLimit) {
                // Auto chunk cutoff after user-defined limit turns
                currentChunkId++;
            }

            // Map existing interactions in the CURRENT chunk to ChatMessageData format
            const messages: any[] = existingChat
                .filter(i => (i.chunkId || 0) === currentChunkId && i.content !== '-- Context manually cleared --')
                .map(interaction => ({
                    role: interaction.role,
                    content: interaction.content || '',
                    rawParts: interaction.rawParts,
                    thoughtSummary: interaction.thoughtSummary
                }));

            // Append current user message
            messages.push({
                role: 'user',
                content: payloadContent
            });

            // Call the Gemeni API with Chat History and Thoughts extraction
            const { text: generatedText, rawParts, thoughtSummary } = await callGeminiChat(
                apiKey,
                messages,
                aiModel,
                systemInstruction,
                undefined, // tools
                aiThinkingLevel
            );

            if (!generatedText) throw new Error("No text generated");

            // Log the generation interactions with current chunkId
            const now = Date.now();
            const newInteractions: WombChatInteraction[] = [
                {
                    id: `interaction_${now}_sys`,
                    storyId: newId,
                    role: 'system',
                    content: systemInstruction,
                    createdAt: now,
                    chunkId: currentChunkId
                },
                {
                    id: `interaction_${now}_usr`,
                    storyId: newId,
                    role: 'user',
                    content: payloadContent,
                    createdAt: now + 1,
                    chunkId: currentChunkId
                },
                {
                    id: `interaction_${now}_ai`,
                    storyId: newId,
                    role: 'ai',
                    content: generatedText,
                    rawParts,
                    thoughtSummary,
                    createdAt: now + 2,
                    chunkId: currentChunkId
                }
            ];

            try {
                // Save updated history back to local storage
                localStorage.setItem(storageKey, JSON.stringify([...existingChat, ...newInteractions]));
            } catch (e) {
                console.error("Failed to save WOMB chat interactions to local storage", e);
            }

            // Append generated text
            const newContent = content + '\n' + generatedText;
            setContent(newContent);

            // Save POST-GEN via helper
            saveGlobalStoryState(
                newId,
                newContent,
                'generate_post',
                activeMommyIds,
                activeNerdIds,
                activeLoreIds
            );

        } catch (error) {
            console.error('Generation failed:', error);
            alert(lang === 'ja' ? '生成に失敗しました。' : 'Generation failed.');
        } finally {
            setIsGenerating(false);
        }
    }, [
        apiKey, aiModel, content, currentStoryId,
        activeMommyIds, activeNerdIds, activeLoreIds, saveGlobalStoryState, lang,
        lastSavedContentRef, showWombDebugInfo, buildWombContext, setCurrentStoryId, setContent, aiThinkingLevel
    ]);

    const handleCutContext = useCallback(() => {
        if (!currentStoryId) return;
        const storageKey = `womb_chat_${currentStoryId}`;
        const existingChatJson = localStorage.getItem(storageKey);
        const existingChat: WombChatInteraction[] = existingChatJson ? JSON.parse(existingChatJson) : [];
        if (existingChat.length === 0) return; // Nothing to cut

        const currentChunkId = existingChat[existingChat.length - 1].chunkId || 0;

        const cutInteraction: WombChatInteraction = {
            id: `interaction_${Date.now()}_cut`,
            storyId: currentStoryId,
            role: 'system',
            content: '-- Context manually cleared --',
            createdAt: Date.now(),
            chunkId: currentChunkId + 1 // Forces next save to use this chunk
        };

        try {
            localStorage.setItem(storageKey, JSON.stringify([...existingChat, cutInteraction]));
            alert(lang === 'ja' ? 'WOMBの履歴コンテキストを切り離しました（次回生成は新規チャットになります）' : 'Context severed. Next generation will start a new chunk.');
        } catch (e) {
            console.error("Failed to save cut interaction", e);
        }
    }, [currentStoryId, lang]);

    return {
        isGenerating,
        debugSystemPrompt,
        debugInputText,
        debugMatchedEntities,
        handleSave,
        handleCutContext
    };
};
