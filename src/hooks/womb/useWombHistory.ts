import { useState, useEffect, useCallback } from 'react';
import { StoryEntityHistory } from '../../types';

export const useWombHistory = () => {
    // History State
    const [historyLogs, setHistoryLogs] = useState<StoryEntityHistory[]>([]);

    // Load on mount
    useEffect(() => {
        const storedHistory = localStorage.getItem('deborah_history_logs_v1');
        if (storedHistory) { try { setHistoryLogs(JSON.parse(storedHistory)); } catch (e) { console.error(e); } }
    }, []);

    // Basic History Handlers
    const handleAddHistory = useCallback((entityId: string, currentStoryId: string | null) => {
        const targetStoryId = currentStoryId || ""; // Empty string = Draft Mode

        const newId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        const newHistory: StoryEntityHistory = {
            id: newId,
            storyId: targetStoryId,
            entityId: entityId,
            content: '',
            createdAt: Date.now()
        };
        const updatedLogs = [...historyLogs, newHistory];
        setHistoryLogs(updatedLogs);
        return newId;
    }, [historyLogs]);

    const handleUpdateHistory = useCallback((id: string, newContent: string) => {
        const updatedLogs = historyLogs.map(log =>
            log.id === id ? { ...log, content: newContent } : log
        );
        setHistoryLogs(updatedLogs);
    }, [historyLogs]);

    const handleDeleteHistory = useCallback((id: string) => {
        if (window.confirm("Delete this history entry?")) {
            const updatedLogs = historyLogs.filter(log => log.id !== id);
            setHistoryLogs(updatedLogs);
            localStorage.setItem('deborah_history_logs_v1', JSON.stringify(updatedLogs));
        }
    }, [historyLogs]);

    return {
        historyLogs,
        setHistoryLogs,
        handleAddHistory,
        handleUpdateHistory,
        handleDeleteHistory
    };
};
