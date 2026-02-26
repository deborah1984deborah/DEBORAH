import React from 'react';
import { ChatMessage } from '../../../types';

interface CordChatInlineEditorProps {
    msg: ChatMessage;
    lang: 'ja' | 'en';
    editValue: string;
    setEditValue: (val: string) => void;
    setEditingMessageId: (id: string | null) => void;
    editMessage: (id: string, newContent: string) => void;
}

export const CordChatInlineEditor: React.FC<CordChatInlineEditorProps> = ({
    msg,
    lang,
    editValue,
    setEditValue,
    setEditingMessageId,
    editMessage
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
            <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        setEditingMessageId(null);
                    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        editMessage(msg.id, editValue);
                        setEditingMessageId(null);
                    }
                }}
                style={{
                    width: '100%',
                    minHeight: '60px',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: msg.role === 'user' ? '#0f172a' : '#e2e8f0',
                    padding: '0.5rem',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: 'inherit'
                }}
                autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                    onClick={() => setEditingMessageId(null)}
                    style={{ background: 'transparent', border: 'none', color: msg.role === 'user' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                    {lang === 'ja' ? 'キャンセル (Esc)' : 'Cancel (Esc)'}
                </button>
                <button
                    onClick={() => {
                        editMessage(msg.id, editValue);
                        setEditingMessageId(null);
                    }}
                    style={{ background: msg.role === 'user' ? '#0f172a' : '#38bdf8', color: msg.role === 'user' ? '#38bdf8' : '#0f172a', border: 'none', borderRadius: '4px', padding: '0.2rem 0.8rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                >
                    {lang === 'ja' ? '保存 (Ctrl+Enter)' : 'Save (Ctrl+Enter)'}
                </button>
            </div>
        </div>
    );
};
