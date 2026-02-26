import React from 'react';

interface ThinkingSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    lang: 'ja' | 'en';
    aiThinkingLevel: 'low' | 'medium' | 'high';
    setAiThinkingLevel: (level: 'low' | 'medium' | 'high') => void;
}

export const ThinkingSettingsModal: React.FC<ThinkingSettingsModalProps> = ({
    isOpen,
    onClose,
    lang,
    aiThinkingLevel,
    setAiThinkingLevel
}) => {
    if (!isOpen) return null;

    const options = [
        { value: 'low', label: 'Low (Faster, less reasoning)' },
        { value: 'medium', label: 'Medium (Balanced reasoning)' },
        { value: 'high', label: 'High (Maximum reasoning depth)' }
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10005 // Above Settings Panel
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#1e293b', // slate-800
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '8px',
                padding: '1.5rem',
                width: '350px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                color: '#e2e8f0'
            }} onClick={e => e.stopPropagation()}>

                <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', paddingBottom: '0.5rem' }}>
                    {lang === 'ja' ? 'AI 思考レベル (Thinking Level) 設定' : 'AI Thinking Level Settings'}
                </h3>

                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                    {lang === 'ja'
                        ? 'Gemini 3系モデルを利用する際の「思考力」を調整します。レベルが高いほど深い推論を行いますが、応答にかかる時間や消費トークン数が増加します。'
                        : 'Adjusts the "thinking power" when using Gemini 3 series models. Higher levels provide deeper reasoning but increase response time and token consumption.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
                    {options.map(option => (
                        <label key={option.value} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            backgroundColor: aiThinkingLevel === option.value ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: aiThinkingLevel === option.value ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                            transition: 'all 0.2s'
                        }}>
                            <input
                                type="radio"
                                name="thinkingLevel"
                                value={option.value}
                                checked={aiThinkingLevel === option.value}
                                onChange={() => setAiThinkingLevel(option.value as any)}
                                style={{ marginTop: '0.2rem', accentColor: '#38bdf8' }}
                            />
                            <span style={{ fontSize: '0.9rem', color: aiThinkingLevel === option.value ? '#38bdf8' : '#e2e8f0' }}>
                                {option.label}
                            </span>
                        </label>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: '#38bdf8',
                            color: '#0f172a',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.5rem 1.5rem',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        {lang === 'ja' ? '完了' : 'Done'}
                    </button>
                </div>
            </div>
        </div>
    );
};
