import React, { useState, useEffect, useRef } from 'react';

interface CordChatProps {
    lang: 'ja' | 'en';
}

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: number;
}

export const CordChat: React.FC<CordChatProps> = ({ lang }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'ai',
            content: lang === 'ja'
                ? '何か物語のアイデアはありますか？一緒に新しい世界を創造しましょう。'
                : 'Do you have any story ideas? Let\'s create a new world together.',
            timestamp: Date.now()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue('');

        // Mock AI response for now
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: lang === 'ja'
                    ? 'なるほど、それは興味深いですね。詳しく聞かせてください。'
                    : 'I see, that sounds interesting. Please tell me more.',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, aiResponse]);
        }, 1000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
        }}>
            {/* Message List */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                        <div style={{
                            maxWidth: '70%',
                            padding: '0.8rem 1.2rem',
                            borderRadius: '12px',
                            backgroundColor: msg.role === 'user' ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                            color: msg.role === 'user' ? '#0f172a' : '#e2e8f0',
                            borderTopRightRadius: msg.role === 'user' ? '2px' : '12px',
                            borderTopLeftRadius: msg.role === 'ai' ? '2px' : '12px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
                padding: '1rem',
                borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-end'
            }}>
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={lang === 'ja' ? 'メッセージを入力...' : 'Type a message...'}
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
                        fontFamily: 'inherit'
                    }}
                    rows={1}
                />
                <button
                    onClick={handleSend}
                    style={{
                        backgroundColor: '#38bdf8',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.8rem 1.2rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                    {lang === 'ja' ? '送信' : 'Send'}
                </button>
            </div>
        </div>
    );
};
