import { useState, useCallback, useRef } from 'react';
import * as Diff from 'diff';
import { Story, StoryVersion, LoreItem, StoryEntityHistory } from '../../types';

interface UseCordBackgroundHstProps {
    lang: 'ja' | 'en';
    apiKey: string;
    aiModel: 'gemini-2.5-flash' | 'gemini-3.1-pro-preview';
    currentStoryId: string | null;
    savedStories: Story[];
    getActiveLineage: (currentVersionId: string | null, versions: any[]) => Set<string>;
    mommyList: any[];
    nerdList: any[];
    loreList: any[];
    activeMommyIds: string[];
    activeNerdIds: string[];
    activeLoreIds: string[];
}

export const useCordBackgroundHst = ({
    lang,
    apiKey,
    aiModel,
    currentStoryId: _currentStoryId,
    savedStories: _savedStories,
    getActiveLineage: _getActiveLineage,
    mommyList, nerdList, loreList,
    activeMommyIds, activeNerdIds, activeLoreIds
}: UseCordBackgroundHstProps) => {

    const [isBackgroundProcessing, setIsBackgroundProcessing] = useState(false);
    const [processingTargetName, setProcessingTargetName] = useState<string | null>(null);

    // ==========================================
    // 1. Core Computation Utilities
    // ==========================================

    const computeDiffString = useCallback((oldText: string, newText: string): string => {
        const diffs = Diff.diffWordsWithSpace(oldText, newText);
        let output = "";

        diffs.forEach(part => {
            if (part.added) {
                output += `\n[ADDED]:\n${part.value}\n[/ADDED]\n`;
            } else if (part.removed) {
                output += `\n[REMOVED]:\n${part.value}\n[/REMOVED]\n`;
            }
        });

        return output.trim();
    }, []);

    const extractMatchedEntities = useCallback((text: string, activeIds: string[], sourceList: any[]): LoreItem[] => {
        if (!text) return [];
        const activeItems = sourceList.filter(item => activeIds.includes(item.id));
        const matched: LoreItem[] = [];

        for (const item of activeItems) {
            let found = false;
            // 1. Direct Name Match
            if (text.includes(item.name)) {
                found = true;
            } else {
                // 2. Keyword Match
                for (const keyword of item.keywords) {
                    if (keyword && text.includes(keyword)) {
                        found = true;
                        break;
                    }
                }
            }
            if (found) {
                matched.push(item as LoreItem);
            }
        }
        return matched;
    }, []);

    // ==========================================
    // 2. Trigger Logic
    // ==========================================

    /**
     * Checks if the active CORD history generation should run.
     * Needs to be called immediately after a Story Save.
     */
    const evaluateBackgroundTrigger = useCallback((
        storyId: string,
        newContent: string,
        updateIntervalLimit: number = 300 // default 300 chars
    ) => {
        if (!apiKey) {
            console.log(`[evaluateBackgroundTrigger] Aborted: No API Key.`);
            return false;
        }

        // Extremely aggressive fetch: we want the absolute latest state since saveGlobalStoryState just finished
        const freshStories: Story[] = JSON.parse(localStorage.getItem('womb_stories') || '[]');
        const story = freshStories.find(s => s.id === storyId);

        if (!story || !story.currentVersionId) {
            console.log(`[evaluateBackgroundTrigger] Aborted: Story or currentVersionId not found. (storyId: ${storyId})`);
            return false;
        }

        const currentVersion = story.versions.find(v => v.id === story.currentVersionId);
        if (!currentVersion) {
            console.log(`[evaluateBackgroundTrigger] Aborted: currentVersion not found. (versionId: ${story.currentVersionId})`);
            return false;
        }

        // Find the most recent ancestor that had autoHistoryGenerated = true
        let baselineVersion: StoryVersion | null = null;
        let currId: string | null = story.currentVersionId;

        while (currId) {
            const v = story.versions.find(vers => vers.id === currId);
            if (!v) break;

            // Skip the very one we just saved right now, we are looking for its PARENT context
            if (v.id !== story.currentVersionId && v.autoHistoryGenerated) {
                baselineVersion = v;
                break;
            }
            currId = v.parentId;
        }

        // If no baseline was explicitly found, it means this branch has NEVER had auto-history generated.
        // In this case, the baseline is considered completely empty (0 characters).
        const baselineContent = baselineVersion ? baselineVersion.content : "";

        // Calculate raw difference (simple added + removed estimation via diff package)
        const diffs = Diff.diffChars(baselineContent, newContent);
        let diffCount = 0;
        diffs.forEach(part => {
            if (part.added || part.removed) {
                diffCount += part.value.length;
            }
        });

        console.log(`[evaluateBackgroundTrigger] Target Story: ${storyId}`);
        console.log(`[evaluateBackgroundTrigger] Current Version ID: ${currentVersion.id}`);
        console.log(`[evaluateBackgroundTrigger] Baseline Version ID Found: ${baselineVersion ? baselineVersion.id : "initial_empty"}`);
        console.log(`[evaluateBackgroundTrigger] Diff Count: ${diffCount} / Limit: ${updateIntervalLimit}`);

        if (diffCount >= updateIntervalLimit) {
            console.log(`[evaluateBackgroundTrigger] Limit reached! Triggering Background History.`);
            return {
                shouldTrigger: true,
                baselineContent,
                baselineVersionId: baselineVersion ? baselineVersion.id : "initial_empty",
                targetVersionId: currentVersion.id
            };
        }

        console.log(`[evaluateBackgroundTrigger] Limit not reached. Skipping.`);
        return { shouldTrigger: false };

    }, [apiKey, _savedStories]);


    // ==========================================
    // 3. Execution Flow (Steps 1 to 6)
    // ==========================================

    // Queue state
    const taskQueueRef = useRef<any[]>([]);
    const isProcessingQueueRef = useRef<boolean>(false);

    const runQueue = useCallback(async () => {
        if (taskQueueRef.current.length === 0) {
            isProcessingQueueRef.current = false;
            setIsBackgroundProcessing(false);
            setProcessingTargetName(null);
            return;
        }

        isProcessingQueueRef.current = true;
        setIsBackgroundProcessing(true);

        const task = taskQueueRef.current[0];
        const {
            baselineContent, newContent, targetVersionId, storyId,
            handleAddHistory, handleUpdateHistory, handleDeleteHistory
        } = task;

        try {
            setProcessingTargetName("Analysis...");

            // STEP 1: Gather Data
            const diffText = computeDiffString(baselineContent, newContent);
            const baselineEntities = extractMatchedEntities(baselineContent, [...activeMommyIds, ...activeNerdIds, ...activeLoreIds], [...mommyList, ...nerdList, ...loreList]);
            const currentEntities = extractMatchedEntities(newContent, [...activeMommyIds, ...activeNerdIds, ...activeLoreIds], [...mommyList, ...nerdList, ...loreList]);

            const uniqueActiveEntities = Array.from(new Set([...baselineEntities, ...currentEntities]));
            if (uniqueActiveEntities.length === 0) {
                console.log("[CORD Background] No active entities matched in text. Task finished.");
                return; // Jump to finally
            }

            // --- VITAL FIX: Fetch the absolute latest history logs from LocalStorage ---
            // This guarantees that B sees the changes made by A, because A's runner finishes and writes
            // to LocalStorage completely before B's runner starts and reads from it here.
            const freshLogsRaw = localStorage.getItem('deborah_history_logs_v1');
            const latestHistoryLogs: StoryEntityHistory[] = freshLogsRaw ? JSON.parse(freshLogsRaw) : [];

            // STEP 2: AI Selection Call (Who needs updates?)
            const { callGemini } = await import('../../utils/gemini');

            const selectionPrompt = `
You are an expert lore master analyzing a story diff.
Based ONLY on the text changes provided below, which of the following entities require their personal "History" to be created, updated, or deleted?
A change requires a history update if it describes a significant event, physical change, psychological shift, or relationship development for that entity. 
Minor typos or irrelevant actions do not require updates.

[ENTITIES IN SCENE]
${uniqueActiveEntities.map(e => `- ID: ${e.id} | Name: ${e.name} (${e.type})`).join('\n')}

[TEXT DIFF (What happened since the last check)]
${diffText}

Output strictly valid JSON in the following format. Nothing else.
{ "targetEntityIds": ["id1", "id2", ...] }
`;
            let selectedIds: string[] = [];
            try {
                const selectionResponse = await callGemini(apiKey, selectionPrompt, aiModel);
                const cleanedResponse = selectionResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanedResponse);
                selectedIds = parsed.targetEntityIds || [];
            } catch (e) {
                console.error("[CORD Background] Selection AI Failed or returned invalid JSON:", e);
                return;
            }

            if (selectedIds.length === 0) {
                console.log("[CORD Background] AI determined no history updates are necessary.");
                return;
            }

            // STEP 3 - 6: Iterate and Update
            let changedAny = false;
            let summaryMessages: string[] = [];

            for (let i = 0; i < selectedIds.length; i++) {
                const eId = selectedIds[i];
                const entity = uniqueActiveEntities.find(e => e.id === eId);
                if (!entity) continue;

                setProcessingTargetName(`${entity.name}...`);

                // We use latestHistoryLogs mapped fresh for this exact queue item
                const entityHistories = latestHistoryLogs.filter((h: StoryEntityHistory) => h.entityId === eId && (h.storyId === "" || h.storyId === storyId));

                const updatePrompt = `
You are updating the personal history records for the character: "${entity.name}".

[CURRENT HISTORY RECORDS]
${entityHistories.length === 0 ? "None." : entityHistories.map(h => `Record ID: ${h.id} || ${h.content}`).join('\n')}

[RECENT STORY DEVELOPMENTS (Text Diff)]
${diffText}

Instructions:
1. Analyze the CURRENT HISTORY RECORDS and the RECENT STORY DEVELOPMENTS.
2. Formulate the NEW history state.
   - If an existing record needs appending or changing, provide the full updated text.
   - If a totally new distinct event occurred, create a new record.
   - If an existing record was completely overwritten or invalidated by a deletion in the diff, you may omit it to logically 'delete' it.
3. Output strictly valid JSON.

Format:
{
  "updates": [
    { "action": "MODIFY", "recordId": "existing_id", "content": "Updated full text..." },
    { "action": "ADD", "content": "Brand new event text..." },
    { "action": "DELETE", "recordId": "existing_id_to_remove" }
  ]
}
`;
                try {
                    const updateResponse = await callGemini(apiKey, updatePrompt, aiModel);
                    const cRes = updateResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                    const parsedUpdate = JSON.parse(cRes);

                    if (parsedUpdate.updates && Array.isArray(parsedUpdate.updates)) {
                        let entityChanged = false;
                        let entitySummary: string[] = [];

                        // IMPORTANT: To prevent "React Batching/Closure" bugs during consecutive updates in the same function call, 
                        // The base handlers in useWombHistory now correctly use `prev => ...` for stable updates.
                        parsedUpdate.updates.forEach((cmd: any) => {
                            if (cmd.action === "ADD" && cmd.content) {
                                handleAddHistory(eId, storyId, targetVersionId, cmd.content);
                                changedAny = true;
                                entityChanged = true;
                                entitySummary.push(`- ${lang === 'ja' ? '追加' : 'Added'}: ${cmd.content}`);
                            } else if (cmd.action === "MODIFY" && cmd.recordId && cmd.content) {
                                const hIdx = latestHistoryLogs.findIndex((h: StoryEntityHistory) => h.id === cmd.recordId);
                                if (hIdx >= 0) {
                                    handleUpdateHistory(cmd.recordId, cmd.content, targetVersionId);
                                    changedAny = true;
                                    entityChanged = true;
                                    entitySummary.push(`- ${lang === 'ja' ? '更新' : 'Updated'}: ${cmd.content}`);
                                }
                            } else if (cmd.action === "DELETE" && cmd.recordId) {
                                handleDeleteHistory(cmd.recordId, targetVersionId);
                                changedAny = true;
                                entityChanged = true;
                                entitySummary.push(`- ${lang === 'ja' ? '削除' : 'Deleted'}`);
                            }
                        });

                        if (entityChanged) {
                            summaryMessages.push(`**${entity.name}**\n${entitySummary.join('\n')}`);
                        }
                    }
                } catch (e) {
                    console.error(`[CORD Background] Update AI Failed for ${entity.name}:`, e);
                }
            }

            if (changedAny) {
                // Immediately Dispatch Notification for THIS SPECIFIC TASK (A -> B -> C ...)
                const eventMsg = lang === 'ja'
                    ? `[Active CORD: 自動ヒストリー更新]\n以下のヒストリーが文脈から自動で追加・更新されました：\n\n${summaryMessages.join('\n\n')}`
                    : `[Active CORD: Auto History Update]\nThe following histories were automatically updated from the context:\n\n${summaryMessages.join('\n\n')}`;

                window.dispatchEvent(new CustomEvent('cord:add-background-message', {
                    detail: { role: 'system', content: eventMsg }
                }));
            }

            // Mark Version as Auto-History Generated
            try {
                const currentStories = JSON.parse(localStorage.getItem('womb_stories') || '[]') as Story[];
                const storyIdx = currentStories.findIndex((s: Story) => s.id === storyId);
                if (storyIdx >= 0) {
                    const vIdx = currentStories[storyIdx].versions.findIndex((v: any) => v.id === targetVersionId);
                    if (vIdx >= 0) {
                        currentStories[storyIdx].versions[vIdx].autoHistoryGenerated = true;
                        localStorage.setItem('womb_stories', JSON.stringify(currentStories));
                    }
                }
            } catch (e) {
                console.error("[CORD Background] Failed to mark autoHistoryGenerated flag:", e);
            }

        } catch (error) {
            console.error("[CORD Background] Critical Pipeline Error:", error);
        } finally {
            // Task completed (Success or Fail). Remove from queue.
            taskQueueRef.current.shift();
            // Start next item in queue asynchronously
            setTimeout(() => runQueue(), 0);
        }
    }, [apiKey, aiModel, activeMommyIds, activeNerdIds, activeLoreIds, mommyList, nerdList, loreList, computeDiffString, extractMatchedEntities, lang]);

    const processBackgroundHistory = useCallback((
        baselineContent: string,
        newContent: string,
        _baselineVersionId: string | null, // Kept for compatibility but unused
        targetVersionId: string,
        storyId: string,
        _staleHistoryLogs: StoryEntityHistory[], // Deliberately ignored to prevent closure poisoning
        handleAddHistory: (entityId: string, currentStoryId: string | null, currentVersionId: string | null, initialContent?: string) => string,
        handleUpdateHistory: (id: string, content: string, currentVersionId: string) => void,
        handleDeleteHistory: (id: string, currentVersionId: string) => void
    ) => {
        if (!apiKey) return;

        // Push task to queue
        taskQueueRef.current.push({
            baselineContent, newContent, targetVersionId, storyId,
            handleAddHistory, handleUpdateHistory, handleDeleteHistory
        });

        // Trigger Queue runner if it isn't already flying
        if (!isProcessingQueueRef.current) {
            runQueue();
        }

    }, [apiKey, runQueue]);

    return {
        isBackgroundProcessing,
        processingTargetName,
        evaluateBackgroundTrigger,
        computeDiffString,
        extractMatchedEntities,
        processBackgroundHistory
    };
};
