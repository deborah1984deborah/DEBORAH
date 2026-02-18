import React from 'react';
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
import { useWombSystem } from '../../hooks/useWombSystem';




export const WombSystem: React.FC<WombSystemProps> = ({ lang }) => {
    // Use Custom Hook for all Logic & State
    const {
        // State
        wombOutputLength, setWombOutputLength,
        showSettings, setShowSettings,
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

        // Actions
        handleSave,
        handleDelete,
        handleAddHistory,
        handleUpdateHistory,
        handleSaveHistory,
        handleDeleteHistory,
        handleNewStory,
        handleSelectStory,
        displayTitle
    } = useWombSystem({ lang });

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
                    onOpenFileList={() => setShowFileList(true)}
                    onNewStory={handleNewStory}
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
                        <CordChat lang={lang} />
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
        </div>
    );
};


