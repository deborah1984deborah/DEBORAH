import React from 'react';

interface WombEditorOverlaysProps {
    lang: 'ja' | 'en';
    content: string;
    paddingLeft: number;
    isCordProcessing?: boolean;
    isGenerating: boolean;
}

export const WombEditorOverlays: React.FC<WombEditorOverlaysProps> = ({
    lang,
    content,
    paddingLeft,
    isCordProcessing,
    isGenerating
}) => {
    return (
        <>
            {/* PLACEHOLDER OVERLAY */}
            {!content && (
                <div style={{
                    position: 'absolute',
                    top: '100px', // Lower position to act as an instruction
                    left: `${paddingLeft}px`, // Dynamic left alignment
                    color: 'rgba(255, 255, 255, 0.3)',
                    pointerEvents: 'none', // Allow clicking through to editor
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    userSelect: 'none'
                }}>
                    {lang === 'en'
                        ? "Write your story here. The first line of the work will automatically become the title."
                        : "ここに物語を記述します。作品の1行目が自動でタイトルになります。"}
                </div>
            )}

            {/* CORD PROCESSING OVERLAY */}
            {isCordProcessing && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(3px)',
                    zIndex: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none', // Prevent interaction but Editor is also readOnly
                    borderRadius: '8px'
                }}>
                    <div style={{
                        color: '#38bdf8',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.2em',
                        animation: 'pulse 1.5s infinite',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        padding: '1rem 2rem',
                        borderRadius: '30px',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)'
                    }}>
                        CORD ADVISOR IS PROCESSING...
                    </div>
                </div>
            )}

            {/* WOMB GENERATING OVERLAY */}
            {isGenerating && !isCordProcessing && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(3px)',
                    zIndex: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none', // Prevent interaction but Editor is also readOnly
                    borderRadius: '8px'
                }}>
                    <div style={{
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.2em',
                        animation: 'pulse 1.5s infinite',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        padding: '1rem 2rem',
                        borderRadius: '30px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
                    }}>
                        WOMB IS GENERATING...
                    </div>
                </div>
            )}

            <style>
                {`
                    @keyframes pulse {
                        0% { transform: scale(0.8); opacity: 0.5; }
                        50% { transform: scale(1.2); opacity: 1; }
                        100% { transform: scale(0.8); opacity: 0.5; }
                    }
                `}
            </style>
        </>
    );
};
