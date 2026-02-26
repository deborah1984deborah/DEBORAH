import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type SafetyCategory =
    | 'HARM_CATEGORY_HARASSMENT'
    | 'HARM_CATEGORY_HATE_SPEECH'
    | 'HARM_CATEGORY_SEXUALLY_EXPLICIT'
    | 'HARM_CATEGORY_DANGEROUS_CONTENT';

export type SafetyThreshold =
    | 'OFF'
    | 'BLOCK_NONE'
    | 'BLOCK_ONLY_HIGH'
    | 'BLOCK_MEDIUM_AND_ABOVE'
    | 'BLOCK_LOW_AND_ABOVE';

export interface SafetySetting {
    category: SafetyCategory;
    threshold: SafetyThreshold;
}

interface WombSafetyModalProps {
    isOpen: boolean;
    onClose: () => void;
    lang: 'ja' | 'en';
}

const DEFAULT_SETTINGS: SafetySetting[] = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
];

export const WombSafetyModal: React.FC<WombSafetyModalProps> = ({ isOpen, onClose, lang }) => {
    const [settings, setSettings] = useState<SafetySetting[]>(DEFAULT_SETTINGS);

    useEffect(() => {
        if (isOpen) {
            const stored = localStorage.getItem('womb_safety_settings');
            if (stored) {
                try {
                    setSettings(JSON.parse(stored));
                } catch (e) {
                    console.error("Failed to parse safety settings", e);
                }
            } else {
                setSettings(DEFAULT_SETTINGS);
            }
        }
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('womb_safety_settings', JSON.stringify(settings));
        onClose();
    };

    const updateCategory = (category: SafetyCategory, threshold: SafetyThreshold) => {
        setSettings(prev => prev.map(s => s.category === category ? { ...s, threshold } : s));
    };

    if (!isOpen) return null;

    const categories: { key: SafetyCategory; ja: string; en: string }[] = [
        { key: 'HARM_CATEGORY_HARASSMENT', ja: 'ハラスメント', en: 'Harassment' },
        { key: 'HARM_CATEGORY_HATE_SPEECH', ja: 'ヘイトスピーチ', en: 'Hate Speech' },
        { key: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', ja: '性的な表現 (Sexually Explicit)', en: 'Sexually Explicit' },
        { key: 'HARM_CATEGORY_DANGEROUS_CONTENT', ja: '危険なコンテンツ', en: 'Dangerous Content' }
    ];

    const thresholds: { value: SafetyThreshold; label: string }[] = [
        { value: 'OFF', label: 'Off' },
        { value: 'BLOCK_NONE', label: 'Block none' },
        { value: 'BLOCK_ONLY_HIGH', label: 'Block few' },
        { value: 'BLOCK_MEDIUM_AND_ABOVE', label: 'Block some (Default)' },
        { value: 'BLOCK_LOW_AND_ABOVE', label: 'Block most' }
    ];

    return createPortal(
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 100000, // Always on top of everything
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '1.5rem',
                width: '450px',
                maxWidth: '90vw',
                color: '#e2e8f0',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.8rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#ef4444' }}>⚠️</span>
                        {lang === 'ja' ? 'Safety Settings' : 'Safety Settings'}
                    </h2>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                        {lang === 'ja'
                            ? 'Gemini APIの出力ブロック基準を調整します。創作においてブロックされる場合は「Block none」を設定してください。'
                            : 'Adjust the Gemini API output blocking threshold. Select "Block none" if your creative content is being blocked.'}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {categories.map(cat => {
                        const currentSetting = settings.find(s => s.category === cat.key)?.threshold || 'BLOCK_MEDIUM_AND_ABOVE';
                        return (
                            <div key={cat.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                    {lang === 'ja' ? cat.ja : cat.en}
                                </span>
                                <select
                                    value={currentSetting}
                                    onChange={(e) => updateCategory(cat.key, e.target.value as SafetyThreshold)}
                                    style={{
                                        backgroundColor: '#0f172a',
                                        color: '#e2e8f0',
                                        border: '1px solid #475569',
                                        borderRadius: '4px',
                                        padding: '0.4rem',
                                        fontSize: '0.85rem',
                                        outline: 'none',
                                        width: '180px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {thresholds.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '2rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'transparent',
                            color: '#94a3b8',
                            border: '1px solid #475569',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        {lang === 'ja' ? 'キャンセル' : 'Cancel'}
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#38bdf8',
                            color: '#0f172a',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7dd3fc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38bdf8'}
                    >
                        {lang === 'ja' ? '保存 (Save)' : 'Save'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
