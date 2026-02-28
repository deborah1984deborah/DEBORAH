import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Story, StoryLoreRelation, StoryEntityHistory } from '../../types';

interface UseWombStoryProps {
    lang: 'ja' | 'en';
    globalRelations: StoryLoreRelation[];
    setGlobalRelations: (relations: StoryLoreRelation[]) => void;
    activeMommyIds: string[];
    setActiveMommyIds: (ids: string[]) => void;
    activeNerdIds: string[];
    setActiveNerdIds: (ids: string[]) => void;
    activeLoreIds: string[];
    setActiveLoreIds: (ids: string[]) => void;
    historyLogs: StoryEntityHistory[];
    setHistoryLogs: (logs: StoryEntityHistory[]) => void;
    getActiveLineage: (currentVersionId: string | null, versions: any[]) => Set<string>;
    onStorySaved?: (storyId: string, content: string, saveType: 'manual' | 'generate_pre' | 'generate_post') => void;
}

export const useWombStory = ({
    lang,
    globalRelations, setGlobalRelations,
    activeMommyIds, setActiveMommyIds,
    activeNerdIds, setActiveNerdIds,
    activeLoreIds, setActiveLoreIds,
    historyLogs, setHistoryLogs,
    getActiveLineage, onStorySaved
}: UseWombStoryProps) => {

    // Story Management State
    const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
    const [content, setContent] = useState<string>("");
    const lastSavedContentRef = useRef<string>("");

    const [savedStories, setSavedStories] = useState<Story[]>([]);
    const [showFileList, setShowFileList] = useState<boolean>(false);

    // Branch Selector State
    const [redoCandidates, setRedoCandidates] = useState<{ id: string, versionId: string, previewText: string }[]>([]);

    // Actually using useEffect instead of useCallback for mount
    useEffect(() => {
        const storedStories = localStorage.getItem('womb_stories');
        if (storedStories) {
            try { setSavedStories(JSON.parse(storedStories)); } catch (e) { console.error(e); }
        }
    }, []);

    // Derived Lineage and Active History State
    const currentStory = useMemo(() => savedStories.find(s => s.id === currentStoryId), [savedStories, currentStoryId]);
    const activeLineage = useMemo(() => {
        return getActiveLineage(currentStory?.currentVersionId || null, currentStory?.versions || []);
    }, [getActiveLineage, currentStory]);

    const activeHistoryLogs = useMemo(() => {
        return historyLogs.filter(log => {
            // Include if it belongs to a different story entirely, 
            // OR if it's a draft history, 
            // OR if it belongs to this story AND exists in the active lineage tree.
            if (log.storyId !== currentStoryId) return true;
            if (log.versionId === 'draft') return true;
            return activeLineage.has(log.versionId);
        });
    }, [historyLogs, currentStoryId, activeLineage]);


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

            // Check if content actually changed from the currently active version
            const activeVersion = existingStory.versions.find(v => v.id === existingStory.currentVersionId);
            const contentHasChanged = !activeVersion || activeVersion.content !== currentContent;

            if (contentHasChanged) {
                // Spawn a new version
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
                // Content is identical. Do NOT spawn a new child version.
                // Just update the updatedAt timestamp and title if needed.
                newStories[existingStoryIndex] = {
                    ...existingStory,
                    title: derivedTitle,
                    updatedAt: now
                };
            }
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
        _activeMommies: string[],
        _activeNerds: string[],
        _activeLores: string[]
    ) => {
        // [Refactor Notice] activeMommies etc are passed to avoid closure staleness
        const now = Date.now();
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
            ..._activeMommies.map(id => ({ id: crypto.randomUUID(), storyId: targetId, entityId: id, entityType: 'mommy' as const })),
            ..._activeNerds.map(id => ({ id: crypto.randomUUID(), storyId: targetId, entityId: id, entityType: 'nerd' as const })),
            ..._activeLores.map(id => ({ id: crypto.randomUUID(), storyId: targetId, entityId: id, entityType: 'lore' as const }))
        ];
        const updatedGlobalRelations = [...otherRelations, ...newRelations];
        setGlobalRelations(updatedGlobalRelations);
        localStorage.setItem('womb_story_relations', JSON.stringify(updatedGlobalRelations));

        if (onStorySaved) {
            onStorySaved(targetId, targetContent, saveType);
        }

        return { newStories, updatedGlobalRelations };
    }, [saveStoryData, saveToLocalStorage, setGlobalRelations, onStorySaved]);

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

        return targetStoryId;
    }, [content, currentStoryId, activeMommyIds, activeNerdIds, activeLoreIds, saveGlobalStoryState]);

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
    }, [historyLogs, setActiveMommyIds, setActiveNerdIds, setActiveLoreIds, setHistoryLogs]);

    const handleNewStory = useCallback(() => {
        transitionToNewStory();
    }, [transitionToNewStory]);

    // Handle Delete
    const handleDeleteStory = useCallback((e: React.MouseEvent, storyId: string) => {
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
    }, [savedStories, lang, globalRelations, currentStoryId, saveToLocalStorage, setGlobalRelations, transitionToNewStory]);


    // Helper to extract a minimal diff snippet for the Branch Selector
    const computeDiffPreview = useCallback((oldContent: string, newContent: string): string => {
        let diffIndex = 0;
        const minLen = Math.min(oldContent.length, newContent.length);
        while (diffIndex < minLen && oldContent[diffIndex] === newContent[diffIndex]) {
            diffIndex++;
        }

        if (diffIndex === minLen && oldContent.length === newContent.length) {
            return newContent.substring(0, 50) + "...";
        }

        const contextBefore = 10;
        const contextAfter = 60;

        const startIndex = Math.max(0, diffIndex - contextBefore);
        let preview = "...";

        if (startIndex > 0) {
            preview += newContent.substring(startIndex, diffIndex);
        } else {
            preview = newContent.substring(0, diffIndex);
        }

        preview += " {" + newContent.substring(diffIndex, diffIndex + contextAfter) + "} ...";

        return preview;
    }, []);

    const handleUndo = useCallback(() => {
        if (!currentStoryId) return;
        const _currentStory = savedStories.find(s => s.id === currentStoryId);
        if (!_currentStory || !_currentStory.currentVersionId) return;

        const currentVersion = _currentStory.versions.find(v => v.id === _currentStory.currentVersionId);
        if (!currentVersion || !currentVersion.parentId) return;

        const parentVersion = _currentStory.versions.find(v => v.id === currentVersion.parentId);
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
        setRedoCandidates([]);
    }, [savedStories, saveToLocalStorage]);


    const handleRedo = useCallback(() => {
        if (!currentStoryId) return;
        const _currentStory = savedStories.find(s => s.id === currentStoryId);
        if (!_currentStory || !_currentStory.currentVersionId) return;

        const childVersions = _currentStory.versions.filter(v => v.parentId === _currentStory.currentVersionId);
        if (childVersions.length === 0) return;

        if (childVersions.length === 1) {
            const childVersion = childVersions[0];
            performRedoToVersion(currentStoryId, childVersion.id, childVersion.content);
        } else {
            const currentContent = _currentStory.versions.find(v => v.id === _currentStory.currentVersionId)?.content || "";

            const candidates = childVersions.map(cv => ({
                id: currentStoryId,
                versionId: cv.id,
                previewText: computeDiffPreview(currentContent, cv.content)
            }));

            setRedoCandidates(candidates);
        }
    }, [currentStoryId, savedStories, performRedoToVersion, computeDiffPreview]);

    const handleSelectRedoBranch = useCallback((versionId: string) => {
        const _currentStory = savedStories.find(s => s.id === currentStoryId);
        if (!_currentStory) return;

        const targetVersion = _currentStory.versions.find(v => v.id === versionId);
        if (!targetVersion) return;

        performRedoToVersion(_currentStory.id, versionId, targetVersion.content);
    }, [currentStoryId, savedStories, performRedoToVersion]);


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
    }, [historyLogs, setActiveMommyIds, setActiveNerdIds, setActiveLoreIds, setHistoryLogs]);

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
        currentStoryId, setCurrentStoryId,
        content, setContent,
        savedStories,
        showFileList, setShowFileList,
        activeHistoryLogs,
        lastSavedContentRef,

        saveGlobalStoryState,
        handleManualSave,
        handleNewStory,
        handleDeleteStory,
        handleSelectStory,

        // Version Control UI state
        handleUndo,
        handleRedo,
        canUndo,
        canRedo,
        redoBranchCount,
        redoCandidates,
        setRedoCandidates,
        handleSelectRedoBranch,
        currentStoryVersions: currentActiveStory?.versions || [],
        currentVersionId: currentActiveStory?.currentVersionId || null,

        displayTitle: content.split('\n')[0]?.trim() || "Untitled Story"
    };

};
