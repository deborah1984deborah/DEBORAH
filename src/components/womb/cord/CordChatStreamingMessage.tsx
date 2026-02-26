import React from 'react';

interface CordChatStreamingMessageProps {
    lang: 'ja' | 'en';
    streamingThought: string;
    streamingText: string;
}

export const CordChatStreamingMessage: React.FC<CordChatStreamingMessageProps> = ({
    lang,
    streamingThought,
    streamingText
}) => {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'flex-start',
                position: 'relative',
                marginBottom: '1rem'
            }}
        >
            <div style={{
                width: 'auto',
                maxWidth: '70%',
                padding: '0.8rem 1.2rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#e2e8f0',
                borderTopLeftRadius: '2px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {streamingThought && (
                        <details open style={{
                            fontSize: '0.8rem',
                            color: 'rgba(255,255,255,0.6)',
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            padding: '0.4rem',
                            borderRadius: '4px',
                            marginBottom: '0.5rem',
                            cursor: 'pointer'
                        }}>
                            <summary style={{ outline: 'none', userSelect: 'none', fontWeight: 'bold' }}>
                                {lang === 'ja' ? '💭 思考プロセス (Thinking...)' : '💭 Thinking Process...'}
                            </summary>
                            <div style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    {streamingThought}
                                    {(!streamingText) && <span style={{ opacity: 0.7 }}>_</span>}
                                </div>
                            </div>
                        </details>
                    )}
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {streamingText}
                        {(!streamingThought || streamingText) && <span style={{ opacity: 0.7 }}>_</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};
