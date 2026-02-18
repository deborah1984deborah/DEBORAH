import React from 'react';

interface WombSettingsPanelProps {
    showSettings: boolean;
    lang: 'ja' | 'en';
    wombOutputLength: number;
    setWombOutputLength: (length: number) => void;
    showDebugInfo: boolean;
    setShowDebugInfo: (show: boolean) => void;
}

export const WombSettingsPanel: React.FC<WombSettingsPanelProps> = ({
    showSettings,
    lang,
    wombOutputLength,
    setWombOutputLength,
    showDebugInfo,
    setShowDebugInfo
}) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: '100%',
            marginLeft: '0.5rem',
            width: '280px',
            backgroundColor: 'rgba(26, 26, 32, 0.95)', // #1A1A20 equivalent
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            zIndex: 100,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            // Animation Styles
            opacity: showSettings ? 1 : 0,
            transform: showSettings ? 'translateX(0)' : 'translateX(-10px)',
            pointerEvents: showSettings ? 'auto' : 'none',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            <div style={{
                borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                paddingBottom: '0.5rem',
                marginBottom: '0.5rem',
                color: '#38bdf8',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                letterSpacing: '0.05em'
            }}>
                AI CONFIGURATION
            </div>
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


            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={showDebugInfo}
                        onChange={(e) => setShowDebugInfo(e.target.checked)}
                        style={{
                            accentColor: '#38bdf8',
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer'
                        }}
                    />
                    <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                        {lang === 'ja' ? 'CORDデバッグ情報を表示' : 'Show CORD Debug Info'}
                    </span>
                </label>
            </div>
        </div >
    );
};
