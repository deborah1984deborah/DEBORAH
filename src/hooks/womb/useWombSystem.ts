import { useCallback, useState } from 'react';
import { StoryEntityHistory } from '../../types';
import { useWombSettings } from './useWombSettings';
import { useWombLore } from './useWombLore';
import { useWombHistory } from './useWombHistory';
import { useWombStory } from './useWombStory';
import { useWombContext } from './useWombContext';
import { useWombGeneration } from './useWombGeneration';

interface UseWombSystemProps {
    lang: 'ja' | 'en';
}

export const useWombSystem = ({ lang }: UseWombSystemProps) => {
    // UI State that doesn't fit specific domains
    const [showLorebook, setShowLorebook] = useState<boolean>(false);

    // 1. Settings
    const settings = useWombSettings();
    const { apiKey, aiModel, keywordScanRange, showWombDebugInfo, wombContextLength } = settings;

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
        historyLogs, setHistoryLogs, getActiveLineage,
        handleAddHistory: baseHandleAddHistory,
        handleUpdateHistory, handleDeleteHistory
    } = history;

    // 4. Story (State & Versioning)
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
        saveGlobalStoryState,
        activeHistoryLogs, lastSavedContentRef
    } = story;

    // 5. Context Builder
    const contextBuilder = useWombContext({
        content, keywordScanRange, wombContextLength,
        mommyList, nerdList, loreList,
        activeMommyIds, activeNerdIds, activeLoreIds,
        activeHistoryLogs, currentStoryId
    });
    const { buildWombContext } = contextBuilder;

    // 6. Generation & Debug
    const generation = useWombGeneration({
        lang, apiKey, aiModel,
        content, setContent,
        currentStoryId, setCurrentStoryId,
        savedStories: story.savedStories,
        globalRelations, activeMommyIds, activeNerdIds, activeLoreIds,
        saveGlobalStoryState, lastSavedContentRef,
        showWombDebugInfo, buildWombContext
    });
    const { isGenerating, handleSave, debugSystemPrompt, debugInputText, debugMatchedEntities } = generation;

    // --- Complex Composition Handlers ---

    // Decorate handleAddHistory to automatically pass the current version id
    const handleAddHistory = useCallback((entityId: string) => {
        const currentActiveStory = story.savedStories.find(s => s.id === currentStoryId);
        return baseHandleAddHistory(entityId, currentStoryId, currentActiveStory?.currentVersionId || null);
    }, [currentStoryId, story.savedStories, baseHandleAddHistory]);

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

            // 3. Create the History Log attached to the correct resolved version
            const newId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            const newHistory: StoryEntityHistory = {
                id: newId,
                storyId: targetStoryId,
                versionId: resolvedVersionId,
                entityId: entityId,
                content: historyContent,
                createdAt: Date.now()
            };

            const updatedLogs = [...historyLogs, newHistory].map(log =>
                (log.storyId === "" || log.storyId === targetStoryId)
                    ? { ...log, storyId: targetStoryId! }
                    : log
            );

            setHistoryLogs(updatedLogs);
            localStorage.setItem('deborah_history_logs_v1', JSON.stringify(updatedLogs));
        } catch (error) {
            console.error("[useWombSystem] Failed to add and save history:", error);
        }
    }, [currentStoryId, historyLogs, content, story.savedStories, activeMommyIds, activeNerdIds, activeLoreIds, saveGlobalStoryState, setHistoryLogs, setCurrentStoryId]);

    const handleSaveHistory = useCallback(() => {
        try {
            let targetStoryId = currentStoryId;
            if (!targetStoryId) {
                targetStoryId = Date.now().toString();
                setCurrentStoryId(targetStoryId);
            }

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
        handleAddHistory,
        handleUpdateHistory,
        handleDeleteHistory,
        handleAddFullHistory,
        handleSaveHistory,
        buildWombContext,

        // Override the raw historyLogs with the Lineage-filtered ones
        historyLogs: activeHistoryLogs
    };
};
