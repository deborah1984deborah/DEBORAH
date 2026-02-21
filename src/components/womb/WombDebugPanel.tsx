import React from 'react';
import { createPortal } from 'react-dom';
import { LoreItem } from '../../types';

interface WombDebugPanelProps {
    showWombDebugInfo: boolean;
    debugSystemPrompt: string;
    debugInputText: string;
    debugMatchedEntities: LoreItem[];
    isActive: boolean;
    onClick: () => void;
}

export const WombDebugPanel: React.FC<WombDebugPanelProps> = ({
    showWombDebugInfo,
    debugSystemPrompt,
    debugInputText,
    debugMatchedEntities,
    isActive,
    onClick
}) => {
    if (!showWombDebugInfo) return null;

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
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>System Prompt (Dynamic)</h4>
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
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>API Request Input Text</h4>
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
