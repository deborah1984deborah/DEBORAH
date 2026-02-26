import React from 'react';

interface CordChatInputProps {
    lang: 'ja' | 'en';
    inputValue: string;
    setInputValue: (val: string) => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    handleSend: () => void;
    isLocked: boolean;
}

export const CordChatInput: React.FC<CordChatInputProps> = ({
    lang,
    inputValue,
    setInputValue,
    handleKeyDown,
    handleSend,
    isLocked
}) => {
    return (
        <div style={{
            padding: '1rem',
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-end',
            opacity: isLocked ? 0.5 : 1, // Visually dim when locked
            pointerEvents: isLocked ? 'none' : 'auto', // Lock inputs
            transition: 'opacity 0.2s'
        }}>
            <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={lang === 'ja' ? 'メッセージを入力...' : 'Type a message...'}
                disabled={isLocked}
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    padding: '0.8rem',
                    color: '#e2e8f0',
                    resize: 'none',
                    minHeight: '24px',
                    maxHeight: '120px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    cursor: isLocked ? 'not-allowed' : 'text'
                }}
                rows={1}
            />
            <button
                onClick={handleSend}
                disabled={isLocked}
                style={{
                    backgroundColor: '#38bdf8',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.8rem 1.2rem',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => { if (!isLocked) e.currentTarget.style.opacity = '0.9'; }}
                onMouseOut={(e) => { if (!isLocked) e.currentTarget.style.opacity = '1'; }}
            >
                {lang === 'ja' ? '送信' : 'Send'}
            </button>
        </div>
    );
};
