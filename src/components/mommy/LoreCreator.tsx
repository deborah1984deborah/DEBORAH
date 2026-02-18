import { useState } from 'react'
import { Lore } from '../../types'

type Props = {
    lang: 'ja' | 'en'
    onSave: (lore: Lore) => void
    initialData?: Lore
}

type Translations = {
    title: string
    editTitle: string
    name: string
    keywords: string
    summary: string // 概要
    isAlwaysActive: string
    submit: string
    update: string
    required: string
}

const translations: Record<'ja' | 'en', Translations> = {
    en: {
        title: 'Lore Creator',
        editTitle: 'Edit Lore',
        name: 'Name / Title',
        keywords: 'Keywords',
        summary: 'Summary / Content',
        isAlwaysActive: 'Always Active',
        submit: 'Create Lore',
        update: 'Update Lore',
        required: 'Required item'
    },
    ja: {
        title: 'Lore Creator',
        editTitle: 'Loreを編集',
        name: '名前 / タイトル',
        keywords: 'キーワード',
        summary: '概要 / 内容',
        isAlwaysActive: '常時有効 (Always Active)',
        submit: 'Loreを作成',
        update: 'Loreを更新',
        required: '必須項目です'
    }
}

export function LoreCreator({ lang, onSave, initialData }: Props) {
    const t = translations[lang]
    const [errors, setErrors] = useState<Record<string, boolean>>({})

    const [formData, setFormData] = useState({
        name: '',
        summary: '',
        isAlwaysActive: false
    })
    const [keywordsInput, setKeywordsInput] = useState('')

    // Populate form when initialData changes
    useState(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                summary: initialData.summary,
                isAlwaysActive: initialData.isAlwaysActive
            })
            setKeywordsInput(initialData.keywords ? initialData.keywords.join(', ') : '')
        }
    })

    // Update form when initialData prop updates (e.g. switching characters)
    const [prevId, setPrevId] = useState<string | undefined>(initialData?.id)
    if (initialData?.id !== prevId) {
        setPrevId(initialData?.id)
        if (initialData) {
            setFormData({
                name: initialData.name,
                summary: initialData.summary,
                isAlwaysActive: initialData.isAlwaysActive
            })
            setKeywordsInput(initialData.keywords ? initialData.keywords.join(', ') : '')
        } else {
            setFormData({
                name: '',
                summary: '',
                isAlwaysActive: false
            })
            setKeywordsInput('')
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        // Checkbox handling needed? No, checkbox uses type="checkbox" which needs e.target.checked
        // We acturally need separate handler or check type
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target
        setFormData(prev => ({ ...prev, [name]: checked }))
    }

    const handleSubmit = () => {
        const newErrors: Record<string, boolean> = {}

        if (!formData.name.trim()) newErrors.name = true
        if (!formData.summary.trim()) newErrors.summary = true
        if (!keywordsInput.trim()) newErrors.keywordsInput = true

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        const keywords = keywordsInput.split(',').map(k => k.trim()).filter(k => k !== '')

        const newLore: Lore = {
            id: initialData?.id || crypto.randomUUID(),
            type: 'lore',
            name: formData.name,
            summary: formData.summary,
            isAlwaysActive: formData.isAlwaysActive,
            keywords: keywords,
            createdAt: initialData?.createdAt || Date.now()
        }
        onSave(newLore)

        if (!initialData) {
            setFormData({
                name: '',
                summary: '',
                isAlwaysActive: false
            })
            setKeywordsInput('')
        }
    }

    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Manrope, sans-serif', marginTop: '-0.5rem' }}>
                {initialData ? t.editTitle : t.title}
            </h2>

            <div className="form-group mb-4 relative">
                <label className="block mb-2 font-bold">{t.name}</label>
                {errors.name && <div className="error-tooltip">{t.required}</div>}
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="glass-input w-full p-2 rounded"
                />
            </div>

            <div className="form-group mb-4 relative">
                <label className="block mb-2 font-bold">{t.keywords}</label>
                {errors.keywordsInput && <div className="error-tooltip">{t.required}</div>}
                <input
                    type="text"
                    name="keywordsInput"
                    value={keywordsInput}
                    onChange={(e) => {
                        setKeywordsInput(e.target.value)
                        if (errors.keywordsInput) {
                            setErrors(prev => {
                                const newErrors = { ...prev }
                                delete newErrors.keywordsInput
                                return newErrors
                            })
                        }
                    }}
                    className="glass-input w-full p-2 rounded"
                    placeholder={lang === 'en' ? "Comma separated keywords..." : "キーワードをカンマ区切りで入力..."}
                />
            </div>

            <div className="form-group mb-6 relative">
                <label className="block mb-2 font-bold">{t.summary}</label>
                {errors.summary && <div className="error-tooltip">{t.required}</div>}
                <textarea
                    name="summary"
                    value={formData.summary}
                    onChange={handleChange}
                    className="glass-input w-full p-2 rounded h-32"
                    placeholder={lang === 'en' ? "Enter lore summary..." : "Loreの概要を入力..."}
                />
            </div>

            <div className="form-group mb-6 relative flex items-center justify-start w-full gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <span className="font-bold cursor-pointer select-none" onClick={() => document.getElementById('isAlwaysActive')?.click()}>
                    {t.isAlwaysActive}
                </span>
                <div className="relative inline-block w-[52px] h-[28px] shrink-0">
                    <input
                        type="checkbox"
                        id="isAlwaysActive"
                        name="isAlwaysActive"
                        checked={formData.isAlwaysActive}
                        onChange={handleCheckboxChange}
                        className="toggle-checkbox"
                    />
                    <label htmlFor="isAlwaysActive" className="toggle-label"></label>
                </div>
            </div>

            <button
                className="btn-solid-white w-full py-5 font-bold rounded text-2xl"
                onClick={handleSubmit}
            >
                {initialData ? t.update : t.submit}
            </button>
        </div>
    )
}
