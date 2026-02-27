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
    isCordActiveModeEnabled: boolean;
    buildWombContext: () => Promise<any>;
    wombOutputLength: number;
}

export const useWombGeneration = ({
    lang, apiKey, aiModel, content, setContent, currentStoryId, setCurrentStoryId,
    activeMommyIds, activeNerdIds, activeLoreIds, saveGlobalStoryState,
    lastSavedContentRef, showWombDebugInfo, buildWombContext, aiThinkingLevel, wombChunkLimit, isCordActiveModeEnabled, wombOutputLength
}: UseWombGenerationProps) => {

    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // WOMB Debug State
    const [debugSystemPrompt, setDebugSystemPrompt] = useState<string>('');
    const [debugInputText, setDebugInputText] = useState<string>('');
    const [debugMatchedEntities, setDebugMatchedEntities] = useState<LoreItem[]>([]);

    // Action: Save System (Generate Story)
    const handleSave = useCallback(async (blueprintOverride?: string | React.MouseEvent | Event) => {
        if (!content.trim()) return;

        // --- CORD Event Dispatch Flow ---
        // If Active CORD is enabled, and we didn't explicitly pass a text blueprint,
        // it means this was triggered directly by the user (via button click or shortcut).
        // Instead of running silently, send a request to CORD Chat to orchestrate it.
        if (isCordActiveModeEnabled && typeof blueprintOverride !== 'string') {
            console.log("[useWombGeneration] Delegating WOMB generation request to CORD Chat...");
            const event = new CustomEvent('cord:request-womb-gen');
            window.dispatchEvent(event);
            return; // Stop local execution — CORD will call this back with a string blueprint later.
        }

        setIsGenerating(true);

        try {
            const { callGeminiChat } = await import('../../utils/gemini');

            // Call the shared context builder
            const { systemInstruction, dynamicStoryContext, matchedLoreItems } = await buildWombContext();

            // Construct Output Length Constraint
            const lengthConstraint = lang === 'ja'
                ? `\n\n【出力形式の制約】\n出力する本文の文字数は、約 ${wombOutputLength} 文字程度になるように調整してください。`
                : `\n\n[Output Constraints]\nAdjust the character count of the generated text to approximately ${wombOutputLength} characters.`;

            let finalDynamicStoryContext = `${lengthConstraint}\n${dynamicStoryContext}`;

            if (isCordActiveModeEnabled && typeof blueprintOverride === 'string' && blueprintOverride.trim()) {
                console.log("[CORD Narrative Blueprint received]:\n", blueprintOverride);
                finalDynamicStoryContext = `==========================================\n【Narrative Blueprint from CORD】\n==========================================\n${blueprintOverride}\n${lengthConstraint}\n${dynamicStoryContext}`;
            }

            // Construction of payload
            const payloadContent = `${finalDynamicStoryContext}\n\n=== CONTINUE FROM HERE ===\n`;

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
                [{ googleSearch: {} }], // tools
                aiThinkingLevel
            );

            if (!generatedText) throw new Error("No text generated");

            let cleanGeneratedText = generatedText;
            if (/^\s*@@@n/.test(cleanGeneratedText)) {
                cleanGeneratedText = '\n' + cleanGeneratedText.replace(/^\s*@@@n\s*/, '');
            } else {
                cleanGeneratedText = cleanGeneratedText.replace(/^\s+/, '');
            }

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
                    // チャット履歴にはWOMBが出力した生の `@@@n` のまま保存する
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

            // Append generated text (using the cleaned version for the editor)
            const newContent = content + cleanGeneratedText;
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
        lastSavedContentRef, showWombDebugInfo, buildWombContext, setCurrentStoryId, setContent, aiThinkingLevel, isCordActiveModeEnabled
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
