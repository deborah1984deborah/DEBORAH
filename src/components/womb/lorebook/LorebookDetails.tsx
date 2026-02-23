import React from 'react';
import { LoreItem, StoryEntityHistory } from '../../../types';
import { LorebookHistory } from './LorebookHistory';

interface LorebookDetailsProps {
    lang: 'ja' | 'en';
    onClose: () => void;
    selectedItem: LoreItem | null;
    showHistory: boolean;
    setShowHistory: (show: boolean) => void;

    // History Props
    historyLogs: StoryEntityHistory[];
    invalidations: import('../../../types').StoryEntityHistoryInvalidation[];
    getActiveLineage: (currentVersionId: string | null, versions: any[]) => Set<string>;
    storyVersions: any[];
    currentStoryId: string | null;
    onAddHistory: (entityId: string) => string;
    onUpdateHistory: (id: string, content: string) => void;
    onSaveHistory: () => void;
    onDeleteHistory: (id: string) => void;
}

export const LorebookDetails: React.FC<LorebookDetailsProps> = ({
    lang, onClose, selectedItem,
    showHistory, setShowHistory,
    historyLogs, invalidations, getActiveLineage, storyVersions, currentStoryId, onAddHistory, onUpdateHistory, onSaveHistory, onDeleteHistory
}) => {
    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#1E1E24',
            position: 'relative'
        }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                {selectedItem ? (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        {/* HEADER: Name & Type */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(56, 189, 248, 0.3)', paddingBottom: '1rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: 'white' }}>{selectedItem.name}</h2>
                            <span style={{
                                color: '#38bdf8',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                border: '1px solid #38bdf8',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '4px',
                                textTransform: 'uppercase'
                            }}>
                                {selectedItem.type.toUpperCase()}
                            </span>
                        </div>

                        {/* DETAILS: Mommy / Nerd / Lore */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            {/* MOMMY STATS */}
                            {selectedItem.type === 'fuckmeat' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {/* Row 1: Age */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                        <div style={{
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(148, 163, 184, 0.1)'
                                        }}>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>
                                                {lang === 'ja' ? '年齢' : 'AGE'}
                                            </div>
                                            <div style={{ fontSize: '1.1rem', color: '#e2e8f0' }}>{selectedItem.age || '-'}</div>
                                        </div>
                                    </div>

                                    {/* Row 2: Height */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                        <div style={{
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(148, 163, 184, 0.1)'
                                        }}>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>
                                                {lang === 'ja' ? '身長' : 'HEIGHT'}
                                            </div>
                                            <div style={{ fontSize: '1.1rem', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                <span>{selectedItem.height || '-'}</span>
                                                {selectedItem.height && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>cm</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 3: Body (B/W/H) */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                        {[
                                            { label: lang === 'ja' ? 'バスト' : 'BUST', value: selectedItem.bust },
                                            { label: lang === 'ja' ? 'ウエスト' : 'WAIST', value: selectedItem.waist },
                                            { label: lang === 'ja' ? 'ヒップ' : 'HIP', value: selectedItem.hip }
                                        ].map((stat, i) => (
                                            <div key={i} style={{
                                                backgroundColor: 'rgba(0,0,0,0.2)',
                                                padding: '1rem',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(148, 163, 184, 0.1)'
                                            }}>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>{stat.label}</div>
                                                <div style={{ fontSize: '1.1rem', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                    <span>{stat.value || '-'}</span>
                                                    {stat.value && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>cm</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Row 4: Face */}
                                    <div style={{
                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(148, 163, 184, 0.1)'
                                    }}>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>
                                            {lang === 'ja' ? '顔 (有名人)' : 'FACE (CELEBRITY)'}
                                        </div>
                                        <div style={{ fontSize: '1.1rem', color: '#e2e8f0' }}>{selectedItem.face || '-'}</div>
                                    </div>
                                </div>
                            )}

                            {/* NERD STATS */}
                            {selectedItem.type === 'penis' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                    {[
                                        { label: lang === 'ja' ? '年齢' : 'AGE', value: selectedItem.age }
                                    ].map((stat, i) => (
                                        <div key={i} style={{
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(148, 163, 184, 0.1)'
                                        }}>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>{stat.label}</div>
                                            <div style={{ fontSize: '1.1rem', color: '#e2e8f0' }}>{stat.value || '-'}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* HISTORY / SUMMARY */}
                            <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                    {selectedItem.type === 'lore'
                                        ? (lang === 'ja' ? '概要' : 'SUMMARY')
                                        : (lang === 'ja' ? '経歴 / プロフィール' : 'HISTORY / BIO')}
                                </div>
                                <div style={{ lineHeight: '1.8', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                                    {(selectedItem.type === 'lore' ? selectedItem.summary : (selectedItem as any).history) || "No description available."}
                                </div>
                            </div>

                            {/* KEYWORDS */}
                            {selectedItem.keywords && selectedItem.keywords.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.8rem', fontWeight: 'bold' }}>
                                        {lang === 'ja' ? 'キーワード' : 'KEYWORDS'}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {selectedItem.keywords.map((kw, i) => (
                                            <span key={i} style={{
                                                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                                color: '#38bdf8',
                                                padding: '0.3rem 0.8rem',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem'
                                            }}>
                                                #{kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}


                            {/* History Button & Drawer (In-Flow) */}
                            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column' }}>
                                <button style={{
                                    alignSelf: 'flex-end',
                                    background: 'transparent',
                                    border: 'none',
                                    color: showHistory ? '#38bdf8' : '#94a3b8',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    marginBottom: '0.5rem',
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1)',
                                    zIndex: 10,
                                    letterSpacing: '0.05em'
                                }}
                                    onClick={() => setShowHistory(!showHistory)}
                                    onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                                    onMouseLeave={e => !showHistory && (e.currentTarget.style.color = '#94a3b8')}
                                >
                                    History <span style={{ fontSize: '0.7rem', transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>▼</span>
                                </button>

                                <LorebookHistory
                                    historyLogs={historyLogs}
                                    invalidations={invalidations}
                                    getActiveLineage={getActiveLineage}
                                    storyVersions={storyVersions}
                                    selectedItemId={selectedItem.id}
                                    currentStoryId={currentStoryId}
                                    onAddHistory={onAddHistory}
                                    onUpdateHistory={onUpdateHistory}
                                    onSaveHistory={onSaveHistory}
                                    onDeleteHistory={onDeleteHistory}
                                    showHistory={showHistory}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    // PLACEHOLDER STATE
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        color: '#64748b',
                        gap: '1rem',
                        opacity: 0.5
                    }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span style={{ fontSize: '1.1rem' }}>
                            {lang === 'ja' ? '左のリストから選択して詳細を表示' : 'Select an entity to view details'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
