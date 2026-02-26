import React from 'react';
import { ChatMessage } from '../../../types';

interface CordChatMessageBlueprintProps {
    msg: ChatMessage;
}

export const CordChatMessageBlueprint: React.FC<CordChatMessageBlueprintProps> = ({ msg }) => {
    // Only render if it's an AI message calling the trigger_womb_generation tool with a blueprint_text argument
    if (msg.role !== 'ai' || msg.functionCall?.name !== 'trigger_womb_generation' || !msg.functionCall?.args?.blueprint_text) {
        return null;
    }

    return (
        <div style={{
            marginTop: msg.content ? '1rem' : '0',
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px',
            borderLeft: '4px solid #38bdf8'
        }}>
            <div style={{
                fontSize: '0.8rem',
                color: '#38bdf8',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
            }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                Narrative Blueprint
            </div>
            <div style={{ color: '#e0f2fe', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {msg.functionCall.args.blueprint_text}
            </div>
        </div>
    );
};
