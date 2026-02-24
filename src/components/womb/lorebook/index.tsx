import React from 'react';
import { LoreItem, StoryEntityHistory } from '../../../types';
import { LorebookSidebar } from './LorebookSidebar';
import { LorebookDetails } from './LorebookDetails';

export const LorebookModal: React.FC<{
    lang: 'ja' | 'en';
    onClose: () => void;
    mommyList: LoreItem[];
    nerdList: LoreItem[];
    loreList: LoreItem[];
    activeMommyIds: string[];
    setActiveMommyIds: (ids: string[]) => void;
    activeNerdIds: string[];
    setActiveNerdIds: (ids: string[]) => void;
    activeLoreIds: string[];
    setActiveLoreIds: (ids: string[]) => void;
    // History Props
    historyLogs: StoryEntityHistory[];
    invalidations: import('../../../types').StoryEntityHistoryInvalidation[];
    getActiveLineage: (currentVersionId: string | null, versions: any[]) => Set<string>;
    storyVersions: any[];
    currentStoryId: string | null;
    currentVersionId: string | null;
    onAddHistory: (entityId: string, initialContent?: string) => string;
    onAddFullHistory: (entityId: string, historyContent: string) => void;
    onUpdateHistory: (id: string, content: string) => void;
    onSaveHistory: () => void;
    onDeleteHistory: (id: string) => void;
    onToggleInvalidateHistory: (historyId: string, currentVersionId: string | null, isInvalidated: boolean) => void;
}> = ({
    lang, onClose,
    mommyList, nerdList, loreList,
    activeMommyIds, setActiveMommyIds,
    activeNerdIds, setActiveNerdIds,
    activeLoreIds, setActiveLoreIds,
    historyLogs, invalidations, getActiveLineage, storyVersions, currentStoryId, currentVersionId, onAddHistory, onAddFullHistory, onUpdateHistory,
    onSaveHistory,
    onDeleteHistory,
    onToggleInvalidateHistory
}) => {
        const [activeTab, setActiveTab] = React.useState<'mommy' | 'nerd' | 'lore'>('mommy');
        const [selectedItem, setSelectedItem] = React.useState<LoreItem | null>(null);
        const [showHistory, setShowHistory] = React.useState(false);

        return (
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }} onClick={onClose}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                    <div style={{
                        width: '1100px', // Expanded Width
                        maxWidth: '95vw',
                        height: showHistory ? 'calc(80vh + 40px)' : '80vh',
                        maxHeight: '95vh', // Prevent overflow on small screens
                        backgroundColor: '#1A1A20',
                        border: '1px solid #38bdf8',
                        borderRadius: '12px',
                        boxShadow: '0 0 30px rgba(56, 189, 248, 0.2)',
                        display: 'flex',
                        overflow: 'hidden', // Split view container
                        color: 'white',
                        position: 'relative',
                        zIndex: 20,
                        transition: 'height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1)' // Smoother transition
                    }}>
                        <LorebookSidebar
                            lang={lang}
                            mommyList={mommyList}
                            nerdList={nerdList}
                            loreList={loreList}
                            activeMommyIds={activeMommyIds}
                            setActiveMommyIds={setActiveMommyIds}
                            activeNerdIds={activeNerdIds}
                            setActiveNerdIds={setActiveNerdIds}
                            activeLoreIds={activeLoreIds}
                            setActiveLoreIds={setActiveLoreIds}
                            selectedItem={selectedItem}
                            setSelectedItem={setSelectedItem}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />

                        <LorebookDetails
                            lang={lang}
                            onClose={onClose}
                            selectedItem={selectedItem}
                            showHistory={showHistory}
                            setShowHistory={setShowHistory}
                            historyLogs={historyLogs}
                            invalidations={invalidations}
                            getActiveLineage={getActiveLineage}
                            storyVersions={storyVersions}
                            currentStoryId={currentStoryId}
                            currentVersionId={currentVersionId}
                            onAddHistory={onAddHistory}
                            onAddFullHistory={onAddFullHistory}
                            onUpdateHistory={onUpdateHistory}
                            onSaveHistory={onSaveHistory}
                            onDeleteHistory={onDeleteHistory}
                            onToggleInvalidateHistory={onToggleInvalidateHistory}
                        />
                    </div>
                </div>
            </div>
        );
    };
