import React from 'react';

interface SettingsOutputLengthProps {
    lang: 'ja' | 'en';
    wombOutputLength: number;
    setWombOutputLength: (length: number) => void;
    cordOutputLength: number;
    setCordOutputLength: (length: number) => void;
}

export const SettingsOutputLength: React.FC<SettingsOutputLengthProps> = ({
    lang,
    wombOutputLength,
    setWombOutputLength,
    cordOutputLength,
    setCordOutputLength
}) => {
    return (
        <>
            {/* 1. Output Length */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                    {lang === 'ja' ? 'WOMB出力文字数' : 'WOMB Output Length'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                        type="number"
                        value={wombOutputLength}
                        onChange={(e) => setWombOutputLength(Number(e.target.value))}
                        style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            borderRadius: '4px',
                            color: '#e2e8f0',
                            padding: '0.4rem',
                            fontSize: '0.9rem',
                            width: '100%',
                            outline: 'none'
                        }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>chars</span>
                </div>
            </div>

            {/* 1.5. CORD Output Length */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                    {lang === 'ja' ? 'CORD出力文字数' : 'CORD Output Length'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                        type="number"
                        value={cordOutputLength}
                        onChange={(e) => setCordOutputLength(Number(e.target.value))}
                        style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            borderRadius: '4px',
                            color: '#e2e8f0',
                            padding: '0.4rem',
                            fontSize: '0.9rem',
                            width: '100%',
                            outline: 'none'
                        }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>chars</span>
                </div>
            </div>
        </>
    );
};
