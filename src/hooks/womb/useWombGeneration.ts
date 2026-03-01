import { useState, useCallback, useRef, useEffect } from 'react';
import { Story, StoryLoreRelation, LoreItem, WombChatInteraction } from '../../types';

interface UseWombGenerationProps {
    lang: 'ja' | 'en';
    apiKey: string;
    novelAIApiKey: string;
    aiModel: 'gemini-2.5-flash' | 'gemini-3.1-pro-preview' | 'glm-4-6';
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
    isPseudoThinkingModeEnabled: boolean;
}

export const useWombGeneration = ({
    lang, apiKey, novelAIApiKey, aiModel, content, setContent, currentStoryId, setCurrentStoryId,
    activeMommyIds, activeNerdIds, activeLoreIds, saveGlobalStoryState,
    lastSavedContentRef, showWombDebugInfo, buildWombContext, aiThinkingLevel, wombChunkLimit, isCordActiveModeEnabled, wombOutputLength, isPseudoThinkingModeEnabled
}: UseWombGenerationProps) => {

    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // WOMB Debug State
    const [debugSystemPrompt, setDebugSystemPrompt] = useState<string>('');
    const [debugInputText, setDebugInputText] = useState<string>('');
    const [debugMatchedEntities, setDebugMatchedEntities] = useState<LoreItem[]>([]);

    // Refs to combat stale closures during long-running generation tasks (e.g. from CORD)
    const contentRef = useRef(content);
    const storyIdRef = useRef(currentStoryId);
    const mommyIdsRef = useRef(activeMommyIds);
    const nerdIdsRef = useRef(activeNerdIds);
    const loreIdsRef = useRef(activeLoreIds);

    useEffect(() => { contentRef.current = content; }, [content]);
    useEffect(() => { storyIdRef.current = currentStoryId; }, [currentStoryId]);
    useEffect(() => { mommyIdsRef.current = activeMommyIds; }, [activeMommyIds]);
    useEffect(() => { nerdIdsRef.current = activeNerdIds; }, [activeNerdIds]);
    useEffect(() => { loreIdsRef.current = activeLoreIds; }, [activeLoreIds]);

    // Action: Save System (Generate Story)
    const handleSave = useCallback(async (blueprintOverride?: string | React.MouseEvent | Event) => {
        const freshContent = contentRef.current;
        let freshStoryId = storyIdRef.current;
        const freshMommyIds = mommyIdsRef.current;
        const freshNerdIds = nerdIdsRef.current;
        const freshLoreIds = loreIdsRef.current;

        if (!freshContent.trim()) return;

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
            // Call the correct API based on the model
            const { systemInstruction, dynamicStoryContext, matchedLoreItems } = await buildWombContext();

            // Construct Output Length Constraint
            const lengthConstraint = lang === 'ja'
                ? `\n\n【出力形式の制約】\n出力する本文の文字数は、大体 ${wombOutputLength} 文字以内になるように調整してください。`
                : `\n\n[Output Constraints]\nAdjust the character count of the generated text to be roughly within ${wombOutputLength} characters.`;

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

            let newId = freshStoryId;
            if (!newId) {
                newId = Date.now().toString();
                setCurrentStoryId(newId);
                storyIdRef.current = newId; // Update ref immediately for subsequent calls
            }

            // Save PRE-GEN if content changed
            if (freshContent !== lastSavedContentRef.current) {
                saveGlobalStoryState(
                    newId,
                    freshContent,
                    'generate_pre',
                    freshMommyIds,
                    freshNerdIds,
                    freshLoreIds
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

            // Call the correct API based on the model
            let generatedText, rawParts, thoughtSummary;

            if (aiModel === 'glm-4-6') {
                const { callNovelAIChat } = await import('../../utils/novelai');

                if (isPseudoThinkingModeEnabled) {
                    console.log("[WOMB] ✨ Pseudo-Thinking Mode: PHASE 1 (Thinking) Started.");
                    // --- PHASE 1: Thinking ---
                    const phase1Instruction = lang === 'ja'
                        ? `\n\n【指示】\n物語の続きを生成する前に、プロットや展開方向、キャラクターの心情変化について段階的かつ論理的に思考してください。思考プロセスを出力し、思考が完了したら最後に「[THINKING_COMPLETE]」と出力してください。`
                        : `\n\n[Instruction]\nBefore generating the continuation of the story, please think step-by-step logically about the plot, development direction, and character emotional changes. Output your thought process, and once your thinking is complete, output "[THINKING_COMPLETE]" at the end.`;

                    // Create a copy of messages for Phase 1
                    const phase1Messages = [...messages];
                    // Append instruction to the very last user message
                    const lastUserMsg = phase1Messages[phase1Messages.length - 1];
                    phase1Messages[phase1Messages.length - 1] = {
                        ...lastUserMsg,
                        content: lastUserMsg.content + phase1Instruction
                    };

                    const phase1Result = await callNovelAIChat(
                        novelAIApiKey,
                        phase1Messages,
                        aiModel,
                        systemInstruction
                    );

                    let activePseudoThought = phase1Result.text || "";

                    // Cleanup flag if it appended it
                    if (activePseudoThought.includes('[THINKING_COMPLETE]')) {
                        activePseudoThought = activePseudoThought.replace(/\[THINKING_COMPLETE\]/g, '').trim();
                    }

                    console.log("[WOMB] ✨ Pseudo-Thinking Mode: PHASE 1 Complete. Transitioning to PHASE 2 (Response).");
                    console.log("[WOMB] Intercepted Thought:", activePseudoThought);

                    // --- PHASE 2: Generating ---
                    const phase2Instruction = lang === 'ja'
                        ? `思考完了ですね。それでは思考した内容をベースに、物語の本文の続きを出力してください。`
                        : `Thinking is complete. Now, based on your thoughts, please output the continuation of the story.`;

                    // Append the AI's thought and the new user prompt
                    messages.push({ role: 'ai', content: activePseudoThought });
                    messages.push({ role: 'user', content: phase2Instruction });

                    const phase2Result = await callNovelAIChat(
                        novelAIApiKey,
                        messages, // Send updated array
                        aiModel,
                        systemInstruction
                    );

                    generatedText = phase2Result.text;
                    rawParts = phase2Result.rawParts;
                    thoughtSummary = activePseudoThought; // Set the intercepted thought as the summary to store
                } else {
                    // Standard GLM operation
                    const result = await callNovelAIChat(
                        novelAIApiKey,
                        messages,
                        aiModel,
                        systemInstruction
                    );
                    generatedText = result.text;
                    rawParts = result.rawParts;
                    thoughtSummary = result.thoughtSummary;
                }
            } else {
                const { callGeminiChat } = await import('../../utils/gemini');
                const result = await callGeminiChat(
                    apiKey,
                    messages,
                    aiModel,
                    systemInstruction,
                    [{ googleSearch: {} }], // tools
                    aiThinkingLevel
                );
                generatedText = result.text;
                rawParts = result.rawParts;
                thoughtSummary = result.thoughtSummary;
            }

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
            const newContent = freshContent + cleanGeneratedText;
            setContent(newContent);
            contentRef.current = newContent; // Update ref immediately

            // Save POST-GEN via helper
            saveGlobalStoryState(
                newId,
                newContent,
                'generate_post',
                freshMommyIds,
                freshNerdIds,
                freshLoreIds
            );

        } catch (error) {
            console.error('Generation failed:', error);
            alert(lang === 'ja' ? '生成に失敗しました。' : 'Generation failed.');
        } finally {
            setIsGenerating(false);
        }
    }, [
        apiKey, novelAIApiKey, aiModel, saveGlobalStoryState, lang,
        lastSavedContentRef, showWombDebugInfo, buildWombContext, setCurrentStoryId, setContent, aiThinkingLevel, isCordActiveModeEnabled, wombOutputLength
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
