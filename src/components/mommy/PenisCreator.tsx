import { useState } from 'react'
import { Penis } from '../../types'

type Props = {
    lang: 'ja' | 'en'
    onSave: (character: Penis) => void
    initialData?: Penis
}

type Translations = {
    title: string
    editTitle: string
    name: string
    age: string
    history: string
    submit: string
    update: string
    keywords: string
    required: string
}

const translations: Record<'ja' | 'en', Translations> = {
    en: {
        title: 'Penis Creator (NERD)',
        editTitle: 'Edit NERD',
        name: 'Name',
        age: 'Age',
        history: 'History / Background',
        submit: 'Create NERD',
        update: 'Update NERD',
        keywords: 'Keywords',
        required: 'Required item'
    },
    ja: {
        title: 'Penis Creator (NERD)',
        editTitle: 'NERDを編集',
        name: '名前',
        age: '年齢',
        history: '経歴 / 生い立ち',
        submit: 'NERDを作成',
        update: 'NERDを更新',
        keywords: 'キーワード',
        required: '必須項目です'
    }
}

export function PenisCreator({ lang, onSave, initialData }: Props) {
    const t = translations[lang]
    const [errors, setErrors] = useState<Record<string, boolean>>({})
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        history: ''
    })
    const [keywordsInput, setKeywordsInput] = useState('')

    // Populate form when initialData changes
    useState(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                age: initialData.age,
                history: initialData.history
            })
            setKeywordsInput(initialData.keywords ? initialData.keywords.join(', ') : '')
        }
    })

    const [prevId, setPrevId] = useState<string | undefined>(initialData?.id)
    if (initialData?.id !== prevId) {
        setPrevId(initialData?.id)
        if (initialData) {
            setFormData({
                name: initialData.name,
                age: initialData.age,
                history: initialData.history
            })
            setKeywordsInput(initialData.keywords ? initialData.keywords.join(', ') : '')
        } else {
            setFormData({
                name: '',
                age: '',
                history: ''
            })
            setKeywordsInput('')
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    const handleSubmit = () => {
        const newErrors: Record<string, boolean> = {}
        const requiredFields = ['name', 'age', 'history']

        requiredFields.forEach(field => {
            if (!formData[field as keyof typeof formData]) {
                newErrors[field] = true
            }
        })

        if (!keywordsInput.trim()) {
            newErrors.keywordsInput = true
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        const keywords = keywordsInput.split(',').map(k => k.trim()).filter(k => k !== '')

        const newCharacter: Penis = {
            id: initialData?.id || crypto.randomUUID(),
            type: 'penis',
            ...formData,
            keywords: keywords,
            createdAt: initialData?.createdAt || Date.now()
        }
        onSave(newCharacter)

        if (!initialData) {
            setFormData({
                name: '',
                age: '',
                history: ''
            })
            setKeywordsInput('')
        }
    }

    return (
        <div className="penis-creator">
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
                    placeholder={lang === 'en' ? "Enter name" : "名前を入力"}
                />
            </div>

            <div className="form-group mb-4 relative">
                <label className="block mb-2 font-bold">{t.age}</label>
                {errors.age && <div className="error-tooltip">{t.required}</div>}
                <input
                    type="number"
                    name="age"
                    value={formData.age}
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
                <label className="block mb-2 font-bold">{t.history}</label>
                {errors.history && <div className="error-tooltip">{t.required}</div>}
                <textarea
                    name="history"
                    value={formData.history}
                    onChange={handleChange}
                    className="glass-input w-full p-2 rounded h-32"
                    placeholder={lang === 'en' ? "Enter character history..." : "キャラクターの経歴を入力..."}
                />
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
