import { useState, useEffect, useCallback } from 'react';
import { Story, LoreItem, StoryLoreRelation, StoryEntityHistory } from '../types';

interface UseWombSystemProps {
    lang: 'ja' | 'en';
}

export const useWombSystem = ({ lang }: UseWombSystemProps) => {
    // --- STATE ---

    // Settings State
    const [wombOutputLength, setWombOutputLength] = useState<number>(1000);
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
    const [apiKey, setApiKey] = useState<string>('');

    // Load API Key on mount (localStorage > .env)
    useEffect(() => {
        const storedKey = localStorage.getItem('womb_gemini_api_key');
        if (storedKey) {
            setApiKey(storedKey);
        } else {
            // Fallback to .env
            const envKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (envKey) {
                setApiKey(envKey);
                // Optional: Don't save to localStorage automatically to keep them separate?
                // Or save it so it's editable?
                // User said "initial value". If we save to LS, it becomes persistent.
                // Let's NOT save to LS immediately, just set state.
                // But `save API Key when changed` effect will trigger on next render if we look at `apiKey` dependency?
                // No, dependency is `[apiKey]`. Setting state triggers it.
                // So it will be saved to LS. This is acceptable behavior (importing from env to local settings).
            }
        }
    }, []);

    // Save API Key when changed
    useEffect(() => {
        if (apiKey) {
            localStorage.setItem('womb_gemini_api_key', apiKey);
        }
    }, [apiKey]);

    // Generation State
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // Story Management State
    const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
    const [content, setContent] = useState<string>("");

    // Active Lore State for Current Story
    const [activeMommyIds, setActiveMommyIds] = useState<string[]>([]);
    const [activeNerdIds, setActiveNerdIds] = useState<string[]>([]);
    const [activeLoreIds, setActiveLoreIds] = useState<string[]>([]);

    const [savedStories, setSavedStories] = useState<Story[]>([]);
    const [showFileList, setShowFileList] = useState<boolean>(false);
    const [showLorebook, setShowLorebook] = useState<boolean>(false);

    // Lore Data (Loaded from main storage)
    const [mommyList, setMommyList] = useState<LoreItem[]>([]);
    const [nerdList, setNerdList] = useState<LoreItem[]>([]);
    const [loreList, setLoreList] = useState<LoreItem[]>([]);

    // Global Relations State (Join Table)
    const [globalRelations, setGlobalRelations] = useState<StoryLoreRelation[]>([]);

    // History State
    const [historyLogs, setHistoryLogs] = useState<StoryEntityHistory[]>([]);

    // --- EFFECTS ---

    // Load stories and Lore data on mount
    useEffect(() => {
        const storedStories = localStorage.getItem('womb_stories');
        if (storedStories) {
            try { setSavedStories(JSON.parse(storedStories)); } catch (e) { console.error(e); }
        }

        const storedMommy = localStorage.getItem('deborah_fuckmeat_v1');
        if (storedMommy) { try { setMommyList(JSON.parse(storedMommy)); } catch (e) { console.error(e); } }

        const storedNerd = localStorage.getItem('deborah_penis_v1');
        if (storedNerd) { try { setNerdList(JSON.parse(storedNerd)); } catch (e) { console.error(e); } }

        const storedLore = localStorage.getItem('deborah_lore_v1');
        if (storedLore) { try { setLoreList(JSON.parse(storedLore)); } catch (e) { console.error(e); } }

        const storedRelations = localStorage.getItem('womb_story_relations');
        if (storedRelations) { try { setGlobalRelations(JSON.parse(storedRelations)); } catch (e) { console.error(e); } }

        const storedHistory = localStorage.getItem('deborah_history_logs_v1');
        if (storedHistory) { try { setHistoryLogs(JSON.parse(storedHistory)); } catch (e) { console.error(e); } }
    }, []);

    // --- ACTIONS ---

    // --- ACTIONS ---

    // Save to LocalStorage Helper
    const saveToLocalStorage = useCallback((stories: Story[]) => {
        localStorage.setItem('womb_stories', JSON.stringify(stories));
        setSavedStories(stories);
    }, []);

    // Core Story Save Logic
    const saveStoryData = useCallback((currentId: string, currentContent: string, existingStories: Story[], now: number) => {
        let newStories = [...existingStories];
        const derivedTitle = currentContent.split('\n')[0]?.trim() || "Untitled Story";

        const storyData = {
            title: derivedTitle,
            content: currentContent,
            updatedAt: now
        };

        const existingStoryIndex = newStories.findIndex(s => s.id === currentId);

        if (existingStoryIndex >= 0) {
            // Update existing
            newStories[existingStoryIndex] = {
                ...newStories[existingStoryIndex],
                ...storyData
            };
        } else {
            // Create New (handle "ghost" stories or brand new ones)
            const newStory: Story = {
                id: currentId,
                ...storyData,
                createdAt: now
            };
            newStories.push(newStory);
        }
        return newStories;
    }, []);

    // Unified Global Save Logic (Story + Relations)
    const saveGlobalStoryState = useCallback((
        targetId: string,
        targetContent: string,
        currentStories: Story[],
        currentRelations: StoryLoreRelation[],
        activeMommies: string[],
        activeNerds: string[],
        activeLores: string[]
    ) => {
        const now = Date.now();
        // 1. Save Story Data
        const newStories = saveStoryData(targetId, targetContent, currentStories, now);
        saveToLocalStorage(newStories);

        // 2. Save Relations
        const otherRelations = currentRelations.filter(r => r.storyId !== targetId);
        const newRelations: StoryLoreRelation[] = [
            ...activeMommies.map(id => ({ id: crypto.randomUUID(), storyId: targetId, entityId: id, entityType: 'mommy' as const })),
            ...activeNerds.map(id => ({ id: crypto.randomUUID(), storyId: targetId, entityId: id, entityType: 'nerd' as const })),
            ...activeLores.map(id => ({ id: crypto.randomUUID(), storyId: targetId, entityId: id, entityType: 'lore' as const }))
        ];
        const updatedGlobalRelations = [...otherRelations, ...newRelations];
        setGlobalRelations(updatedGlobalRelations);
        localStorage.setItem('womb_story_relations', JSON.stringify(updatedGlobalRelations));

        const derivedTitle = targetContent.split('\n')[0]?.trim() || "Untitled Story";
        alert("System Saved: " + derivedTitle);

        return { newStories, updatedGlobalRelations };
    }, [saveStoryData, saveToLocalStorage]);


    // Handle Save (Triggered by GENERATE)
    const handleSave = useCallback(() => {
        setIsGenerating(true); // Show loading state briefly

        let newId = currentStoryId;
        if (!newId) {
            newId = Date.now().toString();
            setCurrentStoryId(newId);
        }

        // Use Unified Save Helper
        saveGlobalStoryState(
            newId,
            content,
            savedStories,
            globalRelations,
            activeMommyIds,
            activeNerdIds,
            activeLoreIds
        );

        // Simulate AI generation/saving delay
        setTimeout(() => {
            setIsGenerating(false);
            // Optional: Show toast here
        }, 800);
    }, [savedStories, currentStoryId, content, globalRelations, activeMommyIds, activeNerdIds, activeLoreIds, saveGlobalStoryState]);

    // Helper: Clean up state when transitioning to a fresh story
    const transitionToNewStory = useCallback(() => {
        setContent("");
        setCurrentStoryId(null);
        setActiveMommyIds([]);
        setActiveNerdIds([]);
        setActiveLoreIds([]);

        // Clear any abandoned "draft" history logs (storyId === "")
        const cleanLogs = historyLogs.filter(log => log.storyId !== "");
        if (cleanLogs.length !== historyLogs.length) {
            setHistoryLogs(cleanLogs);
        }
    }, [historyLogs]);

    const handleNewStory = useCallback(() => {
        transitionToNewStory();
    }, [transitionToNewStory]);

    // Handle Delete
    const handleDelete = useCallback((e: React.MouseEvent, storyId: string) => {
        e.stopPropagation();
        const confirmMessage = lang === 'ja'
            ? "このストーリーを削除してもよろしいですか？"
            : "Are you sure you want to delete this story?";

        if (window.confirm(confirmMessage)) {
            const newStories = savedStories.filter(s => s.id !== storyId);
            saveToLocalStorage(newStories);

            // Cascade Delete: Remove relations
            const newRelations = globalRelations.filter(r => r.storyId !== storyId);
            setGlobalRelations(newRelations);
            localStorage.setItem('womb_story_relations', JSON.stringify(newRelations));

            // If deleting current story, clear editor using standard transition
            if (currentStoryId === storyId) {
                transitionToNewStory();
            }
        }
    }, [savedStories, lang, globalRelations, currentStoryId, saveToLocalStorage, transitionToNewStory]);


    // --- History Handlers ---

    const handleAddHistory = useCallback((entityId: string) => {
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
    }, [currentStoryId, historyLogs]);

    const handleUpdateHistory = useCallback((id: string, newContent: string) => {
        const updatedLogs = historyLogs.map(log =>
            log.id === id ? { ...log, content: newContent } : log
        );
        setHistoryLogs(updatedLogs);
        // localStorage.setItem('deborah_history_logs_v1', JSON.stringify(updatedLogs)); // REMOVED: Defer save
    }, [historyLogs]);

    const handleSaveHistory = useCallback(() => {
        try {
            let targetStoryId = currentStoryId;

            // 1. Lazy Story Creation (If saving a draft)
            if (!targetStoryId) {
                targetStoryId = Date.now().toString();
                setCurrentStoryId(targetStoryId); // Switch from Draft to Real Mode
            }

            // 2. Perform Full Save (Story + Relations)
            // Now using the EXACT same logic as GENERATE
            saveGlobalStoryState(
                targetStoryId,
                content,
                savedStories,
                globalRelations,
                activeMommyIds,
                activeNerdIds,
                activeLoreIds
            );

            // 3. Update History Logs (Link Drafts to Real Story ID)
            // If we were in draft mode, any history items with empty storyId need to be claimed by this new story
            const updatedLogs = historyLogs.map(log =>
                (log.storyId === "" || log.storyId === targetStoryId)
                    ? { ...log, storyId: targetStoryId! }
                    : log
            );

            setHistoryLogs(updatedLogs);
            localStorage.setItem('deborah_history_logs_v1', JSON.stringify(updatedLogs));

            // 4. Feedback
            // const derivedTitle = content.split('\n')[0]?.trim() || "Untitled Story";
            // alert("System Saved: " + derivedTitle);
        } catch (error) {
            console.error("Failed to save history:", error);
            alert("Save Error: " + error);
        }
    }, [savedStories, currentStoryId, content, historyLogs, lang, saveGlobalStoryState, globalRelations, activeMommyIds, activeNerdIds, activeLoreIds]);

    const handleDeleteHistory = useCallback((id: string) => {
        if (window.confirm("Delete this history entry?")) {
            const updatedLogs = historyLogs.filter(log => log.id !== id);
            setHistoryLogs(updatedLogs);
            localStorage.setItem('deborah_history_logs_v1', JSON.stringify(updatedLogs));
        }
    }, [historyLogs]);




    const handleSelectStory = useCallback((story: Story, relations: StoryLoreRelation[]) => {
        // Clear any abandoned "draft" history logs (storyId === "") before switching
        const cleanLogs = historyLogs.filter(log => log.storyId !== "");
        if (cleanLogs.length !== historyLogs.length) {
            setHistoryLogs(cleanLogs);
        }

        setContent(story.content);
        setCurrentStoryId(story.id);
        // Load Active Lore from Relations
        setActiveMommyIds(relations.filter(r => r.entityType === 'mommy').map(r => r.entityId));
        setActiveNerdIds(relations.filter(r => r.entityType === 'nerd').map(r => r.entityId));
        setActiveLoreIds(relations.filter(r => r.entityType === 'lore').map(r => r.entityId));
        setShowFileList(false);
    }, [historyLogs]);

    return {
        // State
        wombOutputLength, setWombOutputLength,
        showSettings, setShowSettings,
        showDebugInfo, setShowDebugInfo,
        apiKey, setApiKey,
        isGenerating,
        currentStoryId, setCurrentStoryId,
        content, setContent,
        activeMommyIds, setActiveMommyIds,
        activeNerdIds, setActiveNerdIds,
        activeLoreIds, setActiveLoreIds,
        savedStories,
        showFileList, setShowFileList,
        showLorebook, setShowLorebook,
        mommyList, nerdList, loreList,
        globalRelations,
        historyLogs,

        // Actions
        handleSave,
        handleDelete,
        handleAddHistory,
        handleUpdateHistory,
        handleSaveHistory,
        handleDeleteHistory,
        handleNewStory,
        handleSelectStory,
        displayTitle: content.split('\n')[0]?.trim()
    };
};
