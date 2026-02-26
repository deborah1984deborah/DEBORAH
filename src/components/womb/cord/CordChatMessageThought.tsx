import React from 'react';
import { ChatMessage } from '../../../types';

interface CordChatMessageThoughtProps {
    msg: ChatMessage;
    lang: 'ja' | 'en';
    showDebugInfo: boolean;
}

export const CordChatMessageThought: React.FC<CordChatMessageThoughtProps> = ({
    msg,
    lang,
    showDebugInfo
}) => {
    // Only render if thought summary exists, or if debug mode is on and there are thought signatures
    const hasThoughtSummary = !!msg.thoughtSummary;
    const hasThoughtSignatures = showDebugInfo && msg.rawParts?.some(p => p.thought_signature || p.thoughtSignature);

    if (msg.role !== 'ai' || (!hasThoughtSummary && !hasThoughtSignatures)) {
        return null;
    }

    return (
        <details style={{
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.6)',
            backgroundColor: 'rgba(0,0,0,0.2)',
            padding: '0.4rem',
            borderRadius: '4px',
            marginBottom: '0.5rem',
            cursor: 'pointer'
        }}>
            <summary style={{ outline: 'none', userSelect: 'none', fontWeight: 'bold' }}>
                {lang === 'ja' ? '💭 思考プロセス (Thinking)' : '💭 Thinking Process'}
            </summary>
            <div style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                {msg.thoughtSummary && (
                    <div style={{ marginBottom: '0.5rem' }}>{msg.thoughtSummary}</div>
                )}
                {showDebugInfo && msg.rawParts && (
                    msg.rawParts.filter(p => p.thought_signature || p.thoughtSignature).map((p, i) => (
                        <div key={`sig-${i}`} style={{ color: '#fbbf24', fontSize: '0.7rem', wordBreak: 'break-all', fontFamily: 'monospace', marginTop: '0.5rem' }}>
                            [Signature {i + 1}]: {p.thought_signature || p.thoughtSignature}
                        </div>
                    ))
                )}
            </div>
        </details>
    );
};
