import React, { useState } from 'react';
import '../../styles/womb.css';
import { CordChat } from './cord/CordChat';

interface WombSystemProps {
    lang: 'ja' | 'en';
}

import { LorebookModal } from './lorebook';
import { StoryListModal } from './StoryListModal';
import { WombSettingsPanel } from './settings/WombSettingsPanel';
import { WombHeader } from './WombHeader';
import { WombEditor } from './editor/WombEditor';
import { WombDebugPanel } from './WombDebugPanel';
import { CordDebugPanel } from './CordDebugPanel';
import { BranchSelectorModal } from './BranchSelectorModal';
import { WombChatModal } from './WombChatModal';

import { useWombSystem } from '../../hooks/womb/useWombSystem';
import { exportStoryData } from '../../utils/exportUtils';
import { readImportedStoryData } from '../../utils/importUtils';
import { exportAllEntitiesAsZip } from '../../utils/entityExportUtils';
import { readImportedEntitiesZip } from '../../utils/entityImportUtils';




export const WombSystem: React.FC<WombSystemProps> = ({ lang }) => {
    // Use Custom Hook for all Logic & State
    const {
        // State
        wombOutputLength, setWombOutputLength,
        cordOutputLength, setCordOutputLength,
        wombContextLength, setWombContextLength,
        wombChunkLimit, setWombChunkLimit,
        keywordScanRange, setKeywordScanRange,
        activeCordHistoryInterval, setActiveCordHistoryInterval,
        isCordActiveModeEnabled, setIsCordActiveModeEnabled,
        showSettings, setShowSettings,
        showDebugInfo, setShowDebugInfo,
        showWombDebugInfo, setShowWombDebugInfo,
        apiKey, setApiKey,
        tmdbAccessToken, setTmdbAccessToken,
        novelAIApiKey, setNovelAIApiKey,
        aiModel, setAiModel,
        aiThinkingLevel, setAiThinkingLevel,
        isPseudoThinkingModeEnabled, setIsPseudoThinkingModeEnabled,
        isGenerating,
        currentStoryId,
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
        isStorageReady, // <--- Async Storage Loading State

        debugSystemPrompt,
        debugInputText,
        debugMatchedEntities,

        // Actions
        invalidations,
        getActiveLineage,
        handleSave,
        handleCutContext,
        handleManualSave,
        handleDelete,
        handleAddHistory,
        handleUpdateHistory,
        handleSaveHistory,
        handleAddFullHistory,
        handleDeleteHistory,
        handleToggleInvalidateHistory,
        handleNewStory,
        handleSelectStory,
        handleUndo,
        handleRedo,
        canUndo,
        canRedo,
        redoBranchCount,
        buildWombContext,
        displayTitle,
        redoCandidates,
        setRedoCandidates,
        handleSelectRedoBranch,
        currentStoryVersions,
        currentVersionId,

        // Background History
        isBackgroundProcessing,
        processingTargetName,
        triggerAutoHistory,
        triggerWombGeneration
    } = useWombSystem({ lang });

    // Local UI State for Modals
    const [isWombChatModalOpen, setIsWombChatModalOpen] = useState(false);

    // Listen to CORD's command to add history
    React.useEffect(() => {
        console.log("[WombSystem] useEffect for womb:add-history mounted");
        const handleAddWombHistoryEvent = (e: Event) => {
            const customEvent = e as CustomEvent<{ entityId: string, historyText: string }>;
            const { entityId, historyText } = customEvent.detail;

            console.log(`[WombSystem] Event received! womb:add-history`, { entityId, historyText });

            if (!entityId || !historyText) {
                console.error("[WombSystem] Missing data in event!", { entityId, historyText });
                alert(`[System Error] CORDからの指示に不足があります。\nEntityID: ${entityId}\nText: ${historyText ? "あり" : "なし"}`);
                return;
            }

            // Strict Validation: Ensure the entityId exists in the full Lorebook database
            const allLoreIds = [...mommyList, ...nerdList, ...loreList].map(item => item.id);
            if (!allLoreIds.includes(entityId)) {
                console.error(`[WombSystem] Entity ID "${entityId}" could not be found in the Lorebook.`);
                alert(`[System Error] 指定されたキャラクターが見つかりません。CORDが架空のキャラクター名を作り出したか、データベースに存在しない可能性があります。`);
                return; // Stop the save process
            }

            // Auto add history and save using the safe atomic draft-save flow
            console.log("[WombSystem] Calling handleAddFullHistory...");
            handleAddFullHistory(entityId, historyText);
        };

        window.addEventListener('womb:add-history', handleAddWombHistoryEvent);
        return () => {
            console.log("[WombSystem] useEffect for womb:add-history unmounted");
            window.removeEventListener('womb:add-history', handleAddWombHistoryEvent);
        }
    }, [handleAddFullHistory, mommyList, nerdList, loreList]);

    const handleDownloadStory = React.useCallback(() => {
        if (!currentStoryId) {
            alert("ダウンロードするストーリーがありません。");
            return;
        }
        const success = exportStoryData(
            currentStoryId,
            savedStories,
            globalRelations,
            historyLogs,
            activeMommyIds,
            activeNerdIds,
            activeLoreIds
        );
        if (!success) {
            alert("ストーリーデータのダウンロードに失敗しました。");
        }
    }, [currentStoryId, savedStories, globalRelations, historyLogs, activeMommyIds, activeNerdIds, activeLoreIds]);

    const handleImportStory = React.useCallback(async (file: File) => {
        try {
            const importedData = await readImportedStoryData(file);

            // 1. Generate new Story ID to prevent overwriting
            const newStoryId = Date.now().toString();

            // 2. Clone the imported story and remap its ID
            const newStory = { ...importedData.story, id: newStoryId };

            // 3. Save new Story to localStorage and System state
            // In WombSystem we don't have direct access to setSavedStories, so we read, append, write.
            const currentStoriesStr = localStorage.getItem('womb_stories');
            const currentStories = currentStoriesStr ? JSON.parse(currentStoriesStr) : [];
            const updatedStories = [...currentStories, newStory];
            localStorage.setItem('womb_stories', JSON.stringify(updatedStories));

            // 4. Handle Lore Relations for the new Story
            const currentRelationsStr = localStorage.getItem('womb_story_relations');
            const currentRelations: any[] = currentRelationsStr ? JSON.parse(currentRelationsStr) : [];
            const newRelations = importedData.activeLores.map(lore => ({
                id: crypto.randomUUID(),
                storyId: newStoryId,
                entityId: lore.entityId,
                entityType: lore.entityType
            }));
            const updatedRelations = [...currentRelations, ...newRelations];
            localStorage.setItem('womb_story_relations', JSON.stringify(updatedRelations));
            // Trigger a re-render of useWombSystem's internal state by calling a dummy save or forced refresh if possible
            // ... Actually, handleSelectStory directly modifies activeIds based on globalRelations!

            // 5. Handle Lore History Logs
            // The history setter is available in useWombSystem, but it's not exported. 
            // We'll write directly to localStorage for initialization, then rely on handleSelectStory to pick it up.
            const currentLogsStr = localStorage.getItem('deborah_history_logs_v1');
            const currentLogs: any[] = currentLogsStr ? JSON.parse(currentLogsStr) : [];
            const remappedHistories = importedData.loreHistory.map(log => ({
                ...log,
                id: crypto.randomUUID(), // New history ID to avoid collision
                storyId: newStoryId // Re-attach to new story
            }));
            const updatedLogs = [...currentLogs, ...remappedHistories];
            localStorage.setItem('deborah_history_logs_v1', JSON.stringify(updatedLogs));

            // 6. Reload the application or state to reflect these local storage changes
            // Since we bypassed the hook state (setSavedStories, setGlobalRelations, setHistoryLogs) which are not all exported,
            // the safest and cleanest way to ensure consistency after a bulk import is to trigger a minimal reload or let 
            // the user select it from the file list. However, user wanted it to load immediately.
            // Let's force a reload for now, or we can just window.location.reload() for total safety.
            // For a smoother experience, we will alert success and ask to reload.
            if (window.confirm("インポートが完了しました。データを反映させるため、ページをリロードしますか？")) {
                window.location.reload();
            }

        } catch (error) {
            console.error("Failed to import story:", error);
            alert("インポートに失敗しました。ファイルの形式が正しくない可能性があります。");
        }
    }, []);

    // State to track which debug panel is functionally in front
    const [activeDebugPanel, setActiveDebugPanel] = useState<'womb' | 'cord'>('womb');
    const [isCordProcessing, setIsCordProcessing] = useState(false);
    const [cordDebugData, setCordDebugData] = useState<{ systemPrompt: string, inputText: string, matchedEntities: any[] }>({ systemPrompt: '', inputText: '', matchedEntities: [] });

    // Ref for SETTINGS button to align the portal
    const settingsBtnRef = React.useRef<HTMLButtonElement>(null);

    // Load settings from localStorage on mount (handled partially here, but mostly inside hooks now)
    React.useEffect(() => {
        const savedApiKey = localStorage.getItem('womb_api_key');
        if (savedApiKey) {
            setApiKey(savedApiKey);
        }
        const savedTmdbToken = localStorage.getItem('womb_tmdb_token');
        if (savedTmdbToken) {
            setTmdbAccessToken(savedTmdbToken);
        }
        const savedAiModel = localStorage.getItem('womb_ai_model');
        if (savedAiModel) {
            setAiModel(savedAiModel as 'gemini-2.5-flash' | 'gemini-3.1-pro-preview');
        }
        const savedWombOutputLength = localStorage.getItem('womb_output_length');
        if (savedWombOutputLength) {
            setWombOutputLength(parseInt(savedWombOutputLength));
        }
        const savedCordOutputLength = localStorage.getItem('cord_output_length');
        if (savedCordOutputLength) {
            setCordOutputLength(parseInt(savedCordOutputLength));
        }
        const savedKeywordScanRange = localStorage.getItem('keyword_scan_range');
        if (savedKeywordScanRange) {
            setKeywordScanRange(parseInt(savedKeywordScanRange));
        }
    }, [setApiKey, setTmdbAccessToken, setAiModel, setWombOutputLength, setCordOutputLength, setKeywordScanRange]);


    const handleDownloadAllEntities = async () => {
        if (!mommyList.length && !nerdList.length && !loreList.length) {
            alert(lang === 'ja' ? 'ダウンロードするデータがありません。' : 'No data to download.');
            return;
        }

        const success = await exportAllEntitiesAsZip(mommyList, nerdList, loreList);
        if (!success) {
            alert(lang === 'ja' ? 'ダウンロードに失敗しました。' : 'Failed to download entities.');
        }
    };

    const handleImportAllEntities = async (file: File) => {
        try {
            const imported = await readImportedEntitiesZip(file);

            // Read current records
            const getLocal = (key: string) => {
                const str = localStorage.getItem(key);
                return str ? JSON.parse(str) : [];
            };

            const currentMommy = getLocal('deborah_fuckmeat_v1');
            const currentNerd = getLocal('deborah_penis_v1');
            const currentLore = getLocal('deborah_lore_v1');

            // Merge logic: Overwrite if ID exists, append if new.
            const mergeLists = (currentList: any[], importedList: any[]) => {
                const merged = [...currentList];
                importedList.forEach(importedItem => {
                    const index = merged.findIndex(i => i.id === importedItem.id);
                    if (index !== -1) {
                        merged[index] = importedItem; // Overwrite
                    } else {
                        merged.push(importedItem); // Append
                    }
                });
                return merged;
            };

            const mergedMommy = mergeLists(currentMommy, imported.mommyList);
            const mergedNerd = mergeLists(currentNerd, imported.nerdList);
            const mergedLore = mergeLists(currentLore, imported.loreList);

            // Save to localStorage
            localStorage.setItem('deborah_fuckmeat_v1', JSON.stringify(mergedMommy));
            localStorage.setItem('deborah_penis_v1', JSON.stringify(mergedNerd));
            localStorage.setItem('deborah_lore_v1', JSON.stringify(mergedLore));

            if (window.confirm(lang === 'ja' ? "エンティティのインポートが完了しました。データを反映させるため、ページをリロードしますか？" : "Import complete. Reload the page to apply changes?")) {
                window.location.reload();
            }

        } catch (error) {
            console.error('[WombSystem] Failed to import entities:', error);
            alert(lang === 'ja' ? 'インポートに失敗しました。ファイルの形式が正しくない可能性があります。' : 'Failed to import entities. The file may be invalid.');
        }
    };

    if (!isStorageReady) {
        return (
            <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                height: '100vh', width: '100vw', backgroundColor: '#0f172a', color: '#38bdf8',
                flexDirection: 'column', gap: '1rem', fontFamily: 'monospace'
            }}>
                <div className="womb-loading-spinner" style={{
                    width: '40px', height: '40px', border: '3px solid rgba(56, 189, 248, 0.2)',
                    borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite'
                }} />
                <div>INITIALIZING STORAGE DB...</div>
            </div>
        );
    }

    return (
        <div className="womb-system-container" style={{
            backgroundColor: 'rgba(26, 26, 32, 0.92)', // #1A1A20 equivalent
            borderRadius: '16px',
            // Border removed
            padding: '2rem',
            height: 'calc(100vh - 140px)', // Fixed height relative to viewport
            minHeight: '500px',
            color: '#e2e8f0', // Slate-200 text
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            backdropFilter: 'blur(12px)',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            <WombHeader onOpenLorebook={() => setShowLorebook(true)} />

            {/* Split View Container */}

            {/* Split View Container */}
            <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                minHeight: 0, // Crucial for nested scrolling
                // overflow: 'hidden' // Removed to allow settings panel popup
            }}>
                {/* WOMB: Text Editor (Left) */}
                <WombEditor
                    lang={lang}
                    content={content}
                    setContent={setContent}
                    displayTitle={displayTitle}
                    isGenerating={isGenerating}
                    onSave={handleSave}
                    onManualSave={handleManualSave}
                    onOpenFileList={() => setShowFileList(true)}
                    onNewStory={handleNewStory}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    redoBranchCount={redoBranchCount}
                    showWombDebugInfo={showWombDebugInfo}
                    isCordProcessing={isCordProcessing || isBackgroundProcessing}
                    onOpenChatModal={() => setIsWombChatModalOpen(true)}
                    onDownloadStory={handleDownloadStory}
                    onImportStory={handleImportStory}
                />

                {/* CORD: Chat Interface (Right) */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    height: '100%',
                    // overflow: 'hidden' // Removed to allow settings panel popup
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexShrink: 0
                    }}>
                        <div style={{
                            color: 'white',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            letterSpacing: '0.1em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span>CORD :: ADVISOR</span>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }}></div>
                        </div>

                        {/* SETTINGS BUTTON & PANEL */}
                        <div style={{ position: 'relative' }}>
                            <button
                                ref={settingsBtnRef}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(148, 163, 184, 0.3)',
                                    borderRadius: '4px',
                                    color: showSettings ? '#e2e8f0' : '#94a3b8', // Highlight when active
                                    fontSize: '0.75rem',
                                    padding: '0.2rem 0.6rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    letterSpacing: '0.05em',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                }}
                                onClick={() => setShowSettings(!showSettings)}
                                onMouseEnter={(e) => {
                                    if (!showSettings) e.currentTarget.style.color = '#e2e8f0';
                                }}
                                onMouseLeave={(e) => {
                                    if (!showSettings) e.currentTarget.style.color = '#94a3b8';
                                }}
                            >
                                SETTING <span style={{ fontSize: '0.6rem', transform: showSettings ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▶</span>
                            </button>

                            {/* HOVER PANEL (Click Toggle with Animation) */}
                            <WombSettingsPanel
                                showSettings={showSettings}
                                lang={lang}
                                wombOutputLength={wombOutputLength}
                                setWombOutputLength={setWombOutputLength}
                                cordOutputLength={cordOutputLength}
                                setCordOutputLength={setCordOutputLength}
                                wombContextLength={wombContextLength}
                                setWombContextLength={setWombContextLength}
                                keywordScanRange={keywordScanRange}
                                setKeywordScanRange={setKeywordScanRange}
                                activeCordHistoryInterval={activeCordHistoryInterval}
                                setActiveCordHistoryInterval={setActiveCordHistoryInterval}
                                isCordActiveModeEnabled={isCordActiveModeEnabled}
                                setIsCordActiveModeEnabled={setIsCordActiveModeEnabled}
                                showDebugInfo={showDebugInfo}
                                setShowDebugInfo={setShowDebugInfo}
                                showWombDebugInfo={showWombDebugInfo}
                                setShowWombDebugInfo={setShowWombDebugInfo}
                                apiKey={apiKey}
                                setApiKey={setApiKey}
                                tmdbAccessToken={tmdbAccessToken}
                                setTmdbAccessToken={setTmdbAccessToken}
                                novelAIApiKey={novelAIApiKey}
                                setNovelAIApiKey={setNovelAIApiKey}
                                aiModel={aiModel}
                                setAiModel={setAiModel}
                                aiThinkingLevel={aiThinkingLevel}
                                setAiThinkingLevel={setAiThinkingLevel}
                                isPseudoThinkingModeEnabled={isPseudoThinkingModeEnabled}
                                setIsPseudoThinkingModeEnabled={setIsPseudoThinkingModeEnabled}
                                anchorRef={settingsBtnRef}
                            />
                        </div>
                    </div>
                    <div style={{
                        flex: 1,
                        border: '1px solid rgba(56, 189, 248, 0.2)', // Subtle Cyan border for CORD
                        borderRadius: '8px',
                        overflow: 'hidden', // WombChat handles internal scrolling
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <CordChat
                            lang={lang}
                            currentStoryId={currentStoryId || undefined}
                            content={content}
                            triggerSave={handleManualSave}
                            showDebugInfo={showDebugInfo}
                            apiKey={apiKey}
                            novelAIApiKey={novelAIApiKey}
                            aiModel={aiModel as any}
                            isWombGenerating={isGenerating}
                            getWombContext={buildWombContext}
                            onProcessingChange={setIsCordProcessing}
                            onDebugDataChange={setCordDebugData}

                            // Background auto-history integration
                            isBackgroundProcessing={isBackgroundProcessing}
                            processingTargetName={processingTargetName}
                            triggerAutoHistory={triggerAutoHistory}
                            triggerWombGeneration={triggerWombGeneration}
                            cordOutputLength={cordOutputLength}
                            isPseudoThinkingModeEnabled={isPseudoThinkingModeEnabled}
                        />
                    </div>
                </div>
            </div>

            {/* FILE LIST MODAL */}
            {showFileList && (
                <StoryListModal
                    savedStories={savedStories}
                    globalRelations={globalRelations}
                    onClose={() => setShowFileList(false)}
                    onSelectStory={handleSelectStory}
                    onDeleteStory={handleDelete}
                />
            )}
            {/* LOREBOOK MODAL */}
            {showLorebook && (
                <LorebookModal
                    lang={lang}
                    onClose={() => setShowLorebook(false)}
                    mommyList={mommyList}
                    nerdList={nerdList}
                    loreList={loreList}
                    activeMommyIds={activeMommyIds}
                    setActiveMommyIds={setActiveMommyIds}
                    activeNerdIds={activeNerdIds}
                    setActiveNerdIds={setActiveNerdIds}
                    activeLoreIds={activeLoreIds}
                    setActiveLoreIds={setActiveLoreIds}
                    // History Props
                    historyLogs={historyLogs}
                    invalidations={invalidations}
                    getActiveLineage={getActiveLineage}
                    storyVersions={currentStoryVersions}
                    currentStoryId={currentStoryId}
                    currentVersionId={currentVersionId}
                    onAddHistory={handleAddHistory} // Pass the handler
                    onAddFullHistory={handleAddFullHistory} // Use the robust creation handler
                    onUpdateHistory={handleUpdateHistory}
                    onSaveHistory={handleSaveHistory}
                    onDeleteHistory={handleDeleteHistory}
                    onToggleInvalidateHistory={handleToggleInvalidateHistory}
                    onDownloadAllEntities={handleDownloadAllEntities}
                    onImportAllEntities={handleImportAllEntities}
                />
            )}

            {/* CORD DEBUG PANEL */}
            <CordDebugPanel
                lang={lang}
                showCordDebugInfo={showDebugInfo}
                debugSystemPrompt={cordDebugData.systemPrompt}
                debugInputText={cordDebugData.inputText}
                debugMatchedEntities={cordDebugData.matchedEntities}
                isActive={activeDebugPanel === 'cord'}
                onClick={() => setActiveDebugPanel('cord')}
            />

            {/* WOMB DEBUG PANEL */}
            <WombDebugPanel
                lang={lang}
                showWombDebugInfo={showWombDebugInfo}
                debugSystemPrompt={debugSystemPrompt}
                debugInputText={debugInputText}
                debugMatchedEntities={debugMatchedEntities}
                isActive={activeDebugPanel === 'womb'}
                onClick={() => setActiveDebugPanel('womb')}
            />

            {/* REDO BRANCH SELECTOR MODAL */}
            {redoCandidates && redoCandidates.length > 0 && (
                <BranchSelectorModal
                    lang={lang}
                    candidates={redoCandidates}
                    versions={currentStoryVersions}
                    onSelect={handleSelectRedoBranch}
                    onClose={() => setRedoCandidates([])}
                />
            )}

            {/* WOMB CHAT MODAL */}
            <WombChatModal
                isOpen={isWombChatModalOpen}
                onClose={() => setIsWombChatModalOpen(false)}
                storyId={currentStoryId}
                lang={lang}
                showWombDebugInfo={showWombDebugInfo}
                onCutContext={handleCutContext}
                wombChunkLimit={wombChunkLimit}
                setWombChunkLimit={setWombChunkLimit}
            />
        </div>
    );
};


