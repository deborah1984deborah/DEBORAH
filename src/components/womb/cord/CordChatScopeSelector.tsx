import React from 'react';

interface CordChatScopeSelectorProps {
    lang: 'ja' | 'en';
    isLocked: boolean;
    displayedScope: 'global' | 'story' | null;
    currentSessionId: string | null;
    setChatScope: (scope: 'global' | 'story') => void;
}

export const CordChatScopeSelector: React.FC<CordChatScopeSelectorProps> = ({
    lang,
    isLocked,
    displayedScope,
    currentSessionId,
    setChatScope
}) => {
    return (
        <div style={{
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: isLocked ? 0.3 : 1, // Keep fully visible, just disable interaction
            pointerEvents: (currentSessionId || isLocked) ? 'none' : 'auto',
            transition: 'all 0.3s ease',
            marginBottom: '0.5rem',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px', // Capsule shape
            padding: '0.2rem 0.5rem',
            position: 'relative'
        }}>
            <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: displayedScope === 'global' ? '#10b981' : '#38bdf8',
                boxShadow: `0 0 5px ${displayedScope === 'global' ? '#10b981' : '#38bdf8'}`
            }}></div>
            <select
                value={displayedScope || 'story'}
                onChange={(e) => setChatScope(e.target.value as 'global' | 'story')}
                style={{
                    appearance: 'none',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: displayedScope === 'global' ? '#10b981' : '#38bdf8', // Emerald for Global, Cyan for Story
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    outline: 'none',
                    cursor: (currentSessionId || isLocked) ? 'default' : 'pointer',
                    paddingRight: (currentSessionId || isLocked) ? '0' : '1rem', // Collapse space when arrow is hidden
                    transition: 'padding 0.3s ease',
                }}
                disabled={!!currentSessionId || isLocked}
            >
                <option value="story" style={{ backgroundColor: '#1A1A20', color: '#38bdf8' }}>{lang === 'ja' ? 'Story Scope' : 'Story Scope'}</option>
                <option value="global" style={{ backgroundColor: '#1A1A20', color: '#10b981' }}>{lang === 'ja' ? 'Global Scope' : 'Global Scope'}</option>
            </select>
            {/* Dropdown Arrow: Hide when a session is active to make it look like a badge */}
            <svg style={{
                position: 'absolute',
                right: '0.5rem',
                pointerEvents: 'none',
                opacity: (currentSessionId || isLocked) ? 0 : 1,
                transition: 'opacity 0.3s'
            }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={displayedScope === 'global' ? '#10b981' : '#38bdf8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </div>
    );
};
