import React from 'react';
import { ChatMessage } from '../../../types';

interface CordChatMessageSystemProps {
    msg: ChatMessage;
}

export const CordChatMessageSystem: React.FC<CordChatMessageSystemProps> = ({ msg }) => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '0.5rem 0'
        }}>
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                padding: '0.8rem 1rem',
                borderRadius: '16px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                maxWidth: '85%'
            }}>
                <svg style={{ flexShrink: 0, marginTop: '0.1rem' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.4' }}>
                    {msg.content}
                </div>
            </div>
        </div>
    );
};
