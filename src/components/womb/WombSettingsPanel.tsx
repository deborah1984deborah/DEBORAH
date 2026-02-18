import React from 'react';

interface WombSettingsPanelProps {
    showSettings: boolean;
    lang: 'ja' | 'en';
    wombOutputLength: number;
    setWombOutputLength: (length: number) => void;
    showDebugInfo: boolean;
    setShowDebugInfo: (show: boolean) => void;
    apiKey: string;
    setApiKey: (key: string) => void;
}

export const WombSettingsPanel: React.FC<WombSettingsPanelProps> = ({
    showSettings,
    lang,
    wombOutputLength,
    setWombOutputLength,
    showDebugInfo,
    setShowDebugInfo,
    apiKey,
    setApiKey
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

            {/* 2. Debug Info Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', width: '100%' }}>
                    <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                        {lang === 'ja' ? 'CORDデバッグ情報を表示' : 'Show CORD Debug Info'}
                    </span>

                    <div style={{ position: 'relative', width: '40px', height: '22px' }}>
                        <input
                            type="checkbox"
                            checked={showDebugInfo}
                            onChange={(e) => setShowDebugInfo(e.target.checked)}
                            style={{
                                opacity: 0,
                                width: 0,
                                height: 0
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: '22px',
                            backgroundColor: showDebugInfo ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                            border: showDebugInfo ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.3)',
                            transition: 'all 0.3s ease',
                            boxShadow: showDebugInfo ? '0 0 8px rgba(56, 189, 248, 0.3)' : 'none'
                        }}></div>
                        <div style={{
                            position: 'absolute',
                            top: '3px',
                            left: '3px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: '#fff',
                            transform: showDebugInfo ? 'translateX(18px)' : 'translateX(0)',
                            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                        }}></div>
                    </div>
                </label>
            </div>

            {/* Separator */}
            <div style={{
                height: '1px',
                backgroundColor: 'rgba(148, 163, 184, 0.2)',
                margin: '0.5rem 0'
            }}></div>

            {/* 3. API Key */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                    Gemini API Key
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter API Key..."
                        style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            borderRadius: '4px',
                            color: '#e2e8f0',
                            padding: '0.4rem',
                            fontSize: '0.9rem',
                            width: '100%',
                            outline: 'none',
                            fontFamily: 'monospace'
                        }}
                    />
                    {/* Lock Icon matching 'chars' width roughly */}
                    <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div >
    );
};
