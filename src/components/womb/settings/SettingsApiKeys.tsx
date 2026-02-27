import React, { useState } from 'react';

interface SettingsApiKeysProps {
    lang: 'ja' | 'en';
    apiKey: string;
    setApiKey: (key: string) => void;
    tmdbAccessToken: string;
    setTmdbAccessToken: (token: string) => void;
    novelAIApiKey: string;
    setNovelAIApiKey: (key: string) => void;
}

export const SettingsApiKeys: React.FC<SettingsApiKeysProps> = ({
    lang,
    apiKey,
    setApiKey,
    tmdbAccessToken,
    setTmdbAccessToken,
    novelAIApiKey,
    setNovelAIApiKey
}) => {
    const [isApiKeysOpen, setIsApiKeysOpen] = useState(false);

    return (
        <>
            {/* Separator */}
            <div style={{
                height: '1px',
                backgroundColor: 'rgba(148, 163, 184, 0.2)',
                margin: '0.5rem 0'
            }}></div>

            {/* Collapsible API Keys Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div
                    onClick={(e) => { e.stopPropagation(); setIsApiKeysOpen(!isApiKeysOpen); }}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: '0.4rem 0'
                    }}
                >
                    <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 'bold' }}>
                        {lang === 'ja' ? 'API キー設定' : 'API Key Settings'}
                    </span>
                    <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{
                            transform: isApiKeysOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                        }}
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>

                {isApiKeysOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.4rem' }}>
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

                                        const { testGeminiConnection } = await import('../../../utils/gemini');
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

                        {/* 3.1 API Key (NovelAI) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                                NovelAI Access Token
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                    type="password"
                                    value={novelAIApiKey}
                                    onChange={(e) => setNovelAIApiKey(e.target.value)}
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
                                        if (!novelAIApiKey) return;
                                        const btn = document.getElementById('test-novelai-btn');
                                        if (btn) btn.innerText = 'Testing...';

                                        const { testNovelAIConnection } = await import('../../../utils/novelai');
                                        const result = await testNovelAIConnection(novelAIApiKey);

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
                                    id="test-novelai-btn"
                                    disabled={!novelAIApiKey}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#38bdf8',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        textDecoration: 'underline',
                                        opacity: novelAIApiKey ? 1 : 0.5,
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

                                        const { testTmdbConnection } = await import('../../../utils/tmdb');
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
                    </div>
                )}
            </div>
        </>
    );
};
