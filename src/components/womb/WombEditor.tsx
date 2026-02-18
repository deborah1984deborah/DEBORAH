import React from 'react';
import { TooltipButton } from '../shared/TooltipButton';

interface WombEditorProps {
    lang: 'ja' | 'en';
    content: string;
    setContent: (content: string) => void;
    displayTitle: string | undefined;
    isGenerating: boolean;
    onSave: () => void;
    onOpenFileList: () => void;
    onNewStory: () => void;
}

export const WombEditor: React.FC<WombEditorProps> = ({
    lang,
    content,
    setContent,
    displayTitle,
    isGenerating,
    onSave,
    onOpenFileList,
    onNewStory
}) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            height: '100%',
            position: 'relative' // Added for floating button
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between', // Push buttons to far right
                flexShrink: 0
            }}>
                <div style={{
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.1em',
                    maxWidth: '350px',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>WOMB :: EDITOR</span>
                    {displayTitle && (
                        <>
                            <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{' - [ '}</span>
                            <span style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                minWidth: 0
                            }}>
                                {displayTitle}
                            </span>
                            <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{' ]'}</span>
                        </>
                    )}
                </div>

                {/* Document Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <TooltipButton
                        label="Open Story"
                        onClick={onOpenFileList}
                        icon={
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            </svg>
                        }
                    />
                    <TooltipButton
                        label="New Story"
                        onClick={onNewStory}
                        icon={
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                        }
                    />
                </div>
            </div>
            <textarea
                style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    padding: '1rem',
                    paddingBottom: '4rem', // Space for button
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                    overflowY: 'auto' // Independent scroll
                }}
                placeholder={lang === 'en' ? "Write your story here. The first line of the work will automatically become the title." : "ここに物語を記述します。作品の1行目が自動でタイトルになります。"}
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />

            {/* GENERATE BUTTON */}
            <button
                onClick={onSave}
                disabled={isGenerating}
                style={{
                    position: 'absolute',
                    bottom: '1.5rem',
                    right: '1.5rem',
                    backgroundColor: isGenerating ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '30px',
                    color: isGenerating ? 'rgba(255, 255, 255, 0.5)' : 'white',
                    padding: '0.5rem 1.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.1em',
                    cursor: isGenerating ? 'wait' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: isGenerating ? 'none' : '0 4px 15px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                    if (!isGenerating) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.borderColor = 'white';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.3)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isGenerating) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
                    }
                }}
            >
                {isGenerating ? (
                    <>
                        <span style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            animation: 'pulse 1s infinite'
                        }} />
                        SAVING...
                    </>
                ) : (
                    <>
                        <span style={{ fontSize: '1.1em' }}>✧</span> GENERATE
                    </>
                )}
            </button>
            <style>
                {`
                    @keyframes pulse {
                        0% { transform: scale(0.8); opacity: 0.5; }
                        50% { transform: scale(1.2); opacity: 1; }
                        100% { transform: scale(0.8); opacity: 0.5; }
                    }
                `}
            </style>
        </div>
    );
};
