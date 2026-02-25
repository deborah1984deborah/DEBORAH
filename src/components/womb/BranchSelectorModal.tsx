import React from 'react';
import { StoryVersion } from '../../types';

export interface BranchCandidate {
    id: string; // storyId
    versionId: string;
    previewText: React.ReactNode;
}

interface BranchSelectorModalProps {
    lang: 'ja' | 'en';
    candidates: BranchCandidate[];
    versions: StoryVersion[]; // Pass all versions to matching details
    onSelect: (versionId: string) => void;
    onClose: () => void;
}

export const BranchSelectorModal: React.FC<BranchSelectorModalProps> = ({
    lang,
    candidates,
    versions,
    onSelect,
    onClose
}) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }} onClick={onClose}>
            <div
                style={{
                    backgroundColor: 'rgba(26, 26, 32, 0.95)',
                    borderRadius: '16px',
                    padding: '2rem',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                    width: '90%',
                    maxWidth: '800px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    maxHeight: '80vh'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{
                        color: 'white',
                        margin: 0,
                        fontSize: '1.2rem',
                        letterSpacing: '0.05em'
                    }}>
                        {lang === 'ja' ? '進むルートを選択' : 'Select Redo Branch'}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: 'none', color: '#94a3b8',
                            cursor: 'pointer', fontSize: '1.5rem', padding: 0, lineHeight: 1
                        }}
                    >×</button>
                </div>

                <div style={{
                    color: '#94a3b8',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem'
                }}>
                    {lang === 'ja'
                        ? 'このポイントから複数の異なる未来（生成結果）が存在します。復元したいルートを選択してください。'
                        : 'Multiple futures exist from this point. Select the timeline you wish to restore.'}
                </div>

                {/* Candidate Cards Grid */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    overflowY: 'auto',
                    padding: '0.5rem'
                }}>
                    {candidates.map((c, index) => {
                        const v = versions.find(ver => ver.id === c.versionId);
                        if (!v) return null;

                        const date = new Date(v.savedAt);
                        const hh = date.getHours().toString().padStart(2, '0');
                        const mm = date.getMinutes().toString().padStart(2, '0');
                        const timeStr = hh + ':' + mm;

                        let typeLabel = '';
                        switch (v.saveType) {
                            case 'manual': typeLabel = lang === 'ja' ? '手動保存' : 'Manual'; break;
                            case 'generate_pre': typeLabel = lang === 'ja' ? '生成前' : 'Pre-Gen'; break;
                            case 'generate_post': typeLabel = lang === 'ja' ? 'AI生成' : 'AI Gen'; break;
                            default: typeLabel = 'Auto';
                        }

                        return (
                            <div
                                key={c.versionId}
                                onClick={() => onSelect(c.versionId)}
                                style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    border: '1px solid rgba(56, 189, 248, 0.2)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {/* Header / Meta */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.75rem',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    paddingBottom: '0.4rem',
                                    color: '#94a3b8'
                                }}>
                                    <span style={{
                                        color: '#38bdf8',
                                        fontWeight: 'bold',
                                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                    }}>
                                        ルート {index + 1}
                                    </span>
                                    <span>{timeStr} | {typeLabel}</span>
                                </div>

                                {/* Diff Preview Text */}
                                <div style={{
                                    flex: 1,
                                    fontSize: '0.85rem',
                                    color: '#e2e8f0',
                                    lineHeight: 1.5,
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 5,
                                    WebkitBoxOrient: 'vertical',
                                    wordBreak: 'break-word',
                                }}>
                                    {c.previewText}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
