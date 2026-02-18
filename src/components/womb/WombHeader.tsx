import React from 'react';

interface WombHeaderProps {
    onOpenLorebook: () => void;
}

export const WombHeader: React.FC<WombHeaderProps> = ({ onOpenLorebook }) => {
    return (
        <header style={{
            backgroundColor: 'transparent', // Ensure it is transparent
            borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
            paddingBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0 // Prevent header from shrinking
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#38bdf8' }}></div>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '0.05em', color: 'white' }}>WOMB CONNECT</span>
                </div>

                {/* LOREBOOK BUTTON */}
                <button
                    onClick={onOpenLorebook}
                    style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid #38bdf8',
                        borderRadius: '20px',
                        color: '#38bdf8',
                        padding: '0.3rem 1rem',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 0 10px rgba(56, 189, 248, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(56, 189, 248, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.1)';
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    Lorebook
                </button>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                STATUS: ONLINE
            </div>
        </header>
    );
};
