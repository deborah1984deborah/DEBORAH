import { MommyCharacter, NerdCharacter } from '../../types'

type Props = {
    lang: 'ja' | 'en'
    mommyList: MommyCharacter[]
    nerdList: NerdCharacter[]
    currentView: 'mommy' | 'nerd'
    onDelete: (id: string, e: React.MouseEvent) => void
    onEdit: (char: MommyCharacter | NerdCharacter) => void
}

export function CharacterList({ lang, mommyList, nerdList, currentView, onDelete, onEdit }: Props) {
    const list = currentView === 'mommy' ? mommyList : nerdList

    if (list.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/60">
                <p className="text-lg">
                    {lang === 'en' ? 'No characters created yet.' : 'まだキャラクターが作成されていません。'}
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-2 header-adjustment">
            {list.map((char) => (
                <div
                    key={char.id}
                    className="glass-card p-4 pb-6 flex gap-4 items-start relative pr-12 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => onEdit(char)}
                >
                    {/* Date - Absolute Positioned */}
                    <span className="absolute top-4 right-4 text-xs opacity-60">
                        {new Date(char.createdAt).toLocaleDateString()}
                    </span>

                    {/* Icon */}
                    <div className="text-3xl shrink-0">
                        {char.type === 'fuckmeat' ? '👱‍♀️' : '👱‍♂️'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0" style={{ paddingRight: '70px' }}>
                        <h3 className="text-xl font-bold mb-2 truncate">{char.name}</h3>

                        {currentView === 'mommy' ? (
                            <div className="text-sm opacity-80 space-y-1">
                                {(char as MommyCharacter).face && (
                                    <div className="info-row">
                                        <span className="info-label">{lang === 'en' ? 'Face:' : '顔:'}</span>
                                        <span className="truncate flex-1">{(char as MommyCharacter).face}</span>
                                    </div>
                                )}
                                <div className="info-row">
                                    <span className="info-label">{lang === 'en' ? 'Age:' : '年齢:'}</span>
                                    <span>{(char as MommyCharacter).age}{lang === 'ja' ? '歳' : ''}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">{lang === 'en' ? 'Height:' : '身長:'}</span>
                                    <span>{(char as MommyCharacter).height}cm</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">{lang === 'en' ? 'Measurements:' : 'スリーサイズ:'}</span>
                                    <span className="text-sm">
                                        B:{(char as MommyCharacter).bust}cm W:{(char as MommyCharacter).waist}cm H:{(char as MommyCharacter).hip}cm
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm opacity-80 space-y-2">
                                <div className="info-row">
                                    <span className="info-label">{lang === 'en' ? 'Age:' : '年齢:'}</span>
                                    <span>{(char as NerdCharacter).age}{lang === 'ja' ? '歳' : ''}</span>
                                </div>
                                <div className="line-clamp-2 italic bg-black/10 p-1.5 rounded text-xs mt-1">
                                    {(char as NerdCharacter).history}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Delete Button */}
                    <button
                        className="delete-btn"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm(lang === 'en' ? 'Are you sure you want to delete this character?' : '本当に削除しますか？')) {
                                onDelete(char.id, e)
                            }
                        }}
                        title={lang === 'en' ? "Delete" : "削除"}
                    >
                        🗑️
                    </button>
                </div>
            ))}
        </div>
    )
}
