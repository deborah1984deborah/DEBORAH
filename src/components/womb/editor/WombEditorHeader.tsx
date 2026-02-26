import React from 'react';
import { TooltipButton } from '../../shared/TooltipButton';

interface WombEditorHeaderProps {
    displayTitle: string | undefined;
    content: string;
    isLocked: boolean;
    showWombDebugInfo?: boolean;
    onToggleTestViewZone: () => void;
    onManualSave?: () => void;
    onInsertRegion: () => void;
    onOpenFileList: () => void;
    onNewStory: () => void;
}

export const WombEditorHeader: React.FC<WombEditorHeaderProps> = ({
    displayTitle,
    content,
    isLocked,
    showWombDebugInfo,
    onToggleTestViewZone,
    onManualSave,
    onInsertRegion,
    onOpenFileList,
    onNewStory
}) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
                {displayTitle && content.split('\n')[0].trim() !== '' && (
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
                {showWombDebugInfo && (
                    <TooltipButton
                        label="Toggle Test ViewZone"
                        onClick={onToggleTestViewZone}
                        disabled={isLocked}
                        icon={
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a2 2 0 0 0 1.808 2.95h10.944a2 2 0 0 0 1.808-2.95l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
                                <path d="M8.5 2h7" />
                                <path d="M7 16h10" />
                            </svg>
                        }
                    />
                )}
                <TooltipButton
                    label="Save"
                    onClick={onManualSave || (() => { console.log("Manual save not provided"); })}
                    disabled={isLocked}
                    icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                    }
                />
                <TooltipButton
                    label="Insert AI Instruction"
                    onClick={onInsertRegion}
                    disabled={isLocked}
                    icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    }
                />
                <TooltipButton
                    label="Open Story"
                    onClick={onOpenFileList}
                    disabled={isLocked}
                    icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                    }
                />
                <TooltipButton
                    label="New Story"
                    onClick={onNewStory}
                    disabled={isLocked}
                    icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                    }
                />
            </div>
        </div>
    );
};
