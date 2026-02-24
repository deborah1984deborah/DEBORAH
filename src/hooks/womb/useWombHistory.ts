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
    const handleAddHistory = useCallback((entityId: string, currentStoryId: string | null, currentVersionId: string | null, initialContent: string = '') => {
        const targetStoryId = currentStoryId || ""; // Empty string = Draft Mode
        // [WARNING: ERROR STATE]
        // "draft" に入ることは本来あり得ない異常系（エラー）です。
        // 保存済みのStory(VersionIDが存在する状態)になってからヒストリーを保存するのが正しいデータフローです。
        // もしここに到達した場合は、後続でdraftをどうにか復旧しようとするのではなく、「なぜStoryより先にHistoryが保存されようとしたのか（例：UI側の即時保存バグなど）」という根本原因を調査・修正してください。
        const targetVersionId = currentVersionId || "draft";

        const newId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        const newHistory: StoryEntityHistory = {
            id: newId,
            storyId: targetStoryId,
            versionId: targetVersionId,
            entityId: entityId,
            content: initialContent,
            createdAt: Date.now()
        };
        setHistoryLogs(prev => {
            const updated = [...prev, newHistory];
            localStorage.setItem('deborah_history_logs_v1', JSON.stringify(updated));
            return updated;
        });
        return newId;
    }, []);

    const handleUpdateHistory = useCallback((id: string, newContent: string, currentVersionId: string) => {
        // 1. Invalidate the old record
        // [WARNING: ERROR STATE]
        // 以下の "draft" フォールバックを通ることは本来あってはならないエラー状態です。
        // ストーリーとバージョンが確定する前に更新が走る根本原因（呼び出し元）を修正する必要があります。
        const newInvalidation: StoryEntityHistoryInvalidation = {
            historyId: id,
            versionId: currentVersionId || "draft" // if drafted without a story
        };
        const updatedInvalidations = [...invalidations, newInvalidation];
        setInvalidations(updatedInvalidations);
        localStorage.setItem('deborah_history_invalidations_v1', JSON.stringify(updatedInvalidations));

        // 2. Create the new record (re-using the old entityId and storyId)
        setHistoryLogs(prev => {
            const oldLog = prev.find(h => h.id === id);
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
                const updatedLogs = [...prev, newHistory];
                localStorage.setItem('deborah_history_logs_v1', JSON.stringify(updatedLogs));
                return updatedLogs;
            }
            return prev;
        });
    }, [invalidations]);

    const handleDeleteHistory = useCallback((id: string) => {
        if (window.confirm("Delete this history entry?")) {
            setHistoryLogs(prev => {
                const updatedLogs = prev.filter(log => log.id !== id);
                localStorage.setItem('deborah_history_logs_v1', JSON.stringify(updatedLogs));
                return updatedLogs;
            });
        }
    }, []);

    const handleToggleInvalidateHistory = useCallback((historyId: string, currentVersionId: string | null, isInvalidated: boolean) => {
        const targetVersionId = currentVersionId || "draft";

        setInvalidations(prev => {
            let updated;
            if (isInvalidated) {
                // Restore (Remove invalidation entry)
                updated = prev.filter(inv => !(inv.historyId === historyId && inv.versionId === targetVersionId));
            } else {
                // Invalidate (Add invalidation entry)
                const newInvalidation: StoryEntityHistoryInvalidation = {
                    historyId,
                    versionId: targetVersionId
                };
                updated = [...prev, newInvalidation];
            }
            localStorage.setItem('deborah_history_invalidations_v1', JSON.stringify(updated));
            return updated;
        });
    }, []);

    return {
        historyLogs,
        setHistoryLogs,
        invalidations,
        setInvalidations,
        getActiveLineage,
        handleAddHistory,
        handleUpdateHistory,
        handleDeleteHistory,
        handleToggleInvalidateHistory
    };
};
