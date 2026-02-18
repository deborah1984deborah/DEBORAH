import React, { useState } from 'react';
import { LoreItem } from '../../../types';

interface LorebookSidebarProps {
    lang: 'ja' | 'en';
    mommyList: LoreItem[];
    nerdList: LoreItem[];
    loreList: LoreItem[];
    activeMommyIds: string[];
    setActiveMommyIds: (ids: string[]) => void;
    activeNerdIds: string[];
    setActiveNerdIds: (ids: string[]) => void;
    activeLoreIds: string[];
    setActiveLoreIds: (ids: string[]) => void;
    selectedItem: LoreItem | null;
    setSelectedItem: (item: LoreItem | null) => void;
    activeTab: 'mommy' | 'nerd' | 'lore';
    setActiveTab: (tab: 'mommy' | 'nerd' | 'lore') => void;
}

export const LorebookSidebar: React.FC<LorebookSidebarProps> = ({
    mommyList, nerdList, loreList,
    activeMommyIds, setActiveMommyIds,
    activeNerdIds, setActiveNerdIds,
    activeLoreIds, setActiveLoreIds,
    selectedItem, setSelectedItem,
    activeTab, setActiveTab
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const toggleId = (id: string, currentIds: string[], setIds: (ids: string[]) => void) => {
        if (currentIds.includes(id)) {
            setIds(currentIds.filter(i => i !== id));
        } else {
            setIds([...currentIds, id]);
        }
    };

    const renderList = (items: LoreItem[], currentIds: string[], setIds: (ids: string[]) => void) => {
        // Filter items based on search term (name match)
        const filteredItems = items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredItems.length === 0) {
            return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                {items.length === 0 ? "No items found." : "No matching items."}
            </div>;
        }
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredItems.map(item => (
                    <label key={item.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.8rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        borderLeft: selectedItem?.id === item.id ? '4px solid #38bdf8' : '4px solid transparent',
                        backgroundColor: selectedItem?.id === item.id ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'
                    }}
                        onClick={() => setSelectedItem(item)} // Select Item
                        onMouseEnter={e => {
                            if (selectedItem?.id !== item.id) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={e => {
                            if (selectedItem?.id !== item.id) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={currentIds.includes(item.id)}
                            readOnly
                            style={{ display: 'none' }}
                        />
                        {/* Custom Toggle Switch */}
                        <div
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent selection when toggling
                                toggleId(item.id, currentIds, setIds);
                            }}
                            style={{
                                width: '40px',
                                height: '22px',
                                backgroundColor: currentIds.includes(item.id) ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '11px',
                                position: 'relative',
                                transition: 'all 0.2s ease',
                                flexShrink: 0,
                                boxShadow: currentIds.includes(item.id)
                                    ? '0 0 10px rgba(56, 189, 248, 0.6), inset 0 1px 3px rgba(0,0,0,0.3)'
                                    : 'inset 0 1px 3px rgba(0,0,0,0.3)',
                                cursor: 'pointer'
                            }}>
                            <div style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '3px',
                                left: currentIds.includes(item.id) ? '21px' : '3px',
                                transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }} />
                        </div>
                        <span style={{ fontWeight: 'bold', flex: 1, letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                        {currentIds.includes(item.id) && (
                            <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 'bold', padding: '0.2rem 0.5rem', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px' }}>
                                ACTIVE
                            </span>
                        )}
                    </label>
                ))}
            </div>
        );
    };

    return (
        <div style={{
            width: '350px',
            borderRight: '1px solid rgba(148, 163, 184, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(0, 0, 0, 0.2)'
        }}>
            <div style={{
                padding: '1rem',
                borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#38bdf8' }}>LOREBOOK</span>
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
                {(['mommy', 'nerd', 'lore'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            setSelectedItem(null);
                            setSearchTerm(''); // Clear search on tab switch
                            setShowSearch(false); // Hide search on tab switch
                        }}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid #38bdf8' : '2px solid transparent',
                            color: activeTab === tab ? '#38bdf8' : '#94a3b8',
                            padding: '0.8rem 0.5rem',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s',
                            textTransform: 'uppercase',
                            backgroundColor: activeTab === tab ? 'rgba(56, 189, 248, 0.05)' : 'transparent'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* SEARCH BAR */}
            <div style={{ padding: '0.5rem 0.5rem 0 0.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: '40px' }}>
                {showSearch && (
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        autoFocus
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid #38bdf8',
                            color: 'white',
                            outline: 'none',
                            marginRight: '0.5rem',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.9rem'
                        }}
                    />
                )}
                <button
                    onClick={() => {
                        setShowSearch(!showSearch);
                        if (showSearch) setSearchTerm(''); // Clear search when hiding
                    }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: showSearch ? '#38bdf8' : '#94a3b8',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s'
                    }}
                    title={showSearch ? "Close Search" : "Search"}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </button>
            </div>

            {/* LIST CONTENT */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem' }}>
                {activeTab === 'mommy' && renderList(mommyList, activeMommyIds, setActiveMommyIds)}
                {activeTab === 'nerd' && renderList(nerdList, activeNerdIds, setActiveNerdIds)}
                {activeTab === 'lore' && renderList(loreList, activeLoreIds, setActiveLoreIds)}
            </div>
        </div>
    );
};
