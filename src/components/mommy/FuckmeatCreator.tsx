import { useState } from 'react'
import { Fuckmeat } from '../../types'
import { CelebrityVerificationModal } from './CelebrityVerificationModal';

type Props = {
    lang: 'ja' | 'en'
    onSave: (character: Fuckmeat) => void
    initialData?: Fuckmeat
}

type Translations = {
    title: string
    editTitle: string
    name: string
    face: string
    age: string
    height: string
    measurements: string
    bust: string
    waist: string
    hip: string
    history: string
    submit: string
    update: string
    keywords: string
    required: string
}

const translations: Record<'ja' | 'en', Translations> = {
    en: {
        title: 'Fuckmeat Creator (MOMMY)',
        editTitle: 'Edit MOMMY',
        name: 'Name',
        face: 'Face (Celebrity)',
        age: 'Age',
        height: 'Height (cm)',
        measurements: 'Measurements (cm)',
        bust: 'Bust',
        waist: 'Waist',
        hip: 'Hip',
        history: 'History / Background',
        submit: 'Create MOMMY',
        update: 'Update MOMMY',
        keywords: 'Keywords',
        required: 'Required item'
    },
    ja: {
        title: 'Fuckmeat Creator (MOMMY)',
        editTitle: 'MOMMYを編集',
        name: '名前',
        face: '顔 (有名人)',
        age: '年齢',
        height: '身長 (cm)',
        measurements: 'スリーサイズ (cm)',
        bust: 'バスト',
        waist: 'ウエスト',
        hip: 'ヒップ',
        history: '経歴 / 生い立ち',
        submit: 'MOMMYを作成',
        update: 'MOMMYを更新',
        keywords: 'キーワード',
        required: '必須項目です'
    }
}

export function FuckmeatCreator({ lang, onSave, initialData }: Props) {
    const t = translations[lang]
    const [errors, setErrors] = useState<Record<string, boolean>>({})
    const [formData, setFormData] = useState({
        name: '',
        face: '',
        age: '',
        height: '',
        bust: '',
        waist: '',
        hip: '',
        history: ''
    })
    const [keywordsInput, setKeywordsInput] = useState('')

    // Verification State
    const [showVerification, setShowVerification] = useState(false);
    const [pendingData, setPendingData] = useState<Fuckmeat | null>(null);

    // Populate form when initialData changes
    useState(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                face: initialData.face,
                age: initialData.age,
                height: initialData.height,
                bust: initialData.bust,
                waist: initialData.waist,
                hip: initialData.hip,
                history: initialData.history
            })
            setKeywordsInput(initialData.keywords ? initialData.keywords.join(', ') : '')
        }
    })

    // Update form when initialData prop updates (e.g. switching characters)
    // Using a key on the component in parent is better, but this works too
    const [prevId, setPrevId] = useState<string | undefined>(initialData?.id)
    if (initialData?.id !== prevId) {
        setPrevId(initialData?.id)
        if (initialData) {
            setFormData({
                name: initialData.name,
                face: initialData.face,
                age: initialData.age,
                height: initialData.height,
                bust: initialData.bust,
                waist: initialData.waist,
                hip: initialData.hip,
                history: initialData.history
            })
            setKeywordsInput(initialData.keywords ? initialData.keywords.join(', ') : '')
        } else {
            setFormData({
                name: '',
                face: '',
                age: '',
                height: '',
                bust: '',
                waist: '',
                hip: '',
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
        const requiredFields = ['name', 'face', 'age', 'height', 'bust', 'waist', 'hip', 'history']

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

        const newCharacter: Fuckmeat = {
            id: initialData?.id || crypto.randomUUID(),
            type: 'fuckmeat',
            ...formData,
            keywords: keywords,
            createdAt: initialData?.createdAt || Date.now()
        }

        // Verification Logic
        // If face is changed or it's a new character, trigger verification
        const isFaceChanged = !initialData || initialData.face !== formData.face;

        if (isFaceChanged && formData.face.trim() !== '') {
            setPendingData(newCharacter);
            setShowVerification(true);
        } else {
            onSave(newCharacter);
            resetForm();
        }
    }

    const handleConfirmVerification = () => {
        if (pendingData) {
            onSave(pendingData);
            setShowVerification(false);
            setPendingData(null);
            resetForm();
        }
    }

    const resetForm = () => {
        if (!initialData) {
            setFormData({
                name: '',
                face: '',
                age: '',
                height: '',
                bust: '',
                waist: '',
                hip: '',
                history: ''
            })
            setKeywordsInput('')
        }
    }

    return (
        <div className="fuckmeat-creator">
            <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Manrope, sans-serif', marginTop: '-0.5rem' }}>
                {t.title}
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
                <label className="block mb-2 font-bold">{t.face}</label>
                {errors.face && <div className="error-tooltip">{t.required}</div>}
                <input
                    type="text"
                    name="face"
                    value={formData.face}
                    onChange={handleChange}
                    className="glass-input w-full p-2 rounded"
                    placeholder={lang === 'en' ? "Enter female celebrity name" : "女性有名人の名前を入力"}
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
                <label className="block mb-2 font-bold">{t.height}</label>
                {errors.height && <div className="error-tooltip">{t.required}</div>}
                <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className="glass-input w-full p-2 rounded"
                />
            </div>

            <div className="mb-4 relative">
                <label className="block mb-2 font-bold">{t.measurements}</label>
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        {errors.bust && <div className="error-tooltip">{t.required}</div>}
                        <input
                            type="number"
                            name="bust"
                            value={formData.bust}
                            onChange={handleChange}
                            className="glass-input w-full p-2 rounded"
                            placeholder={t.bust}
                        />
                    </div>
                    <div className="flex-1 relative">
                        {errors.waist && <div className="error-tooltip">{t.required}</div>}
                        <input
                            type="number"
                            name="waist"
                            value={formData.waist}
                            onChange={handleChange}
                            className="glass-input w-full p-2 rounded"
                            placeholder={t.waist}
                        />
                    </div>
                    <div className="flex-1 relative">
                        {errors.hip && <div className="error-tooltip">{t.required}</div>}
                        <input
                            type="number"
                            name="hip"
                            value={formData.hip}
                            onChange={handleChange}
                            className="glass-input w-full p-2 rounded"
                            placeholder={t.hip}
                        />
                    </div>
                </div>
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
                {t.submit}
            </button>

            <CelebrityVerificationModal
                isOpen={showVerification}
                onClose={() => {
                    setShowVerification(false);
                    setPendingData(null);
                }}
                onConfirm={handleConfirmVerification}
                celebrityName={pendingData?.face || ''}
                lang={lang}
                apiKey={localStorage.getItem('womb_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY}
                tmdbAccessToken={localStorage.getItem('womb_tmdb_access_token') || import.meta.env.VITE_TMDB_ACCESS_TOKEN}
            />
        </div>
    )
}
