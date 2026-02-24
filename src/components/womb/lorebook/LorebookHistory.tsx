import React from 'react';
import { StoryEntityHistory } from '../../../types';

interface LorebookHistoryProps {
    lang: 'ja' | 'en';
    // History Props
    historyLogs: StoryEntityHistory[];
    invalidations: import('../../../types').StoryEntityHistoryInvalidation[];
    getActiveLineage: (currentVersionId: string | null, versions: any[]) => Set<string>;
    storyVersions: any[];
    selectedItemId: string;
    currentStoryId: string | null;
    currentVersionId: string | null;
    onAddHistory: (entityId: string, initialContent?: string) => string;
    onAddFullHistory: (entityId: string, historyContent: string) => void;
    onUpdateHistory: (id: string, content: string) => void;
    onSaveHistory: () => void;
    onDeleteHistory: (id: string) => void;
    onToggleInvalidateHistory: (historyId: string, currentVersionId: string | null, isInvalidated: boolean) => void;
    showHistory: boolean;
}

export const LorebookHistory: React.FC<LorebookHistoryProps> = ({
    lang,
    historyLogs,
    invalidations,
    getActiveLineage,
    storyVersions,
    selectedItemId,
    currentStoryId,
    currentVersionId,
    onAddHistory: _onAddHistory,
    onAddFullHistory,
    onUpdateHistory,
    onSaveHistory,
    onDeleteHistory,
    onToggleInvalidateHistory,
    showHistory
}) => {
    const [editingHistoryId, setEditingHistoryId] = React.useState<string | null>(null);
    const [isAddingNew, setIsAddingNew] = React.useState<boolean>(false);
    const [newEntryContent, setNewEntryContent] = React.useState<string>('');

    // Calculate Active Lineage
    // Parent passes currentVersionId directly now.
    const activeLineage = getActiveLineage(currentVersionId, storyVersions);

    return (
        <div style={{
            height: showHistory ? 'auto' : '0px',
            backgroundColor: '#1E1E24', // Match Right Pane
            borderTop: showHistory ? '1px solid rgba(148, 163, 184, 0.1)' : 'none', // Subtle separator
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            opacity: showHistory ? 1 : 0,
            flexShrink: 0
        }}>
            <div style={{ flex: 1, padding: '0', overflowY: 'auto' }}>
                <div style={{ padding: '0.2rem 1rem', display: 'flex', justifyContent: 'flex-end', height: '40px', alignItems: 'center', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                    <button style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '2.2rem',
                        cursor: 'pointer',
                        lineHeight: '0.8',
                        padding: '0',
                        transition: 'transform 0.2s',
                        opacity: 0.8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%'
                    }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsAddingNew(true);
                            setNewEntryContent('');
                            setEditingHistoryId(null);
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)'; e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '0.8'; }}
                    >
                        +
                    </button>
                </div>

                {/* Local "Add New" Item */}
                {isAddingNew && (
                    <div style={{
                        padding: '0.8rem',
                        marginBottom: '0.8rem',
                        backgroundColor: 'rgba(0,0,0,0.2)', // Matched original
                        borderRadius: '8px',
                        border: '1px solid rgba(148, 163, 184, 0.1)', // Matched original
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        opacity: 1,
                        transition: 'opacity 0.2s'
                    }}>
                        <textarea
                            autoFocus
                            value={newEntryContent}
                            onChange={(e) => setNewEntryContent(e.target.value)}
                            placeholder="Write history entry..."
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid #38bdf8',
                                borderRadius: '4px',
                                color: '#e2e8f0',
                                padding: '0.5rem',
                                fontSize: '0.9rem',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                maxWidth: '100%',
                                boxSizing: 'border-box'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                            <span>New Entry...</span>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsAddingNew(false);
                                        setNewEntryContent('');
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        padding: '0.3rem 0.6rem',
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (newEntryContent.trim() !== '') {
                                            onAddFullHistory(selectedItemId, newEntryContent);
                                        }
                                        setIsAddingNew(false);
                                        setNewEntryContent('');
                                    }}
                                    style={{
                                        background: 'rgba(56, 189, 248, 0.1)',
                                        border: '1px solid #38bdf8',
                                        color: '#38bdf8',
                                        cursor: 'pointer',
                                        padding: '0.3rem 0.6rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.3rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
                                    }}
                                    title="Save History"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                    SAVE
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {historyLogs.filter(log => {
                    // 1. Entity Match
                    if (log.entityId !== selectedItemId) return false;
                    // 2. Story Scope Match (Global or Specific Story)
                    if (log.storyId !== "" && log.storyId !== currentStoryId) return false;

                    // 3. Lineage Filtering (Only show histories generated in the past of the current version)
                    // If no currentVersionId (e.g. initial draft), only show draft/global histories
                    if (!currentVersionId) return log.versionId === "draft" || !log.versionId;

                    return activeLineage.has(log.versionId) || log.versionId === "draft" || !log.versionId;
                }).map(log => {
                    // Check if this specific log has been invalidated anywhere within the current active lineage
                    // AND determine WHERE it was invalidated.
                    const invalidatingVersionNode = invalidations.find(inv =>
                        inv.historyId === log.id &&
                        (activeLineage.has(inv.versionId) || inv.versionId === "draft")
                    );

                    const isInvalidatedInLineage = !!invalidatingVersionNode;

                    // NEW HIDING LOGIC (Option B):
                    // If it was invalidated in the lineage, check IF the current looking version is EXACTLY the version where it was invalidated.
                    // If it is NOT the exact same version (meaning we are looking at a child version), then HIDE it completely.
                    if (isInvalidatedInLineage) {
                        const lookTargetVersion = currentVersionId || "draft";
                        if (invalidatingVersionNode.versionId !== lookTargetVersion) {
                            return null; // Hide in children completely
                        }
                    }

                    return (
                        <div key={log.id} style={{
                            padding: '0.8rem',
                            marginBottom: '0.8rem',
                            backgroundColor: isInvalidatedInLineage ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)',
                            borderRadius: '8px',
                            border: '1px solid rgba(148, 163, 184, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            opacity: isInvalidatedInLineage ? 0.4 : 1,
                            transition: 'opacity 0.2s'
                        }}>
                            {editingHistoryId === log.id ? (
                                <textarea
                                    autoFocus
                                    value={log.content}
                                    onChange={(e) => onUpdateHistory(log.id, e.target.value)}
                                    // onBlur removed to keep edit mode active
                                    placeholder="Write history entry..."
                                    style={{
                                        width: '100%',
                                        minHeight: '80px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                        border: '1px solid #38bdf8',
                                        borderRadius: '4px',
                                        color: '#e2e8f0',
                                        padding: '0.5rem',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        maxWidth: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <div
                                    onClick={() => !isInvalidatedInLineage && setEditingHistoryId(log.id)}
                                    style={{
                                        fontSize: '0.9rem',
                                        color: log.content ? '#e2e8f0' : '#64748b',
                                        whiteSpace: 'pre-wrap',
                                        cursor: isInvalidatedInLineage ? 'default' : 'pointer',
                                        fontStyle: log.content ? 'normal' : 'italic',
                                        lineHeight: '1.5',
                                        textDecoration: isInvalidatedInLineage ? 'line-through' : 'none'
                                    }}
                                >
                                    {log.content || '(Empty - Click to edit)'}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                                <span>{new Date(log.createdAt).toLocaleString()}</span>
                                {editingHistoryId === log.id && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onSaveHistory) {
                                                onSaveHistory();
                                            }
                                            setEditingHistoryId(null);
                                        }}
                                        style={{
                                            background: 'rgba(56, 189, 248, 0.1)',
                                            border: '1px solid #38bdf8',
                                            color: '#38bdf8',
                                            cursor: 'pointer',
                                            padding: '0.3rem 0.6rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.3rem',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
                                        }}
                                        title="Save History"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                            <polyline points="7 3 7 8 15 8"></polyline>
                                        </svg>
                                        SAVE
                                    </button>
                                )}
                            </div>

                            {/* Action Buttons (Right Aligned Bottom Corner) */}
                            {editingHistoryId !== log.id && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.3rem', marginTop: '-0.2rem' }}>
                                    {/* Toggle Invalidate / Restore Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleInvalidateHistory(log.id, currentVersionId, isInvalidatedInLineage);
                                        }}
                                        style={{
                                            background: 'transparent', border: 'none',
                                            color: isInvalidatedInLineage ? '#10b981' : '#f59e0b', // Emerald = Restore, Amber = Invalidate
                                            cursor: 'pointer', padding: '0.2rem 0.5rem',
                                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                                            fontSize: '0.75rem', fontWeight: 'bold',
                                            opacity: 0.9,
                                            transition: 'opacity 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '0.9'}
                                        title={isInvalidatedInLineage ? (lang === 'ja' ? '復元' : 'Restore') : (lang === 'ja' ? '無効化 (このVer以降で非表示)' : 'Invalidate (Hide from this Ver onward)')}
                                    >
                                        {isInvalidatedInLineage ? (
                                            <>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="9 14 4 9 9 4"></polyline>
                                                    <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                                                </svg>
                                                RESTORE
                                            </>
                                        ) : (
                                            <>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                                                </svg>
                                                INVALIDATE
                                            </>
                                        )}
                                    </button>

                                    {/* Physical Delete Button (Original) */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteHistory(log.id);
                                        }}
                                        style={{
                                            background: 'transparent', border: 'none', color: '#f87171',
                                            cursor: 'pointer', padding: '0.2rem 0.5rem',
                                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                                            fontSize: '0.75rem', fontWeight: 'bold',
                                            opacity: 0.8,
                                            transition: 'opacity 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
                                        title={lang === 'ja' ? '完全削除 (全バージョンから恒久的に消去)' : 'Permanent Delete (from all versions)'}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                        DELETE
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
