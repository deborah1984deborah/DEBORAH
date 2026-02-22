import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { LoreItem } from '../../types';

interface WombDebugPanelProps {
    lang: 'ja' | 'en'; // Added lang prop for localization
    showWombDebugInfo: boolean;
    debugSystemPrompt: string;
    debugInputText: string;
    debugMatchedEntities: LoreItem[];
    isActive: boolean;
    onClick: () => void;
}

export const WombDebugPanel: React.FC<WombDebugPanelProps> = ({
    lang,
    showWombDebugInfo,
    debugSystemPrompt,
    debugInputText,
    debugMatchedEntities,
    isActive,
    onClick
}) => {
    const [copiedSystem, setCopiedSystem] = useState(false);
    const [copiedInput, setCopiedInput] = useState(false);

    if (!showWombDebugInfo) return null;

    const copyToClipboard = async (text: string, type: 'system' | 'input') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'system') {
                setCopiedSystem(true);
                setTimeout(() => setCopiedSystem(false), 2000);
            } else {
                setCopiedInput(true);
                setTimeout(() => setCopiedInput(false), 2000);
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return createPortal(
        <div
            onClick={onClick}
            style={{
                position: 'fixed',
                bottom: isActive ? '22%' : '24%',
                right: isActive ? '3.5%' : '2.5%',
                width: '240px',
                maxHeight: '60vh',
                backgroundColor: 'rgba(15, 23, 42, 0.95)', // Slate 900
                border: '1px solid rgba(244, 114, 182, 0.4)', // Pink-400 border
                borderRadius: '8px',
                padding: '1rem',
                color: '#e2e8f0',
                zIndex: isActive ? 9999 : 9998,
                boxShadow: isActive ? '0 12px 40px rgba(0, 0, 0, 0.7)' : '0 4px 16px rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                overflowY: 'auto',
                transform: isActive ? 'scale(1)' : 'scale(0.95)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                cursor: isActive ? 'default' : 'pointer',
                opacity: isActive ? 1 : 0.8
            }}>
            <h3 style={{ margin: 0, color: '#f472b6', fontSize: '1rem', borderBottom: '1px solid rgba(244, 114, 182, 0.2)', paddingBottom: '0.5rem' }}>
                WOMB DEV TOOLS
            </h3>

            {/* Matched Entities */}
            <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>Matched Entities ({debugMatchedEntities.length})</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {debugMatchedEntities.length === 0 ? (
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>None</span>
                    ) : (
                        debugMatchedEntities.map(item => (
                            <span key={item.id} style={{
                                fontSize: '0.75rem',
                                padding: '2px 6px',
                                backgroundColor: 'rgba(244, 114, 182, 0.2)',
                                color: '#fbcfe8',
                                borderRadius: '4px',
                                border: '1px solid rgba(244, 114, 182, 0.3)'
                            }}>
                                {item.name} [{item.type.toUpperCase()}]
                            </span>
                        ))
                    )}
                </div>
            </div>

            {/* System Prompt */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>System Prompt (Dynamic)</h4>
                    {debugSystemPrompt && (
                        <button
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(debugSystemPrompt, 'system'); }}
                            title={lang === 'ja' ? "システムプロンプトをコピー" : "Copy System Prompt"}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: copiedSystem ? '#34d399' : '#94a3b8',
                                padding: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => { if (!copiedSystem) e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                            onMouseLeave={(e) => { if (!copiedSystem) e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            {copiedSystem ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            )}
                        </button>
                    )}
                </div>
                <pre style={{
                    margin: 0,
                    padding: '0.5rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    color: '#fbbf24' // Amber 400
                }}>
                    {debugSystemPrompt || '< Empty >'}
                </pre>
            </div>

            {/* Input Text */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>API Request Input Text</h4>
                    {debugInputText && (
                        <button
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(debugInputText, 'input'); }}
                            title={lang === 'ja' ? "入力テキストをコピー" : "Copy Input Text"}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: copiedInput ? '#34d399' : '#94a3b8',
                                padding: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => { if (!copiedInput) e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                            onMouseLeave={(e) => { if (!copiedInput) e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            {copiedInput ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            )}
                        </button>
                    )}
                </div>
                <pre style={{
                    margin: 0,
                    padding: '0.5rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    maxHeight: '300px', // Allow this one to be bigger
                    overflowY: 'auto',
                    color: '#e2e8f0'
                }}>
                    {debugInputText || '< None >'}
                </pre>
            </div>
        </div>,
        document.body
    );
};
