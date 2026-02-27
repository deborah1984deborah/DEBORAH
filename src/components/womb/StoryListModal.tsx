import React, { useState } from 'react';
import { Story, StoryLoreRelation } from '../../types';

export const StoryListModal: React.FC<{
    savedStories: Story[];
    globalRelations: StoryLoreRelation[];
    onClose: () => void;
    onSelectStory: (story: Story, relations: StoryLoreRelation[]) => void;
    onDeleteStory: (e: React.MouseEvent, storyId: string) => void;
}> = ({ savedStories, globalRelations, onClose, onSelectStory, onDeleteStory }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStories = savedStories.filter(story =>
        story.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }} onClick={onClose}>
            {/* INJECT CUSTOM SCROLLBAR STYLE FOR THIS MODAL ONLY */}
            <style>{`
                .story-list-scroll::-webkit-scrollbar {
                    width: 8px;
                }
                .story-list-scroll::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                }
                .story-list-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.45);
                    border-radius: 4px;
                }
                .story-list-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.65);
                }
            `}</style>

            <div style={{
                width: '500px',
                height: '80vh', // Fixed height instead of maxHeight
                backgroundColor: '#1A1A20',
                border: '1px solid #38bdf8',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 0 30px rgba(56, 189, 248, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                color: 'white'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#38bdf8' }}>SAVED STORIES</span>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
                    >
                        ✕
                    </button>
                </div>

                {/* SEARCH BAR */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by title..."
                        style={{
                            flex: 1,
                            padding: '0.5rem 1rem',
                            backgroundColor: '#0f0f11',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            borderRadius: '6px',
                            color: 'white',
                            outline: 'none',
                            fontSize: '0.9rem'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(56, 189, 248, 0.3)'}
                        autoFocus
                    />
                    <div style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                </div>

                <div className="story-list-scroll" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '4px' }}>
                    {filteredStories.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                            {savedStories.length === 0 ? "No saved stories found." : "No stories match your search."}
                        </div>
                    ) : (
                        filteredStories.sort((a, b) => b.updatedAt - a.updatedAt).map(story => (
                            <div
                                key={story.id}
                                onClick={() => {
                                    const storyRelations = globalRelations.filter(r => r.storyId === story.id);
                                    onSelectStory(story, storyRelations);
                                }}
                                style={{
                                    padding: '1rem',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    border: '1px solid transparent',
                                    position: 'relative' // For delete button positioning
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
                                    e.currentTarget.style.border = '1px solid rgba(56, 189, 248, 0.3)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.border = '1px solid transparent';
                                }}
                            >
                                <div style={{ fontWeight: 'bold', marginBottom: '0.3rem', paddingRight: '2rem' }}>{story.title}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                    Last Updated: {new Date(story.updatedAt).toLocaleString()}
                                </div>
                                {/* DELETE BUTTON */}
                                <button
                                    onClick={(e) => onDeleteStory(e, story.id)}
                                    style={{
                                        position: 'absolute',
                                        top: '0.5rem',
                                        right: '0.5rem',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#ef4444', // Red-500
                                        cursor: 'pointer',
                                        padding: '0.2rem',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    title="Delete Story"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
