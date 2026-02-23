import React from 'react';
import { createPortal } from 'react-dom';

interface ActiveCordSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    lang: 'ja' | 'en';
    activeCordHistoryInterval: number;
    setActiveCordHistoryInterval: (interval: number) => void;
}

export const ActiveCordSettingsModal: React.FC<ActiveCordSettingsModalProps> = ({
    isOpen,
    onClose,
    lang,
    activeCordHistoryInterval,
    setActiveCordHistoryInterval,
}) => {
    if (!isOpen) return null;
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001 // above settings panel
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#1E1E24',
                padding: '24px',
                borderRadius: '8px',
                width: '400px',
                maxWidth: '90vw',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)'
            }} onClick={e => e.stopPropagation()}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        {lang === 'ja' ? '能動的CORD 設定' : 'Active CORD Settings'}
                    </h3>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', outline: 'none', padding: '4px'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Interval Setting */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                            {lang === 'ja' ? 'ヒストリーの自動更新間隔' : 'History Auto-Update Interval'}
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="number"
                                value={activeCordHistoryInterval}
                                onChange={(e) => setActiveCordHistoryInterval(Number(e.target.value))}
                                style={{
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(148,163,184,0.3)',
                                    borderRadius: '4px',
                                    padding: '8px',
                                    color: '#e2e8f0',
                                    width: '100%',
                                    outline: 'none',
                                    fontSize: '1rem'
                                }}
                            />
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                {lang === 'ja' ? '文字 (chars)' : 'chars'}
                            </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {lang === 'ja'
                                ? 'エディタの文字数がこの設定値分増減するたびに、CORDが自動的にヒストリーを更新します。'
                                : 'CORD will automatically update history every time the editor content changes by this many characters.'}
                        </span>
                    </div>

                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{
                        padding: '8px 16px',
                        backgroundColor: '#38bdf8',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}>
                        OK
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
};
