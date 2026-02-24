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
    showWombDebugInfo: boolean;
    buildWombContext: () => Promise<{ systemInstruction: string, dynamicStoryContext: string, entityContext?: string, scanTargetContent?: string, matchedLoreItems: any[], allActiveLoreItems: any[], allLoreItems: any[], cleanedContent: string, storyTitle: string }>;
}

export const useWombGeneration = ({
    lang, apiKey, aiModel, content, setContent, currentStoryId, setCurrentStoryId,
    activeMommyIds, activeNerdIds, activeLoreIds, saveGlobalStoryState,
    lastSavedContentRef, showWombDebugInfo, buildWombContext, aiThinkingLevel
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
            const { callGeminiWithThoughts } = await import('../../utils/gemini');

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

            // Call the Gemeni API with Thoughts extraction
            const { text: generatedText, rawParts, thoughtSummary } = await callGeminiWithThoughts(apiKey, payloadContent, aiModel, systemInstruction, aiThinkingLevel);

            // Log the generation interactions
            const now = Date.now();
            const newInteractions: WombChatInteraction[] = [
                {
                    id: `interaction_${now}_sys`,
                    storyId: newId,
                    role: 'system',
                    content: systemInstruction,
                    createdAt: now
                },
                {
                    id: `interaction_${now}_usr`,
                    storyId: newId,
                    role: 'user',
                    content: payloadContent,
                    createdAt: now + 1
                },
                {
                    id: `interaction_${now}_ai`,
                    storyId: newId,
                    role: 'ai',
                    content: generatedText,
                    rawParts,
                    thoughtSummary,
                    createdAt: now + 2
                }
            ];

            try {
                const storageKey = `womb_chat_${newId}`;
                const existingChatJson = localStorage.getItem(storageKey);
                const existingChat: WombChatInteraction[] = existingChatJson ? JSON.parse(existingChatJson) : [];
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

    return {
        isGenerating,
        debugSystemPrompt,
        debugInputText,
        debugMatchedEntities,
        handleSave
    };
};
