import React, { useState } from 'react';
import '../../styles/womb.css';
import { CordChat } from './CordChat';

interface WombSystemProps {
    lang: 'ja' | 'en';
}

import { LorebookModal } from './lorebook';
import { StoryListModal } from './StoryListModal';
import { WombSettingsPanel } from './WombSettingsPanel';
import { WombHeader } from './WombHeader';
import { WombEditor } from './WombEditor';
import { WombDebugPanel } from './WombDebugPanel';
import { CordDebugPanel } from './CordDebugPanel';
import { BranchSelectorModal } from './BranchSelectorModal';
import { useWombSystem } from '../../hooks/womb/useWombSystem';




export const WombSystem: React.FC<WombSystemProps> = ({ lang }) => {
    // Use Custom Hook for all Logic & State
    const {
        // State
        wombOutputLength, setWombOutputLength,
        cordOutputLength, setCordOutputLength,
        wombContextLength, setWombContextLength,
        keywordScanRange, setKeywordScanRange,
        activeCordHistoryInterval, setActiveCordHistoryInterval,
        showSettings, setShowSettings,
        showDebugInfo, setShowDebugInfo,
        showWombDebugInfo, setShowWombDebugInfo,
        apiKey, setApiKey,
        tmdbAccessToken, setTmdbAccessToken,
        aiModel, setAiModel,
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
        displayTitle,
        redoCandidates,
        setRedoCandidates,
        handleSelectRedoBranch,
        currentStoryVersions
    } = useWombSystem({ lang });

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

    // State to track which debug panel is functionally in front
    const [activeDebugPanel, setActiveDebugPanel] = useState<'womb' | 'cord'>('womb');
    const [isCordActiveModeEnabled, setIsCordActiveModeEnabled] = useState(false);
    const [isCordProcessing, setIsCordProcessing] = useState(false);
    const [cordDebugData, setCordDebugData] = useState<{ systemPrompt: string, inputText: string, matchedEntities: any[] }>({ systemPrompt: '', inputText: '', matchedEntities: [] });

    // Ref for SETTINGS button to align the portal
    const settingsBtnRef = React.useRef<HTMLButtonElement>(null);

    // Load settings from localStorage on mount
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
        const savedCordActiveMode = localStorage.getItem('womb_cord_active_mode');
        if (savedCordActiveMode !== null) {
            setIsCordActiveModeEnabled(savedCordActiveMode === 'true');
        }
    }, [setApiKey, setTmdbAccessToken, setAiModel, setWombOutputLength, setCordOutputLength, setKeywordScanRange, setIsCordActiveModeEnabled]);

    React.useEffect(() => {
        localStorage.setItem('womb_cord_active_mode', isCordActiveModeEnabled.toString());
    }, [isCordActiveModeEnabled]);


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
                    isCordProcessing={isCordProcessing}
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
                                aiModel={aiModel}
                                setAiModel={setAiModel}
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
                            showDebugInfo={showDebugInfo}
                            apiKey={apiKey}
                            aiModel={aiModel}
                            getWombContext={buildWombContext}
                            onProcessingChange={setIsCordProcessing}
                            onDebugDataChange={setCordDebugData}
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
                    currentStoryId={currentStoryId}
                    onAddHistory={handleAddHistory} // Pass the handler
                    onUpdateHistory={handleUpdateHistory}
                    onSaveHistory={handleSaveHistory}
                    onDeleteHistory={handleDeleteHistory}
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
        </div>
    );
};


