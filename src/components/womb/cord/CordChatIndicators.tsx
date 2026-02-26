import React from 'react';

// --- Background Processing Indicator ---
interface CordChatBackgroundIndicatorProps {
    lang: 'ja' | 'en';
    isBackgroundProcessing: boolean;
    processingTargetName: string | null;
}

export const CordChatBackgroundIndicator: React.FC<CordChatBackgroundIndicatorProps> = ({
    lang,
    isBackgroundProcessing,
    processingTargetName
}) => {
    if (!isBackgroundProcessing) return null;

    return (
        <div style={{
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
            padding: '0.4rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#38bdf8',
            fontSize: '0.8rem',
            zIndex: 10,
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
            {/* Spinner */}
            <svg style={{ animation: 'spin 1.5s linear infinite' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line>
            </svg>
            <span>
                {lang === 'ja'
                    ? `Active CORD: ヒストリーを自動更新中... ${processingTargetName ? `(${processingTargetName})` : ''}`
                    : `Active CORD: Auto-updating history... ${processingTargetName ? `(${processingTargetName})` : ''}`}
            </span>
            {/* Inject spin keyframes here for simplicity since we don't have a global css yet */}
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

// --- Typing Indicator ---
interface CordChatTypingIndicatorProps {
    lang: 'ja' | 'en';
    isTyping: boolean;
    isStreaming: boolean;
}

export const CordChatTypingIndicator: React.FC<CordChatTypingIndicatorProps> = ({
    lang,
    isTyping,
    isStreaming
}) => {
    if (!isTyping || isStreaming) return null;

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            opacity: 0.7,
            padding: '0.5rem 1rem',
            color: '#e2e8f0',
            fontSize: '0.9rem',
            fontStyle: 'italic',
        }}>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
                <span style={{ animation: 'blink 1.4s infinite both', animationDelay: '0s' }}>.</span>
                <span style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.2s' }}>.</span>
                <span style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.4s' }}>.</span>
            </div>
            <span style={{ marginLeft: '0.5rem' }}>{lang === 'ja' ? 'CORDが入力中...' : 'CORD is typing...'}</span>
        </div>
    );
};
