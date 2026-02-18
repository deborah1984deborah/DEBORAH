import { Lore } from '../../types'

type Props = {
    lang: 'ja' | 'en'
    loreList: Lore[]
    onDelete: (id: string, e: React.MouseEvent) => void
    onEdit: (lore: Lore) => void
}

export function LoreList({ lang, loreList, onDelete, onEdit }: Props) {
    if (loreList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/60">
                <p className="text-lg">
                    {lang === 'en' ? 'No Lore created yet.' : 'まだLoreが作成されていません。'}
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-2 header-adjustment">
            {loreList.map((lore) => (
                <div
                    key={lore.id}
                    className="glass-card p-4 pb-6 flex gap-4 items-start relative pr-12 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => onEdit(lore)}
                >
                    {/* Date - Absolute Positioned */}
                    <span className="absolute top-4 right-4 text-xs opacity-60">
                        {new Date(lore.createdAt).toLocaleDateString()}
                    </span>

                    {/* Icon */}
                    <div className="text-3xl shrink-0">
                        📜
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 pr-12">
                            <h3 className="text-xl font-bold truncate">{lore.name}</h3>
                            {lore.isAlwaysActive && (
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    lineHeight: '1',
                                    whiteSpace: 'nowrap',
                                    alignSelf: 'center'
                                }}>
                                    <span style={{
                                        display: 'block',
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        backgroundColor: '#4ade80',
                                        boxShadow: '0 0 6px rgba(74, 222, 128, 0.8)',
                                        flexShrink: 0
                                    }}></span>
                                    ALWAYS ACTIVE
                                </span>
                            )}
                        </div>

                        <div className="text-sm opacity-80 space-y-1">
                            <div className="line-clamp-2 mb-2 italic bg-black/10 p-1 rounded">
                                {lore.summary}
                            </div>

                            {lore.keywords && lore.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {lore.keywords.map((k, i) => (
                                        <span key={i} className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                                            #{k}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Delete Button */}
                    <button
                        className="delete-btn"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm(lang === 'en' ? 'Are you sure you want to delete this Lore?' : '本当に削除しますか？')) {
                                onDelete(lore.id, e)
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
