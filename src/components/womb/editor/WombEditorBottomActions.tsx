import React from 'react';

interface WombEditorBottomActionsProps {
    lang: 'ja' | 'en';
    isLocked: boolean;
    isGenerating: boolean;
    onOpenChatModal: () => void;
    onUndo?: () => void;
    canUndo?: boolean;
    onRedo?: () => void;
    canRedo?: boolean;
    redoBranchCount?: number;
    onSave: () => void;
}

export const WombEditorBottomActions: React.FC<WombEditorBottomActionsProps> = ({
    lang,
    isLocked,
    isGenerating,
    onOpenChatModal,
    onUndo,
    canUndo,
    onRedo,
    canRedo,
    redoBranchCount = 0,
    onSave
}) => {
    return (
        <div style={{
            position: 'absolute',
            bottom: '1.5rem',
            right: '1.5rem',
            display: 'flex',
            gap: '0.75rem',
            zIndex: 10
        }}>
            <button
                onClick={onOpenChatModal}
                title={lang === 'ja' ? 'WOMB 生成履歴' : 'WOMB Interaction History'}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.7)',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    padding: 0
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#38bdf8'; // Light blue text on hover
                    e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
            </button>

            {/* UNDO BUTTON */}
            <button
                onClick={onUndo}
                disabled={!canUndo || isLocked}
                title="Undo"
                style={{
                    background: 'none',
                    border: 'none',
                    color: (!canUndo || isLocked) ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.7)',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (!canUndo || isLocked) ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    padding: 0
                }}
                onMouseEnter={(e) => {
                    if (canUndo && !isLocked) {
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (canUndo && !isLocked) {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }
                }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7v6h6" />
                    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
            </button>

            {/* REDO BUTTON */}
            <button
                onClick={onRedo}
                disabled={!canRedo || isLocked}
                title="Redo"
                style={{
                    background: 'none',
                    border: 'none',
                    color: (!canRedo || isLocked) ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.7)',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (!canRedo || isLocked) ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    padding: 0,
                    position: 'relative'
                }}
                onMouseEnter={(e) => {
                    if (canRedo && !isLocked) {
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (canRedo && !isLocked) {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }
                }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 7v6h-6" />
                    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                </svg>

                {/* REDO BADGE NOTIFICATION */}
                {redoBranchCount > 1 && (
                    <div style={{
                        position: 'absolute',
                        top: '0px',
                        right: '0px',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                    }}>
                        {redoBranchCount}
                    </div>
                )}
            </button>

            {/* GENERATE BUTTON */}
            <button
                onClick={onSave}
                disabled={isLocked}
                style={{
                    marginLeft: '0.5rem',
                    backgroundColor: isLocked ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '30px',
                    color: isGenerating ? 'rgba(255, 255, 255, 0.5)' : 'white',
                    padding: '0.5rem 1.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.1em',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: isLocked ? 'none' : '0 4px 15px rgba(0, 0, 0, 0.3)',
                }}
                onMouseEnter={(e) => {
                    if (!isLocked) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.borderColor = 'white';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.3)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isLocked) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
                    }
                }}
            >
                {isLocked ? (
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
        </div>
    );
};
