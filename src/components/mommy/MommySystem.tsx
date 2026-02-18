import { useState, useEffect } from 'react'
import { FuckmeatCreator } from './FuckmeatCreator';
import { PenisCreator } from './PenisCreator';
import { LoreCreator } from './LoreCreator';
import '../../styles/mommy.css';
import { CharacterList } from './CharacterList'
import { LoreList } from './LoreList'
import { MommyCharacter, NerdCharacter, Lore } from '../../types'

type ViewMode = 'mommy' | 'nerd' | 'lore'
type SubMode = 'create' | 'list' | 'edit'


type Props = {
    lang: 'ja' | 'en'
}

export function MommySystem({ lang }: Props) {
    // Independent view states for each tab
    const [createView, setCreateView] = useState<ViewMode>('mommy')
    const [listView, setListView] = useState<ViewMode>('mommy')

    // Tracks current active tab
    const [subMode, setSubMode] = useState<SubMode>('create')

    const [mommyList, setMommyList] = useState<MommyCharacter[]>(() => {
        const saved = localStorage.getItem('deborah_fuckmeat_v1')
        return saved ? JSON.parse(saved) : []
    })

    const [nerdList, setNerdList] = useState<NerdCharacter[]>(() => {
        const saved = localStorage.getItem('deborah_penis_v1')
        return saved ? JSON.parse(saved) : []
    })

    const [loreList, setLoreList] = useState<Lore[]>(() => {
        const saved = localStorage.getItem('deborah_lore_v1')
        return saved ? JSON.parse(saved) : []
    })

    const [editingChar, setEditingChar] = useState<MommyCharacter | NerdCharacter | Lore | null>(null)

    // Save data on change
    useEffect(() => {
        localStorage.setItem('deborah_fuckmeat_v1', JSON.stringify(mommyList))
    }, [mommyList])

    useEffect(() => {
        localStorage.setItem('deborah_penis_v1', JSON.stringify(nerdList))
    }, [nerdList])

    useEffect(() => {
        localStorage.setItem('deborah_lore_v1', JSON.stringify(loreList))
    }, [loreList])

    // Handle toggle click based on current active tab
    const handleViewChange = (newView: ViewMode) => {
        if (subMode === 'create') {
            setCreateView(newView)
        } else if (subMode === 'list') {
            setListView(newView)
        }
    }

    const handleSubModeChange = (mode: SubMode) => {
        setSubMode(mode)
    }

    const handleSaveMommy = (char: MommyCharacter) => {
        setMommyList(prev => {
            const index = prev.findIndex(c => c.id === char.id)
            if (index >= 0) {
                const newList = [...prev]
                newList[index] = char
                return newList
            }
            return [char, ...prev]
        })
        setListView('mommy')
        setSubMode('list')
        setEditingChar(null)
    }

    const handleSaveNerd = (char: NerdCharacter) => {
        setNerdList(prev => {
            const index = prev.findIndex(c => c.id === char.id)
            if (index >= 0) {
                const newList = [...prev]
                newList[index] = char
                return newList
            }
            return [char, ...prev]
        })
        setListView('nerd')
        setSubMode('list')
        setEditingChar(null)
    }

    const handleSaveLore = (item: Lore) => {
        setLoreList(prev => {
            const index = prev.findIndex(c => c.id === item.id)
            if (index >= 0) {
                const newList = [...prev]
                newList[index] = item
                return newList
            }
            return [item, ...prev]
        })
        setListView('lore')
        setSubMode('list')
        setEditingChar(null)
    }

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering edit

        if (listView === 'mommy') {
            setMommyList(prev => prev.filter(c => c.id !== id))
        } else if (listView === 'nerd') {
            setNerdList(prev => prev.filter(c => c.id !== id))
        } else if (listView === 'lore') {
            setLoreList(prev => prev.filter(c => c.id !== id))
        }

        if (editingChar?.id === id) {
            setEditingChar(null)
            setSubMode('create') // Fallback if editing deleted char
        }
    }

    const handleEdit = (char: MommyCharacter | NerdCharacter | Lore) => {
        setEditingChar(char)
        setSubMode('edit')
    }

    // Search State
    const [showSearch, setShowSearch] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Filter Logic
    const filteredMommyList = mommyList.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    const filteredNerdList = nerdList.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    const filteredLoreList = loreList.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Determine current view for Toggle Button display
    const currentActiveView = subMode === 'create' ? createView : (subMode === 'list' ? listView : 'mommy')

    return (
        <div className="flex items-start justify-center max-w-5xl mx-auto relative px-4">
            {/* Main Card - Flex 1 to take available space */}
            <div className="glass-card p-6 flex-1 z-10 min-h-[600px] transition-all duration-300" style={{ borderTopRightRadius: 0 }}>
                {/* Header: Preserving justify-start and gap-6 as requested */}
                <div className="w-full mb-6 relative flex flex-col gap-2">
                    {subMode === 'edit' && editingChar ? (
                        <div className="flex items-center w-full h-full relative" style={{ height: '60px' }}>
                            <h2 className="text-2xl font-bold text-white drop-shadow-md whitespace-nowrap text-left">
                                {lang === 'en' ? 'EDITING: ' : '編集モード: '}
                                {editingChar.name}
                            </h2>
                            <button
                                className="px-6 py-4 rounded-full text-white font-bold shadow-md transition-all whitespace-nowrap border-none"
                                style={{
                                    backgroundColor: '#dc2626',
                                    color: '#ffffff',
                                    position: 'absolute',
                                    right: '0px',
                                    top: '50%',
                                    transform: 'translateY(-50%)'
                                }}
                                onClick={() => {
                                    if (window.confirm(lang === 'en' ? 'Discard changes and close?' : '編集を破棄して閉じますか？')) {
                                        setEditingChar(null)
                                        setSubMode('list')
                                    }
                                }}
                            >
                                {lang === 'en' ? 'Exit without saving' : '保存せずに終了'}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-start gap-6 items-center" style={{ height: '60px' }}>
                                <button
                                    className={`px-10 py-4 rounded-full font-bold text-xl transition-all border-none ${currentActiveView === 'mommy' ? 'bg-white text-[#FF69B4] shadow-md' : 'glass-btn text-white'}`}
                                    onClick={() => handleViewChange('mommy')}
                                >
                                    MOMMY
                                </button>
                                <button
                                    className={`px-10 py-4 rounded-full font-bold text-xl transition-all border-none ${currentActiveView === 'nerd' ? 'bg-white text-[#FF69B4] shadow-md' : 'glass-btn text-white'}`}
                                    onClick={() => handleViewChange('nerd')}
                                >
                                    NERD
                                </button>
                                <button
                                    className={`px-10 py-4 rounded-full font-bold text-xl transition-all border-none ${currentActiveView === 'lore' ? 'bg-white text-[#FF69B4] shadow-md' : 'glass-btn text-white'}`}
                                    onClick={() => handleViewChange('lore')}
                                >
                                    LORE
                                </button>

                                {/* Search Toggle Button (Only in List Mode) */}
                                {subMode === 'list' && (
                                    <>
                                        <button
                                            className={`flex items-center justify-center transition-all border-none outline-none focus:outline-none appearance-none ${showSearch ? 'scale-110' : 'hover:scale-105'}`}
                                            style={{
                                                height: '40px',
                                                width: '40px',
                                                marginLeft: '1rem',
                                                cursor: 'pointer',
                                                zIndex: 50,
                                                background: showSearch ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                                borderRadius: '50%',
                                                border: 'none',
                                                boxShadow: 'none',
                                                display: 'flex',
                                                alignSelf: 'center',
                                                color: showSearch ? '#FF69B4' : '#ffffff', // Explicit color
                                                paddingTop: '4px' // Visual centering fix
                                            }}
                                            onClick={() => {
                                                setShowSearch(!showSearch);
                                                if (!showSearch) setSearchTerm('');
                                            }}
                                            title={lang === 'en' ? "Search" : "検索"}
                                        >
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: showSearch ? 'drop-shadow(0 0 5px rgba(255, 105, 180, 0.5))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                                                <circle cx="11" cy="11" r="8"></circle>
                                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                            </svg>
                                        </button>

                                        {/* Search Input Area */}
                                        {showSearch && (
                                            <div className="animate-fadeIn" style={{ marginLeft: '1rem', flex: 1, maxWidth: '300px', marginTop: '12px' }}>
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    placeholder={lang === 'en' ? "Search by name..." : "名前で検索..."}
                                                    className="w-full px-2 py-1 bg-transparent text-white/90 placeholder-white/40 focus:outline-none transition-all font-bold text-lg search-input-custom"
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
                                                        borderRadius: '0', // Ensure no corners
                                                        outline: 'none',
                                                        boxShadow: 'none'
                                                    }}
                                                    autoFocus
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="system-content">
                    {subMode === 'create' ? (
                        // Creation Mode (Fresh)
                        createView === 'mommy' ? (
                            <FuckmeatCreator lang={lang} onSave={handleSaveMommy} />
                        ) : createView === 'nerd' ? (
                            <PenisCreator lang={lang} onSave={handleSaveNerd} />
                        ) : (
                            <LoreCreator lang={lang} onSave={handleSaveLore} />
                        )
                    ) : subMode === 'edit' && editingChar ? (
                        // Edit Mode (With Data)
                        editingChar.type === 'fuckmeat' ? (
                            <FuckmeatCreator lang={lang} onSave={handleSaveMommy} initialData={editingChar as MommyCharacter} />
                        ) : editingChar.type === 'penis' ? (
                            <PenisCreator lang={lang} onSave={handleSaveNerd} initialData={editingChar as NerdCharacter} />
                        ) : (
                            <LoreCreator lang={lang} onSave={handleSaveLore} initialData={editingChar as Lore} />
                        )
                    ) : (
                        // List Mode
                        listView === 'lore' ? (
                            <LoreList
                                lang={lang}
                                loreList={filteredLoreList}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                            />
                        ) : (
                            <CharacterList
                                lang={lang}
                                mommyList={filteredMommyList}
                                nerdList={filteredNerdList}
                                currentView={listView as 'mommy' | 'nerd'}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                            />
                        )
                    )}
                </div>
            </div>

            {/* Side Tabs (Right) - Sits outside the glass-card */}
            <div className="side-tabs-container">
                <button
                    className={`side-tab ${lang === 'en' ? 'lang-en' : ''} ${subMode === 'create' ? 'active' : ''}`}
                    onClick={() => handleSubModeChange('create')}
                >
                    {lang === 'en' ? 'CREATE' : '作成'}
                </button>
                <button
                    className={`side-tab ${lang === 'en' ? 'lang-en' : ''} ${subMode === 'list' ? 'active' : ''}`}
                    onClick={() => handleSubModeChange('list')}
                >
                    {lang === 'en' ? 'LIST' : '一覧'}
                </button>
                {editingChar && (
                    <button
                        className={`side-tab ${lang === 'en' ? 'lang-en' : ''} ${subMode === 'edit' ? 'active' : ''} relative`}
                        onClick={() => handleSubModeChange('edit')}
                    >
                        {lang === 'en' ? 'EDIT' : '編集'}
                        <div
                            className="tab-close-btn"
                            onClick={(e) => {
                                e.stopPropagation()
                                if (window.confirm(lang === 'en' ? 'Discard changes and close?' : '編集を破棄して閉じますか？')) {
                                    setEditingChar(null)
                                    setSubMode('list')
                                }
                            }}
                            title={lang === 'en' ? "Close" : "閉じる"}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </div>
                    </button>
                )}
            </div>
        </div>
    )
}
