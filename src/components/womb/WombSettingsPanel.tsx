import React from 'react';

interface WombSettingsPanelProps {
    showSettings: boolean;
    lang: 'ja' | 'en';
    wombOutputLength: number;
    setWombOutputLength: (length: number) => void;
    cordOutputLength: number;
    setCordOutputLength: (length: number) => void;
    showDebugInfo: boolean;
    setShowDebugInfo: (show: boolean) => void;
    apiKey: string;
    setApiKey: (key: string) => void;
    tmdbAccessToken: string;
    setTmdbAccessToken: (token: string) => void;
    aiModel: 'gemini-2.5-flash' | 'gemini-3.1-pro-preview';
    setAiModel: (model: 'gemini-2.5-flash' | 'gemini-3.1-pro-preview') => void;
}

export const WombSettingsPanel: React.FC<WombSettingsPanelProps> = ({
    showSettings,
    lang,
    wombOutputLength,
    setWombOutputLength,
    cordOutputLength,
    setCordOutputLength,
    showDebugInfo,
    setShowDebugInfo,
    apiKey,
    setApiKey,
    tmdbAccessToken,
    setTmdbAccessToken,
    aiModel,
    setAiModel
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
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '90vh', // Prevent overflow off screen
            overflowY: 'auto' // Allow scrolling if content is too tall
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

            {/* 2. AI Model Display */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                    {lang === 'ja' ? '現在のAIモデル' : 'Current AI Model'}
                </label>
                <div style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.05)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: '4px',
                    color: '#38bdf8',
                    padding: '0.4rem',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    position: 'relative'
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <select
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value as 'gemini-2.5-flash' | 'gemini-3.1-pro-preview')}
                        style={{
                            appearance: 'none',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#38bdf8',
                            fontSize: '0.85rem',
                            fontFamily: 'monospace',
                            width: '100%',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="gemini-2.5-flash" style={{ backgroundColor: '#1A1A20', color: '#e2e8f0' }}>gemini-2.5-flash</option>
                        <option value="gemini-3.1-pro-preview" style={{ backgroundColor: '#1A1A20', color: '#e2e8f0' }}>gemini-3.1-pro-preview</option>
                    </select>
                    {/* Custom Dropdown Arrow */}
                    <div style={{ pointerEvents: 'none', position: 'absolute', right: '0.5rem', color: '#38bdf8' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
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

            {/* 3. API Key (Gemini) */}
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
                    {/* Lock Icon */}
                    <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                </div>
                {/* Test Connection Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                    <button
                        onClick={async () => {
                            if (!apiKey) return;
                            const btn = document.getElementById('test-conn-btn');
                            if (btn) btn.innerText = 'Testing...';

                            const { testGeminiConnection } = await import('../../utils/gemini');
                            const result = await testGeminiConnection(apiKey);

                            if (btn) {
                                if (result.success) {
                                    btn.innerText = 'Connection OK';
                                    btn.style.color = '#4ade80';
                                } else {
                                    btn.innerText = 'Connection Failed';
                                    btn.style.color = '#f87171';
                                    alert(`Connection Failed:\n${result.message}`);
                                }

                                setTimeout(() => {
                                    if (btn) {
                                        btn.innerText = 'Test Connection';
                                        btn.style.color = '#38bdf8';
                                    }
                                }, 3000);
                            }
                        }}
                        id="test-conn-btn"
                        disabled={!apiKey}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#38bdf8',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            textDecoration: 'underline',
                            opacity: apiKey ? 1 : 0.5,
                            transition: 'color 0.3s'
                        }}
                    >
                        Test Connection
                    </button>
                </div>
            </div>

            {/* 4. TMDB Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                    TMDB Read Access Token (v4)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                        type="password"
                        value={tmdbAccessToken}
                        onChange={(e) => setTmdbAccessToken(e.target.value)}
                        placeholder="Enter TMDB Token..."
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
                    {/* Movie Icon */}
                    <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                            <line x1="7" y1="2" x2="7" y2="22"></line>
                            <line x1="17" y1="2" x2="17" y2="22"></line>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <line x1="2" y1="7" x2="7" y2="7"></line>
                            <line x1="2" y1="17" x2="7" y2="17"></line>
                            <line x1="17" y1="17" x2="22" y2="17"></line>
                            <line x1="17" y1="7" x2="22" y2="7"></line>
                        </svg>
                    </div>
                </div>
                {/* Test Connection Button (TMDB) */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                    <button
                        onClick={async () => {
                            if (!tmdbAccessToken) return;
                            const btn = document.getElementById('test-tmdb-btn');
                            if (btn) btn.innerText = 'Testing...';

                            const { testTmdbConnection } = await import('../../utils/tmdb');
                            const result = await testTmdbConnection(tmdbAccessToken);

                            if (btn) {
                                if (result.success) {
                                    btn.innerText = 'Connection OK';
                                    btn.style.color = '#4ade80';
                                } else {
                                    btn.innerText = 'Connection Failed';
                                    btn.style.color = '#f87171';
                                    alert(`Connection Failed:\n${result.message}`);
                                }

                                setTimeout(() => {
                                    if (btn) {
                                        btn.innerText = 'Test TMDB';
                                        btn.style.color = '#38bdf8';
                                    }
                                }, 3000);
                            }
                        }}
                        id="test-tmdb-btn"
                        disabled={!tmdbAccessToken}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#38bdf8',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            textDecoration: 'underline',
                            opacity: tmdbAccessToken ? 1 : 0.5,
                            transition: 'color 0.3s'
                        }}
                    >
                        Test TMDB
                    </button>
                </div>
            </div>

        </div >
    );
};
