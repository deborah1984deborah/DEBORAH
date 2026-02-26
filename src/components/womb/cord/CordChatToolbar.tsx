import React from 'react';
import { TooltipButton } from '../../shared/TooltipButton';
import { ChatSession } from '../../../types';

interface CordChatToolbarProps {
    lang: 'ja' | 'en';
    isLocked: boolean;
    currentSessionId: string | null;
    activeSession: ChatSession | null;
    isNewChatAwareOfWombStory: boolean;
    setIsNewChatAwareOfWombStory: (val: boolean) => void;
    toggleWombAwareness: (sessionId: string, aware: boolean) => void;
    handleSaveHistory: () => void;
    handleNewChat: () => void;
}

export const CordChatToolbar: React.FC<CordChatToolbarProps> = ({
    lang,
    isLocked,
    currentSessionId,
    activeSession,
    isNewChatAwareOfWombStory,
    setIsNewChatAwareOfWombStory,
    toggleWombAwareness,
    handleSaveHistory,
    handleNewChat
}) => {
    return (
        <div style={{
            position: 'absolute',
            bottom: '0.2rem',
            left: '1rem',
            right: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.4rem',
        }}>
            {/* Story Awareness Toggle (Visual Only for now) */}
            <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                color: '#94a3b8',
                cursor: isLocked ? 'default' : 'pointer',
                userSelect: 'none',
                marginTop: '6px' // Pushed down slightly more
            }}>
                <input
                    type="checkbox"
                    checked={currentSessionId ? (activeSession?.isAwareOfWombStory || false) : isNewChatAwareOfWombStory}
                    onChange={(e) => {
                        if (currentSessionId) {
                            toggleWombAwareness(currentSessionId, e.target.checked);
                        } else {
                            setIsNewChatAwareOfWombStory(e.target.checked);
                        }
                    }}
                    disabled={isLocked}
                    style={{
                        accentColor: '#38bdf8',
                        width: '14px',
                        height: '14px',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        opacity: isLocked ? 0.5 : 1
                    }}
                />
                {lang === 'ja' ? 'CORDがWOMBのストーリーを把握する' : 'CORD is aware of WOMB Story'}
            </label>

            {/* Right side icons */}
            <div style={{ display: 'flex', gap: '0.8rem' }}>
                {/* View History / Save (Folder) */}
                <TooltipButton
                    label={lang === 'ja' ? '保存済み / 履歴' : 'Saved / History'}
                    placement="top"
                    variant="neon-blue"
                    onClick={handleSaveHistory}
                    disabled={isLocked}
                    icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                    }
                />

                {/* New Chat (Paper & Pen) */}
                <TooltipButton
                    label={lang === 'ja' ? '新しいチャット' : 'New Chat'}
                    placement="top"
                    variant="neon-blue"
                    onClick={handleNewChat}
                    disabled={isLocked}
                    icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    }
                />
            </div>
        </div>
    );
};
