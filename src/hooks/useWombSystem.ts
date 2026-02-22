import { useState, useEffect, useCallback } from 'react';
import { Story, LoreItem, StoryLoreRelation, StoryEntityHistory } from '../types';

interface UseWombSystemProps {
    lang: 'ja' | 'en';
}

export const useWombSystem = ({ lang }: UseWombSystemProps) => {
    // --- STATE ---

    // Settings State
    const [wombOutputLength, setWombOutputLength] = useState<number>(() => {
        const stored = localStorage.getItem('womb_output_length');
        return stored ? Number(stored) : 1000;
    });
    const [cordOutputLength, setCordOutputLength] = useState<number>(() => {
        const stored = localStorage.getItem('cord_output_length');
        return stored ? Number(stored) : 300;
    });
    const [keywordScanRange, setKeywordScanRange] = useState<number>(() => {
        const stored = localStorage.getItem('womb_keyword_scan_range');
        // デフォルトは2000文字程度（直近の数シーン分）がコンテキストとして多すぎず少なすぎず適正。
        return stored ? Number(stored) : 2000;
    });
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [showDebugInfo, setShowDebugInfo] = useState<boolean>(() => {
        const stored = localStorage.getItem('cord_debug_info');
        return stored === 'true';
    });
    const [showWombDebugInfo, setShowWombDebugInfo] = useState<boolean>(() => {
        const stored = localStorage.getItem('womb_debug_info');
        return stored === 'true';
    });

    // API Keys
    const [apiKey, setApiKey] = useState<string>(''); // Gemini
    // TMDB Access Token
    const [tmdbAccessToken, setTmdbAccessToken] = useState<string>('');

    // AI Model
    const [aiModel, setAiModel] = useState<'gemini-2.5-flash' | 'gemini-3.1-pro-preview'>(() => {
        const stored = localStorage.getItem('womb_ai_model');
        return (stored as 'gemini-2.5-flash' | 'gemini-3.1-pro-preview') || 'gemini-2.5-flash';
    });

    // Load API Keys on mount (localStorage > .env)
    useEffect(() => {
        // Gemini
        const storedKey = localStorage.getItem('womb_gemini_api_key');
        if (storedKey) {
            setApiKey(storedKey);
        } else {
            const envKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (envKey) setApiKey(envKey);
        }

        // TMDB
        const storedTmdbToken = localStorage.getItem('womb_tmdb_access_token');
        if (storedTmdbToken) {
            setTmdbAccessToken(storedTmdbToken);
        } else {
            const envTmdbToken = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
            if (envTmdbToken) setTmdbAccessToken(envTmdbToken);
        }
    }, []);

    // Save API Keys when changed
    useEffect(() => {
        if (apiKey) localStorage.setItem('womb_gemini_api_key', apiKey);
    }, [apiKey]);

    useEffect(() => {
        if (tmdbAccessToken) localStorage.setItem('womb_tmdb_access_token', tmdbAccessToken);
    }, [tmdbAccessToken]);

    useEffect(() => {
        localStorage.setItem('womb_ai_model', aiModel);
    }, [aiModel]);

    useEffect(() => {
        localStorage.setItem('womb_output_length', wombOutputLength.toString());
    }, [wombOutputLength]);

    useEffect(() => {
        localStorage.setItem('cord_output_length', cordOutputLength.toString());
    }, [cordOutputLength]);

    useEffect(() => {
        localStorage.setItem('womb_keyword_scan_range', keywordScanRange.toString());
    }, [keywordScanRange]);

    useEffect(() => {
        localStorage.setItem('cord_debug_info', showDebugInfo.toString());
    }, [showDebugInfo]);

    useEffect(() => {
        localStorage.setItem('womb_debug_info', showWombDebugInfo.toString());
    }, [showWombDebugInfo]);

    // Generation State
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // WOMB Debug State
    const [debugSystemPrompt, setDebugSystemPrompt] = useState<string>('');
    const [debugInputText, setDebugInputText] = useState<string>('');
    const [debugMatchedEntities, setDebugMatchedEntities] = useState<LoreItem[]>([]);

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


    // Helper: Build WOMB Context (Entities & Content)
    const buildWombContext = useCallback(async () => {
        const { parseStoryContent } = await import('../utils/bison');
        const cleanedContent = parseStoryContent(content);

        const scanTargetContent = cleanedContent.slice(-keywordScanRange);

        const allLoreItems = [...mommyList, ...nerdList, ...loreList];

        const allActiveLoreItems = [
            ...mommyList.filter(item => activeMommyIds.includes(item.id)),
            ...nerdList.filter(item => activeNerdIds.includes(item.id)),
            ...loreList.filter(item => activeLoreIds.includes(item.id))
        ];

        const matchedLoreItems = allActiveLoreItems.filter(item => {
            if ('isAlwaysActive' in item && item.isAlwaysActive) return true;
            const nameMatch = scanTargetContent.includes(item.name);
            const keywordMatch = item.keywords.some(kw => scanTargetContent.includes(kw));
            return nameMatch || keywordMatch;
        });

        // [NOTE] Why is this system prompt hardcoded in English?
        // LLMs (like Gemini) generally follow strict, logical rules (like syntax parsing for #region) 
        // much more accurately when instructed in English rather than Japanese. 
        // Therefore, regardless of the UI's language setting, the core meta-instructions are kept in English 
        // to maximize adherence to the "Bison syntax" rules.
        let systemInstruction = `=== WRITING INSTRUCTIONS ===
You are an expert AI co-writer (codename: WOMB). 
The user is writing a story. You must continue the story naturally based on the provided text.

CRITICAL RULE:
If you see lines enclosed in "#region" and "#endregion" that start with "//", these are DIRECT META-INSTRUCTIONS from the author to you. 
Example:
#region
// Make the next scene more dramatic and focus on Deborah's anger.
#endregion

Do NOT output these instructions in your generated text. Instead, strictly FOLLOW the instructions provided in those lines when writing the continuation of the story.
===========================
`;
        if (matchedLoreItems.length > 0) {
            systemInstruction = matchedLoreItems.map(item => {
                if (item.type === 'lore') {
                    return `Name: ${item.name}, Summary: ${item.summary}`;
                } else if (item.type === 'fuckmeat') {
                    return `Name: ${item.name}, Age: ${item.age}, Face: ${item.face}, Height: ${item.height}(cm), Measurements: B${item.bust}/W${item.waist}/H${item.hip}(cm), History: ${item.history}`;
                } else if (item.type === 'penis') {
                    return `Name: ${item.name}, Age: ${item.age}, History: ${item.history}`;
                }
                return "";
            }).join('\n');

            // --- Inject Specific Story History Logs ---
            const relevantHistory = historyLogs
                .filter(log => log.storyId === currentStoryId && matchedLoreItems.some(item => item.id === log.entityId))
                .sort((a, b) => a.createdAt - b.createdAt); // Chronological order

            if (relevantHistory.length > 0) {
                const historyStr = matchedLoreItems.map(item => {
                    const logsForEntity = relevantHistory.filter(log => log.entityId === item.id);
                    if (logsForEntity.length === 0) return "";
                    const evStr = logsForEntity.map(log => `- ${log.content}`).join('\n');
                    return `\n[Recent History for ${item.name}]\n${evStr}`;
                }).filter(Boolean).join('\n');

                if (historyStr) {
                    systemInstruction += `\n\n=== PAST EVENTS IN THIS STORY ===${historyStr}`;
                }
            }
        }

        const derivedTitle = content.split('\n')[0]?.trim() || "Untitled Story";

        return { systemInstruction, scanTargetContent, matchedLoreItems, allActiveLoreItems, allLoreItems, cleanedContent, storyTitle: derivedTitle };
    }, [content, keywordScanRange, mommyList, activeMommyIds, nerdList, activeNerdIds, loreList, activeLoreIds, historyLogs, currentStoryId]);


    // Action: Save System (Generate Story)
    const handleSave = useCallback(async () => {
        if (!content.trim()) return;

        setIsGenerating(true);

        try {
            const { callGemini } = await import('../utils/gemini');

            // Call the shared context builder
            const { systemInstruction, cleanedContent, matchedLoreItems } = await buildWombContext();

            // Set debug info
            if (showWombDebugInfo) {
                setDebugSystemPrompt(systemInstruction);
                setDebugInputText(cleanedContent);
                setDebugMatchedEntities(matchedLoreItems);
            }

            const generatedText = await callGemini(apiKey, cleanedContent, aiModel, systemInstruction);

            // Append generated text
            const newContent = content + '\n' + generatedText;
            setContent(newContent);

            let newId = currentStoryId;
            if (!newId) {
                newId = Date.now().toString();
                setCurrentStoryId(newId);
            }

            // Save via helper (Draft or Update)
            saveGlobalStoryState(
                newId,
                newContent,
                savedStories,
                globalRelations,
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
        apiKey, aiModel, content, currentStoryId, savedStories, globalRelations,
        activeMommyIds, activeNerdIds, activeLoreIds, saveGlobalStoryState, lang,
        keywordScanRange, mommyList, nerdList, loreList // Added to dependencies
    ]);

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

    const handleAddFullHistory = useCallback((entityId: string, historyContent: string) => {
        console.log("[useWombSystem] handleAddFullHistory CALLED with:", { entityId, historyContent, currentStoryId });
        try {
            let targetStoryId = currentStoryId;

            if (!targetStoryId) {
                targetStoryId = Date.now().toString();
                setCurrentStoryId(targetStoryId);
                console.log("[useWombSystem] Story was unsaved, generated new targetStoryId:", targetStoryId);
            }

            const newId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            const newHistory: StoryEntityHistory = {
                id: newId,
                storyId: targetStoryId,
                entityId: entityId,
                content: historyContent,
                createdAt: Date.now()
            };

            const updatedLogs = [...historyLogs, newHistory].map(log =>
                (log.storyId === "" || log.storyId === targetStoryId)
                    ? { ...log, storyId: targetStoryId! }
                    : log
            );

            console.log("[useWombSystem] Saving historyLogs. new length:", updatedLogs.length);
            setHistoryLogs(updatedLogs);
            localStorage.setItem('deborah_history_logs_v1', JSON.stringify(updatedLogs));

            console.log("[useWombSystem] Calling saveGlobalStoryState...");
            saveGlobalStoryState(
                targetStoryId,
                content,
                savedStories,
                globalRelations,
                activeMommyIds,
                activeNerdIds,
                activeLoreIds
            );
            console.log("[useWombSystem] handleAddFullHistory COMPLETED SUCCESS");
        } catch (error) {
            console.error("[useWombSystem] Failed to add and save history:", error);
        }
    }, [currentStoryId, historyLogs, content, savedStories, globalRelations, activeMommyIds, activeNerdIds, activeLoreIds, saveGlobalStoryState]);

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
        cordOutputLength, setCordOutputLength,
        keywordScanRange, setKeywordScanRange,
        showSettings, setShowSettings,
        showDebugInfo, setShowDebugInfo,
        showWombDebugInfo, setShowWombDebugInfo,
        apiKey, setApiKey,
        tmdbAccessToken, setTmdbAccessToken,
        aiModel, setAiModel,
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

        // Debug State
        debugSystemPrompt,
        debugInputText,
        debugMatchedEntities,

        // Actions
        handleSave,
        handleDelete,
        handleAddHistory,
        handleUpdateHistory,
        handleSaveHistory,
        handleAddFullHistory,
        handleDeleteHistory,
        handleNewStory,
        handleSelectStory,
        buildWombContext,
        displayTitle: content.split('\n')[0]?.trim()
    };
};
