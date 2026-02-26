import React from 'react';

interface SettingsAdvancedTogglesProps {
    lang: 'ja' | 'en';
    isCordActiveModeEnabled: boolean;
    setIsCordActiveModeEnabled: (enabled: boolean) => void;
    showWombDebugInfo: boolean;
    setShowWombDebugInfo: (show: boolean) => void;
    showDebugInfo: boolean;
    setShowDebugInfo: (show: boolean) => void;
    onEditSafety: (e: React.MouseEvent) => void;
    onEditActiveCordSettings: (e: React.MouseEvent) => void;
}

export const SettingsAdvancedToggles: React.FC<SettingsAdvancedTogglesProps> = ({
    lang,
    isCordActiveModeEnabled,
    setIsCordActiveModeEnabled,
    showWombDebugInfo,
    setShowWombDebugInfo,
    showDebugInfo,
    setShowDebugInfo,
    onEditSafety,
    onEditActiveCordSettings
}) => {
    return (
        <>
            {/* 2.6. Safety Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{lang === 'ja' ? 'Safety Setting' : 'Safety Setting'}</span>
                    <button
                        onClick={onEditSafety}
                        style={{
                            backgroundColor: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            borderRadius: '4px',
                            color: '#38bdf8',
                            padding: '0.2rem 0.6rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                        }}
                    >
                        Edit
                    </button>
                </label>
            </div>

            {/* 2.7. CORD Active System Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', width: '100%' }}>
                    <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 'bold' }}>
                        {lang === 'ja' ? '能動的CORDシステムを有効化' : 'Enable Active CORD System'}
                    </span>

                    <div style={{ position: 'relative', width: '40px', height: '22px' }}>
                        <input
                            type="checkbox"
                            checked={isCordActiveModeEnabled}
                            onChange={(e) => setIsCordActiveModeEnabled(e.target.checked)}
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
                            backgroundColor: isCordActiveModeEnabled ? 'rgba(251, 191, 36, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                            border: isCordActiveModeEnabled ? '1px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.3)',
                            transition: 'all 0.3s ease',
                            boxShadow: isCordActiveModeEnabled ? '0 0 8px rgba(251, 191, 36, 0.3)' : 'none'
                        }}></div>
                        <div style={{
                            position: 'absolute',
                            top: '3px',
                            left: '3px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: '#fff',
                            transform: isCordActiveModeEnabled ? 'translateX(18px)' : 'translateX(0)',
                            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                        }}></div>
                    </div>
                </label>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                    <button
                        onClick={onEditActiveCordSettings}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#fbbf24', // Amber-400
                            padding: '0.2rem 0',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            marginRight: '10px' // Added to shift slightly left
                        }}
                    >
                        Edit
                    </button>
                </div>
            </div>

            {/* 3. Womb Debug Info Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', width: '100%' }}>
                    <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                        {lang === 'ja' ? 'WOMBデバッグ情報を表示' : 'Show WOMB Debug Info'}
                    </span>

                    <div style={{ position: 'relative', width: '40px', height: '22px' }}>
                        <input
                            type="checkbox"
                            checked={showWombDebugInfo}
                            onChange={(e) => setShowWombDebugInfo(e.target.checked)}
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
                            backgroundColor: showWombDebugInfo ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                            border: showWombDebugInfo ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.3)',
                            transition: 'all 0.3s ease',
                            boxShadow: showWombDebugInfo ? '0 0 8px rgba(56, 189, 248, 0.3)' : 'none'
                        }}></div>
                        <div style={{
                            position: 'absolute',
                            top: '3px',
                            left: '3px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: '#fff',
                            transform: showWombDebugInfo ? 'translateX(18px)' : 'translateX(0)',
                            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                        }}></div>
                    </div>
                </label>
            </div>

            {/* 4. CORD Debug Toggle */}
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
        </>
    );
};
