import { useCallback, useState } from 'react';

import { useWombSettings } from './useWombSettings';
import { useWombLore } from './useWombLore';
import { useWombHistory } from './useWombHistory';
import { useWombStory } from './useWombStory';
import { useWombContext } from './useWombContext';
import { useWombGeneration } from './useWombGeneration';
import { useCordBackgroundHst } from '../cord/useCordBackgroundHst';

interface UseWombSystemProps {
    lang: 'ja' | 'en';
}

export const useWombSystem = ({ lang }: UseWombSystemProps) => {
    // UI State that doesn't fit specific domains
    const [showLorebook, setShowLorebook] = useState<boolean>(false);

    // 1. Settings
    const settings = useWombSettings();
    const {
        apiKey, novelAIApiKey, aiModel, aiThinkingLevel, keywordScanRange, showWombDebugInfo, wombContextLength, activeCordHistoryInterval,
        isCordActiveModeEnabled, wombChunkLimit, wombOutputLength
    } = settings;

    // 2. Lore
    const lore = useWombLore();
    const {
        mommyList, nerdList, loreList,
        activeMommyIds, setActiveMommyIds,
        activeNerdIds, setActiveNerdIds,
        activeLoreIds, setActiveLoreIds,
        globalRelations, setGlobalRelations
    } = lore;

    // 3. History
    const history = useWombHistory();
    const {
        historyLogs, setHistoryLogs, getActiveLineage, invalidations,
        handleAddHistory: baseHandleAddHistory,
        handleUpdateHistory: baseHandleUpdateHistory,
        handleDeleteHistory: baseHandleDeleteHistory,
        handleToggleInvalidateHistory
    } = history;

    // 4. Active CORD Background History
    // Read savedStories directly from localStorage here to avoid circular dependency with useWombStory
    const initialSavedStories = JSON.parse(localStorage.getItem('womb_stories') || '[]');
    const currentStoryIdFromStorage = localStorage.getItem('womb_current_story_id');

    const backgroundHst = useCordBackgroundHst({
        lang, apiKey, aiModel, currentStoryId: currentStoryIdFromStorage,
        savedStories: initialSavedStories,
        getActiveLineage,
        mommyList, nerdList, loreList,
        activeMommyIds, activeNerdIds, activeLoreIds
    });
    const { isBackgroundProcessing, processingTargetName, evaluateBackgroundTrigger, processBackgroundHistory } = backgroundHst;

    // 5. Story (State & Versioning)
    const story = useWombStory({
        lang,
        globalRelations, setGlobalRelations,
        activeMommyIds, setActiveMommyIds,
        activeNerdIds, setActiveNerdIds,
        activeLoreIds, setActiveLoreIds,
        historyLogs, setHistoryLogs,
        getActiveLineage
    });
    const {
        currentStoryId, setCurrentStoryId,
        content, setContent,
        saveGlobalStoryState: baseSaveGlobalStoryState,
        activeHistoryLogs, lastSavedContentRef
    } = story;

    // Wrap the save function to inject the trigger using the most up-to-date closures
    const saveGlobalStoryState = useCallback((
        targetId: string,
        targetContent: string,
        saveType: 'manual' | 'generate_pre' | 'generate_post',
        _activeMommies: string[],
        _activeNerds: string[],
        _activeLores: string[]
    ) => {
        // 1. Perform standard save
        const result = baseSaveGlobalStoryState(targetId, targetContent, saveType, _activeMommies, _activeNerds, _activeLores);

        // 2. Evaluate Background Trigger
        if (isCordActiveModeEnabled && (saveType === 'manual' || saveType === 'generate_pre' || saveType === 'generate_post')) {
            const triggerCheck = evaluateBackgroundTrigger(targetId, targetContent, activeCordHistoryInterval);
            if (triggerCheck && triggerCheck.shouldTrigger && triggerCheck.baselineVersionId) {
                processBackgroundHistory(
                    triggerCheck.baselineContent || "",
                    targetContent,
                    triggerCheck.baselineVersionId,
                    triggerCheck.targetVersionId!,
                    targetId,
                    historyLogs, // Pass latest history logs
                    baseHandleAddHistory,
                    baseHandleUpdateHistory,
                    baseHandleDeleteHistory
                );
            }
        }

        return result;
    }, [baseSaveGlobalStoryState, evaluateBackgroundTrigger, processBackgroundHistory, activeCordHistoryInterval, isCordActiveModeEnabled, historyLogs, setHistoryLogs]);

    // 7. Context Builder
    const contextBuilder = useWombContext({
        content, keywordScanRange, wombContextLength,
        mommyList, nerdList, loreList,
        activeMommyIds, activeNerdIds, activeLoreIds,
        activeHistoryLogs, currentStoryId
    });
    const { buildWombContext } = contextBuilder;

    // 8. Generation & Debug
    const generation = useWombGeneration({
        lang, apiKey, novelAIApiKey, aiModel, aiThinkingLevel, wombChunkLimit, wombOutputLength,
        content, setContent,
        currentStoryId, setCurrentStoryId,
        savedStories: story.savedStories,
        globalRelations, activeMommyIds, activeNerdIds, activeLoreIds,
        saveGlobalStoryState, lastSavedContentRef, // pass UNWRAPPED to generation hook so it can manage its own lifecycle pre/post 
        showWombDebugInfo, buildWombContext, isCordActiveModeEnabled
    });
    const { isGenerating, handleSave, handleCutContext, debugSystemPrompt, debugInputText, debugMatchedEntities } = generation;

    // --- Complex Composition Handlers ---

    // Decorate handleManualSave to use the wrapped saveGlobalStoryState
    const handleManualSave = useCallback(() => {
        if (!content.trim()) return null;

        let targetStoryId = currentStoryId;
        if (!targetStoryId) {
            targetStoryId = Date.now().toString();
            setCurrentStoryId(targetStoryId);
        }

        saveGlobalStoryState(
            targetStoryId,
            content,
            'manual',
            activeMommyIds,
            activeNerdIds,
            activeLoreIds
        );

        return targetStoryId;
    }, [content, currentStoryId, activeMommyIds, activeNerdIds, activeLoreIds, saveGlobalStoryState, setCurrentStoryId]);

    // Decorate handleAddHistory to automatically pass the current version id
    const handleAddHistory = useCallback((entityId: string, initialContent?: string) => {
        const currentActiveStory = story.savedStories.find(s => s.id === currentStoryId);
        return baseHandleAddHistory(entityId, currentStoryId, currentActiveStory?.currentVersionId || null, initialContent);
    }, [currentStoryId, story.savedStories, baseHandleAddHistory]);

    // Decorate handleUpdateHistory to automatically pass the current version id
    const handleUpdateHistory = useCallback((id: string, newContent: string) => {
        const currentActiveStory = story.savedStories.find(s => s.id === currentStoryId);
        // [WARNING: ERROR STATE]
        // "draft" が渡されることは本来あり得ない異常系（エラー）です。
        // もし "draft" が適用された場合、対象のヒストリーは正しいLineageから外れてしまいます。
        // 呼び出し側のアプローチを見直し、必ず正しいVersionIDが存在する状態で呼び出すように修正してください。
        baseHandleUpdateHistory(id, newContent, currentActiveStory?.currentVersionId || "draft");
    }, [currentStoryId, story.savedStories, baseHandleUpdateHistory]);

    // Decorate handleDeleteHistory to automatically pass the current version id
    const handleDeleteHistory = useCallback((id: string) => {
        baseHandleDeleteHistory(id);
    }, [baseHandleDeleteHistory]);

    // Handle full history add (Cord integration)
    const handleAddFullHistory = useCallback((entityId: string, historyContent: string) => {
        try {
            let targetStoryId = currentStoryId;
            if (!targetStoryId) {
                targetStoryId = Date.now().toString();
                setCurrentStoryId(targetStoryId);
            }

            // 1. Save Story State FIRST to determine if a new version is spawned
            const result = saveGlobalStoryState(
                targetStoryId,
                content,
                'manual',
                activeMommyIds, activeNerdIds, activeLoreIds
            );

            // 2. Extract the newly resolved currentVersionId (either identical to before, or a newly spawned child)
            const updatedStory = result.newStories.find(s => s.id === targetStoryId);
            const resolvedVersionId = updatedStory?.currentVersionId || 'draft';

            // 3. Create the History Log attached to the correct resolved version using abstractions
            baseHandleAddHistory(entityId, targetStoryId, resolvedVersionId, historyContent);
        } catch (error) {
            console.error("[useWombSystem] Failed to add and save history:", error);
        }
    }, [currentStoryId, content, activeMommyIds, activeNerdIds, activeLoreIds, saveGlobalStoryState, setCurrentStoryId, baseHandleAddHistory, baseHandleUpdateHistory]);

    const handleSaveHistory = useCallback(() => {
        try {
            let targetStoryId = currentStoryId;
            if (!targetStoryId) {
                targetStoryId = Date.now().toString();
                setCurrentStoryId(targetStoryId);
            }

            // Use normal saveGlobalStoryState here, the callback handles trigger
            saveGlobalStoryState(
                targetStoryId, content, 'manual',
                activeMommyIds, activeNerdIds, activeLoreIds
            );

            const updatedLogs = historyLogs.map(log =>
                (log.storyId === "" || log.storyId === targetStoryId)
                    ? { ...log, storyId: targetStoryId! }
                    : log
            );
            setHistoryLogs(updatedLogs);
            localStorage.setItem('deborah_history_logs_v1', JSON.stringify(updatedLogs));
        } catch (error) {
            console.error("Failed to save history:", error);
            alert("Save Error: " + error);
        }
    }, [currentStoryId, content, historyLogs, activeMommyIds, activeNerdIds, activeLoreIds, saveGlobalStoryState, setCurrentStoryId, setHistoryLogs]);

    const triggerAutoHistory = useCallback(() => {
        let targetStoryId = currentStoryId;
        if (!targetStoryId) {
            targetStoryId = Date.now().toString();
            setCurrentStoryId(targetStoryId);
        }

        // 1. Force a save so evaluateBackgroundTrigger has the latest state in localStorage
        saveGlobalStoryState(
            targetStoryId, content, 'manual',
            activeMommyIds, activeNerdIds, activeLoreIds
        );

        // 2. Evaluate with a threshold of 0 to guarantee it runs
        const triggerCheck = evaluateBackgroundTrigger(targetStoryId, content, 0);

        // 3. Kick off the heavy background background job using the same pipeline
        if (triggerCheck && triggerCheck.shouldTrigger && triggerCheck.baselineVersionId) {
            processBackgroundHistory(
                triggerCheck.baselineContent || "",
                content,
                triggerCheck.baselineVersionId,
                triggerCheck.targetVersionId!,
                targetStoryId,
                historyLogs, // Pass latest history logs
                baseHandleAddHistory,
                baseHandleUpdateHistory,
                baseHandleDeleteHistory
            );
        } else {
            console.warn("[triggerAutoHistory] evaluateBackgroundTrigger returned false or missing params", triggerCheck);
        }
    }, [currentStoryId, content, saveGlobalStoryState, activeMommyIds, activeNerdIds, activeLoreIds, evaluateBackgroundTrigger, processBackgroundHistory, historyLogs, baseHandleAddHistory, baseHandleUpdateHistory, baseHandleDeleteHistory, setCurrentStoryId]);

    return {
        // Direct Pass-throughs
        ...settings,
        ...lore,
        ...story, // includes handleManualSave, handleUndo/Redo, etc.
        handleDelete: story.handleDeleteStory,
        showLorebook,
        setShowLorebook,

        // Debug
        debugSystemPrompt,
        debugInputText,
        debugMatchedEntities,

        // Wrapped Handlers
        isGenerating,
        handleSave,
        handleCutContext,
        handleManualSave,
        handleAddHistory,
        handleUpdateHistory,
        handleDeleteHistory,
        handleAddFullHistory,
        handleSaveHistory,
        buildWombContext,

        // Active CORD Background
        isBackgroundProcessing,
        processingTargetName,
        evaluateBackgroundTrigger,
        processBackgroundHistory,
        triggerAutoHistory,
        triggerWombGeneration: handleSave,

        // History specifics passed out explicitly
        invalidations,
        getActiveLineage,
        handleToggleInvalidateHistory,

        // Override the raw historyLogs with the Lineage-filtered ones
        historyLogs: activeHistoryLogs
    };
};
