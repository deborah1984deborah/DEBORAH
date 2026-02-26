import React from 'react';

interface SettingsContextScanProps {
    lang: 'ja' | 'en';
    wombContextLength: number;
    setWombContextLength: (length: number) => void;
    keywordScanRange: number;
    setKeywordScanRange: (length: number) => void;
}

export const SettingsContextScan: React.FC<SettingsContextScanProps> = ({
    lang,
    wombContextLength,
    setWombContextLength,
    keywordScanRange,
    setKeywordScanRange
}) => {
    return (
        <>
            {/* 2.4. WOMB Context Length */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                    {lang === 'ja' ? 'WOMBの送信範囲 (文字数)' : 'WOMB Send Context Length'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                        type="number"
                        value={wombContextLength}
                        onChange={(e) => setWombContextLength(Number(e.target.value))}
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

            {/* 2.5. Keyword Scan Range */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                    {lang === 'ja' ? 'キーワードの走査範囲 (文字数)' : 'Keyword Scan Range (Chars)'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                        type="number"
                        value={keywordScanRange}
                        onChange={(e) => setKeywordScanRange(Number(e.target.value))}
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
