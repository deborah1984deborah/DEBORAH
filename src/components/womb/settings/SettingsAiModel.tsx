import React from 'react';

interface SettingsAiModelProps {
    lang: 'ja' | 'en';
    aiModel: 'gemini-2.5-flash' | 'gemini-3.1-pro-preview';
    setAiModel: (model: 'gemini-2.5-flash' | 'gemini-3.1-pro-preview') => void;
    aiThinkingLevel: 'low' | 'medium' | 'high';
    onEditThinking: (e: React.MouseEvent) => void;
}

export const SettingsAiModel: React.FC<SettingsAiModelProps> = ({
    lang,
    aiModel,
    setAiModel,
    aiThinkingLevel,
    onEditThinking
}) => {
    return (
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
            {/* Thinking Level Edit Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '4px' }}>
                    Thinking: <span style={{ color: '#fbbf24' }}>{aiThinkingLevel.charAt(0).toUpperCase() + aiThinkingLevel.slice(1)}</span>
                </span>
                <button
                    onClick={onEditThinking}
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
            </div>
        </div>
    );
};
