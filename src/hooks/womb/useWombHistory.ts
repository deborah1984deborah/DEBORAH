import { useState, useEffect, useCallback } from 'react';
import { StoryEntityHistory, StoryEntityHistoryInvalidation } from '../../types';

export const useWombHistory = () => {
    // History State
    const [historyLogs, setHistoryLogs] = useState<StoryEntityHistory[]>([]);
    const [invalidations, setInvalidations] = useState<StoryEntityHistoryInvalidation[]>([]);

    // Load on mount
    useEffect(() => {
        const storedHistory = localStorage.getItem('deborah_history_logs_v1');
        if (storedHistory) { try { setHistoryLogs(JSON.parse(storedHistory)); } catch (e) { console.error(e); } }

        const storedInvalidations = localStorage.getItem('deborah_history_invalidations_v1');
        if (storedInvalidations) { try { setInvalidations(JSON.parse(storedInvalidations)); } catch (e) { console.error(e); } }
    }, []);

    // Lineage Helper
    const getActiveLineage = useCallback((currentVersionId: string | null, versions: any[]): Set<string> => {
        const lineage = new Set<string>();
        if (!currentVersionId) return lineage;

        let currentId: string | null = currentVersionId;
        while (currentId) {
            lineage.add(currentId);
            const version = versions.find(v => v.id === currentId);
            currentId = version ? version.parentId : null;
        }
        return lineage;
    }, []);

    // Basic History Handlers
    const handleAddHistory = useCallback((entityId: string, currentStoryId: string | null, currentVersionId: string | null) => {
        const targetStoryId = currentStoryId || ""; // Empty string = Draft Mode
        const targetVersionId = currentVersionId || "draft";

        const newId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        const newHistory: StoryEntityHistory = {
            id: newId,
            storyId: targetStoryId,
            versionId: targetVersionId,
            entityId: entityId,
            content: '',
            createdAt: Date.now()
        };
        const updatedLogs = [...historyLogs, newHistory];
        setHistoryLogs(updatedLogs);
        return newId;
    }, [historyLogs]);

    const handleUpdateHistory = useCallback((id: string, newContent: string, currentVersionId: string) => {
        // 1. Invalidate the old record
        const newInvalidation: StoryEntityHistoryInvalidation = {
            historyId: id,
            versionId: currentVersionId || "draft" // if drafted without a story
        };
        const updatedInvalidations = [...invalidations, newInvalidation];
        setInvalidations(updatedInvalidations);
        localStorage.setItem('deborah_history_invalidations_v1', JSON.stringify(updatedInvalidations));

        // 2. Create the new record (re-using the old entityId and storyId)
        const oldLog = historyLogs.find(h => h.id === id);
        if (oldLog) {
            const newId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            const newHistory: StoryEntityHistory = {
                id: newId,
                storyId: oldLog.storyId,
                versionId: currentVersionId || "draft",
                entityId: oldLog.entityId,
                content: newContent,
                createdAt: Date.now()
            };
            const updatedLogs = [...historyLogs, newHistory];
            setHistoryLogs(updatedLogs);
            localStorage.setItem('deborah_history_logs_v1', JSON.stringify(updatedLogs));
        }
    }, [historyLogs, invalidations]);

    const handleDeleteHistory = useCallback((id: string, currentVersionId: string) => {
        if (window.confirm("Delete this history entry?")) {
            // Logical Delete: Add an invalidation record instead of splicing the array
            const newInvalidation: StoryEntityHistoryInvalidation = {
                historyId: id,
                versionId: currentVersionId || "draft" // Fallback for no-story state
            };
            const updatedInvalidations = [...invalidations, newInvalidation];
            setInvalidations(updatedInvalidations);
            localStorage.setItem('deborah_history_invalidations_v1', JSON.stringify(updatedInvalidations));
        }
    }, [invalidations]);

    return {
        historyLogs,
        setHistoryLogs,
        invalidations,
        setInvalidations,
        getActiveLineage,
        handleAddHistory,
        handleUpdateHistory,
        handleDeleteHistory
    };
};
