import { useState, useCallback, useRef, useEffect } from 'react';
import { Story, LoreItem, StoryLoreRelation, StoryEntityHistory } from '../../types';
import { useWombSettings } from './useWombSettings';
import { useWombLore } from './useWombLore';
import { useWombHistory } from './useWombHistory';

interface UseWombSystemProps {
    lang: 'ja' | 'en';
}

export const useWombSystem = ({ lang }: UseWombSystemProps) => {
    // --- SUB-HOOKS COMPOSITION ---
    const settings = useWombSettings();
    const lore = useWombLore();
    const history = useWombHistory();

    const {
        apiKey, aiModel, keywordScanRange, showWombDebugInfo
    } = settings;

    const {
        mommyList, nerdList, loreList,
        activeMommyIds, setActiveMommyIds,
        activeNerdIds, setActiveNerdIds,
        activeLoreIds, setActiveLoreIds,
        globalRelations, setGlobalRelations
    } = lore;

    const {
        historyLogs, setHistoryLogs,
        handleAddHistory: baseHandleAddHistory,
        handleUpdateHistory,
        handleDeleteHistory
    } = history;

    // Generation State
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // WOMB Debug State
    const [debugSystemPrompt, setDebugSystemPrompt] = useState<string>('');
    const [debugInputText, setDebugInputText] = useState<string>('');
    const [debugMatchedEntities, setDebugMatchedEntities] = useState<LoreItem[]>([]);

    // Story Management State
    const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
    const [content, setContent] = useState<string>("");
    const lastSavedContentRef = useRef<string>("");

    const [savedStories, setSavedStories] = useState<Story[]>([]);
    const [showFileList, setShowFileList] = useState<boolean>(false);
    const [showLorebook, setShowLorebook] = useState<boolean>(false);

    // Branch Selector State
    const [redoCandidates, setRedoCandidates] = useState<{ id: string, versionId: string, previewText: string }[]>([]);

    // Load stories on mount (the rest are handled by sub-hooks)
    useCallback(() => {
        // Just for initial load
    }, []);

    // Actually using useEffect instead of useCallback for mount
    useEffect(() => {
        const storedStories = localStorage.getItem('womb_stories');
        if (storedStories) {
            try { setSavedStories(JSON.parse(storedStories)); } catch (e) { console.error(e); }
        }
    }, []);

    // --- ACTIONS ---

    // --- ACTIONS ---

    // Save to LocalStorage Helper
    const saveToLocalStorage = useCallback((stories: Story[]) => {
        localStorage.setItem('womb_stories', JSON.stringify(stories));
        setSavedStories(stories);
    }, []);

    // Core Story Save Logic
    const saveStoryData = useCallback((
        currentId: string,
        currentContent: string,
        saveType: 'manual' | 'generate_pre' | 'generate_post',
        existingStories: Story[],
        now: number
    ) => {
        let newStories = [...existingStories];
        const derivedTitle = currentContent.split('\n')[0]?.trim() || "Untitled Story";

        const existingStoryIndex = newStories.findIndex(s => s.id === currentId);
        const newVersionId = "v_" + now.toString() + "_" + Math.random().toString(36).substr(2, 5);

        if (existingStoryIndex >= 0) {
            // Update existing
            const existingStory = newStories[existingStoryIndex];
            const newVersion = {
                id: newVersionId,
                parentId: existingStory.currentVersionId || null,
                content: currentContent,
                savedAt: now,
                saveType: saveType
            };

            newStories[existingStoryIndex] = {
                ...existingStory,
                title: derivedTitle,
                currentVersionId: newVersionId,
                versions: [...(existingStory.versions || []), newVersion],
                updatedAt: now
            };
        } else {
            // Create New
            const newVersion = {
                id: newVersionId,
                parentId: null,
                content: currentContent,
                savedAt: now,
                saveType: saveType
            };

            const newStory: Story = {
                id: currentId,
                title: derivedTitle,
                currentVersionId: newVersionId,
                versions: [newVersion],
                createdAt: now,
                updatedAt: now
            };
            newStories.push(newStory);
        }
        return newStories;
    }, []);

    // Unified Global Save Logic (Story + Relations)
    const saveGlobalStoryState = useCallback((
        targetId: string,
        targetContent: string,
        saveType: 'manual' | 'generate_pre' | 'generate_post',
        activeMommies: string[],
        activeNerds: string[],
        activeLores: string[]
    ) => {
        const now = Date.now();
        // Always fetch latest to avoid stale closures, especially during async generate actions
        const currentStories = JSON.parse(localStorage.getItem('womb_stories') || '[]') as Story[];
        const currentRelations = JSON.parse(localStorage.getItem('womb_story_relations') || '[]') as StoryLoreRelation[];

        // 1. Save Story Data
        const newStories = saveStoryData(targetId, targetContent, saveType, currentStories, now);
        saveToLocalStorage(newStories);

        // Update Ref to track changes
        lastSavedContentRef.current = targetContent;

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

        return { newStories, updatedGlobalRelations };
    }, [saveStoryData, saveToLocalStorage]);


    // Helper: Build WOMB Context (Entities & Content)
    const buildWombContext = useCallback(async () => {
        const { parseStoryContent } = await import('../../utils/bison');
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
        let entityContext = "";

        if (matchedLoreItems.length > 0) {
            entityContext = matchedLoreItems.map(item => {
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
                    entityContext += `\n\n=== PAST EVENTS IN THIS STORY ===${historyStr}`;
                }
            }
            // Append the entity and history info to the Womb-specific system instruction
            systemInstruction += `\n\n--- Lorebook Context ---\n${entityContext}`;
        }

        const derivedTitle = content.split('\n')[0]?.trim() || "Untitled Story";

        return { systemInstruction, entityContext, scanTargetContent, matchedLoreItems, allActiveLoreItems, allLoreItems, cleanedContent, storyTitle: derivedTitle };
    }, [content, keywordScanRange, mommyList, activeMommyIds, nerdList, activeNerdIds, loreList, activeLoreIds, historyLogs, currentStoryId]);


    // Action: Save System (Generate Story)
    const handleSave = useCallback(async () => {
        if (!content.trim()) return;

        setIsGenerating(true);

        try {
            const { callGemini } = await import('../../utils/gemini');

            // Call the shared context builder
            const { systemInstruction, cleanedContent, matchedLoreItems } = await buildWombContext();

            // Set debug info
            if (showWombDebugInfo) {
                setDebugSystemPrompt(systemInstruction);
                setDebugInputText(cleanedContent);
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

            // Call the Gemeni API
            const generatedText = await callGemini(apiKey, cleanedContent, aiModel, systemInstruction);

            // Append generated text
            const newContent = content + '\n' + generatedText;
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
        apiKey, aiModel, content, currentStoryId, savedStories, globalRelations,
        activeMommyIds, activeNerdIds, activeLoreIds, saveGlobalStoryState, lang,
        keywordScanRange, mommyList, nerdList, loreList // Added to dependencies
    ]);

    // Action: Manual Save (No Generation)
    const handleManualSave = useCallback(() => {
        if (!content.trim()) return;

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

        // Optional: Could add a small non-blocking toast here later if needed
    }, [content, currentStoryId, savedStories, globalRelations, activeMommyIds, activeNerdIds, activeLoreIds, saveGlobalStoryState]);

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

    // --- Version Control Handlers ---

    // --- Version Control Handlers ---

    // Helper to extract a minimal diff snippet for the Branch Selector
    const computeDiffPreview = useCallback((oldContent: string, newContent: string): string => {
        // Very basic diff: find first differing character
        let diffIndex = 0;
        const minLen = Math.min(oldContent.length, newContent.length);
        while (diffIndex < minLen && oldContent[diffIndex] === newContent[diffIndex]) {
            diffIndex++;
        }

        if (diffIndex === minLen && oldContent.length === newContent.length) {
            return newContent.substring(0, 50) + "..."; // Identical?? Should rarely happen
        }

        // We want to show a bit of context BEFORE the change
        const contextBefore = 10;
        const contextAfter = 60; // How much of the NEW text to show

        const startIndex = Math.max(0, diffIndex - contextBefore);
        let preview = "...";

        // Add tiny bit of prefix context
        if (startIndex > 0) {
            preview += newContent.substring(startIndex, diffIndex);
        } else {
            preview = newContent.substring(0, diffIndex);
        }

        // Add the changed snippet
        preview += " {" + newContent.substring(diffIndex, diffIndex + contextAfter) + "} ...";

        return preview;
    }, []);

    const handleUndo = useCallback(() => {
        if (!currentStoryId) return;
        const currentStory = savedStories.find(s => s.id === currentStoryId);
        if (!currentStory || !currentStory.currentVersionId) return;

        const currentVersion = currentStory.versions.find(v => v.id === currentStory.currentVersionId);
        if (!currentVersion || !currentVersion.parentId) return;

        const parentVersion = currentStory.versions.find(v => v.id === currentVersion.parentId);
        if (!parentVersion) return;

        const newStories = savedStories.map(s => {
            if (s.id === currentStoryId) {
                return { ...s, currentVersionId: parentVersion.id };
            }
            return s;
        });

        saveToLocalStorage(newStories);
        setContent(parentVersion.content);
        lastSavedContentRef.current = parentVersion.content;

        // Clear redo candidates if pending
        setRedoCandidates([]);
    }, [currentStoryId, savedStories, saveToLocalStorage]);

    const performRedoToVersion = useCallback((storyId: string, targetVersionId: string, targetContent: string) => {
        const newStories = savedStories.map(s => {
            if (s.id === storyId) {
                return { ...s, currentVersionId: targetVersionId };
            }
            return s;
        });

        saveToLocalStorage(newStories);
        setContent(targetContent);
        lastSavedContentRef.current = targetContent;
        setRedoCandidates([]); // Clear popup
    }, [savedStories, saveToLocalStorage]);


    const handleRedo = useCallback(() => {
        if (!currentStoryId) return;
        const currentStory = savedStories.find(s => s.id === currentStoryId);
        if (!currentStory || !currentStory.currentVersionId) return;

        const childVersions = currentStory.versions.filter(v => v.parentId === currentStory.currentVersionId);
        if (childVersions.length === 0) return;

        if (childVersions.length === 1) {
            // Only one future, proceed immediately
            const childVersion = childVersions[0];
            performRedoToVersion(currentStoryId, childVersion.id, childVersion.content);
        } else {
            // Multiple futures exist! Branching scenario.
            // Compute visual diffs for each candidate against the current content
            const currentContent = currentStory.versions.find(v => v.id === currentStory.currentVersionId)?.content || "";

            const candidates = childVersions.map(cv => ({
                id: currentStoryId,
                versionId: cv.id,
                previewText: computeDiffPreview(currentContent, cv.content)
            }));

            setRedoCandidates(candidates);
        }
    }, [currentStoryId, savedStories, performRedoToVersion, computeDiffPreview]);

    const handleSelectRedoBranch = useCallback((versionId: string) => {
        const currentStory = savedStories.find(s => s.id === currentStoryId);
        if (!currentStory) return;

        const targetVersion = currentStory.versions.find(v => v.id === versionId);
        if (!targetVersion) return;

        performRedoToVersion(currentStory.id, versionId, targetVersion.content);
    }, [currentStoryId, savedStories, performRedoToVersion]);

    // --- History Handlers ---

    const handleAddHistory = useCallback((entityId: string) => {
        return baseHandleAddHistory(entityId, currentStoryId);
    }, [currentStoryId, baseHandleAddHistory]);

    const handleSaveHistory = useCallback(() => {
        try {
            let targetStoryId = currentStoryId;

            // 1. Lazy Story Creation (If saving a draft)
            if (!targetStoryId) {
                targetStoryId = Date.now().toString();
                setCurrentStoryId(targetStoryId); // Switch from Draft to Real Mode
            }

            // 2. Perform Full Save (Story + Relations)
            // Now using the EXACT same logic
            saveGlobalStoryState(
                targetStoryId,
                content,
                'manual',
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
                'manual',
                activeMommyIds,
                activeNerdIds,
                activeLoreIds
            );
            console.log("[useWombSystem] handleAddFullHistory COMPLETED SUCCESS");
        } catch (error) {
            console.error("[useWombSystem] Failed to add and save history:", error);
        }
    }, [currentStoryId, historyLogs, content, savedStories, globalRelations, activeMommyIds, activeNerdIds, activeLoreIds, saveGlobalStoryState]);




    const handleSelectStory = useCallback((story: Story, relations: StoryLoreRelation[]) => {
        // Clear any abandoned "draft" history logs (storyId === "") before switching
        const cleanLogs = historyLogs.filter(log => log.storyId !== "");
        if (cleanLogs.length !== historyLogs.length) {
            setHistoryLogs(cleanLogs);
        }

        const activeVersion = story.versions.find(v => v.id === story.currentVersionId);
        setContent(activeVersion ? activeVersion.content : "");
        setCurrentStoryId(story.id);
        // Load Active Lore from Relations
        setActiveMommyIds(relations.filter(r => r.entityType === 'mommy').map(r => r.entityId));
        setActiveNerdIds(relations.filter(r => r.entityType === 'nerd').map(r => r.entityId));
        setActiveLoreIds(relations.filter(r => r.entityType === 'lore').map(r => r.entityId));
        setShowFileList(false);
    }, [historyLogs]);

    // Derived states for Undo/Redo UI
    let canUndo = false;
    let canRedo = false;
    let redoBranchCount = 0;
    const currentActiveStory = savedStories.find(s => s.id === currentStoryId);
    if (currentActiveStory && currentActiveStory.currentVersionId) {
        const currentVersion = currentActiveStory.versions.find(v => v.id === currentActiveStory.currentVersionId);
        if (currentVersion && currentVersion.parentId) {
            canUndo = true;
        }

        const childVersions = currentActiveStory.versions.filter(v => v.parentId === currentActiveStory.currentVersionId);
        redoBranchCount = childVersions.length;
        canRedo = redoBranchCount > 0;
    }

    return {
        // Composed Actions
        ...settings,
        ...lore,
        ...history,
        isGenerating,
        currentStoryId, setCurrentStoryId,
        content, setContent,
        savedStories,
        showFileList, setShowFileList,
        showLorebook, setShowLorebook,

        // Debug State
        debugSystemPrompt,
        debugInputText,
        debugMatchedEntities,

        // Actions
        handleSave,
        handleManualSave,
        handleDelete,
        handleAddHistory,
        handleUpdateHistory,
        handleSaveHistory,
        handleAddFullHistory,
        handleDeleteHistory,
        handleNewStory,
        handleSelectStory,
        handleUndo,
        handleRedo,
        canUndo,
        canRedo,
        redoBranchCount,
        buildWombContext,
        displayTitle: content.split('\n')[0]?.trim(),
        redoCandidates,
        setRedoCandidates,
        handleSelectRedoBranch,
        currentStoryVersions: currentActiveStory?.versions || []
    };
};
