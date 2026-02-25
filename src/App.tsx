import { useState, useEffect } from 'react'
import { MommySystem } from './components/mommy/MommySystem'
import { WombSystem } from './components/womb/WombSystem'
import { ApiKeyWarning } from './components/shared/ApiKeyWarning';
import './styles/global.css';

function App() {
    const [lang, setLang] = useState<'ja' | 'en'>(() => {
        const savedLang = localStorage.getItem('deborah_lang')
        return (savedLang === 'ja' || savedLang === 'en') ? savedLang : 'ja'
    })

    const handleSetLang = (newLang: 'ja' | 'en') => {
        setLang(newLang)
        localStorage.setItem('deborah_lang', newLang)
    }

    const [showSplash, setShowSplash] = useState(true)
    const [currentSystem, setCurrentSystem] = useState<'MOMMY' | 'WOMB'>('MOMMY')
    const [transitionStage, setTransitionStage] = useState<'idle' | 'active' | 'fading'>('idle')
    const [transitionType, setTransitionType] = useState<'to-WOMB' | 'to-MOMMY' | null>(null)

    // Splash screen timer
    // Text fade ends: 1.0s
    // BG fade starts: 0.6s, ends: 1.0s
    // Unmount safely after 1.2s
    if (showSplash) {
        setTimeout(() => {
            setShowSplash(false)
        }, 1200)
    }

    const handleSystemSwitch = () => {
        if (transitionStage !== 'idle') return

        const nextSystem = currentSystem === 'MOMMY' ? 'WOMB' : 'MOMMY'
        setTransitionType(nextSystem === 'WOMB' ? 'to-WOMB' : 'to-MOMMY')

        // 1. Start Wipe
        setTransitionStage('active')

        // 2. Switch System AFTER wipe completes (800ms)
        setTimeout(() => {
            setCurrentSystem(nextSystem)

            // 3. Fade out overlay
            setTransitionStage('fading')

            // 4. Cleanup after fade (500ms fade)
            setTimeout(() => {
                setTransitionStage('idle')
                setTransitionType(null)
            }, 500)
        }, 850) // Wait slightly longer than 0.8s animation to be safe
    }

    const title = currentSystem === 'MOMMY' ? 'DEBORAH' : 'WOMB'
    const systemColor = currentSystem === 'MOMMY' ? 'white' : 'white'
    const appBackground = currentSystem === 'MOMMY' ? '#FF69B4' : '#0a0047'
    const buttonText = currentSystem === 'MOMMY' ? 'WOMB' : 'MOMMY'
    // Dynamic style for button based on system
    const buttonStyle: React.CSSProperties = currentSystem === 'WOMB'
        ? {
            backgroundColor: '#FF69B4',
            color: 'white',
            borderColor: 'transparent',
            bottom: '5%',
            right: '3.5%'
        }
        : {}

    // Sync body background to prevent pink bleed when content pushes past 100vh
    useEffect(() => {
        document.body.style.backgroundColor = appBackground;
        document.body.style.transition = 'background-color 0.5s ease-in-out';
        document.documentElement.style.backgroundColor = appBackground;
        document.documentElement.style.transition = 'background-color 0.5s ease-in-out';
    }, [appBackground]);

    // Determine overlay color class based on transition direction
    const overlayClass = transitionType === 'to-MOMMY' ? 'pink' : ''

    return (
        <>
            {showSplash && (
                <div className="splash-screen">
                    <div className="splash-content">
                        <h1 className="splash-title">DEBORAH</h1>
                    </div>
                </div>
            )}

            {/* Transition Overlay */}
            <div className={`transition-overlay ${transitionStage} ${overlayClass}`} />

            <div className="app-container" style={{
                opacity: showSplash ? 0 : 1,
                transition: 'opacity 0.5s ease-in-out, background-color 0.5s ease-in-out',
                backgroundColor: appBackground,
                minHeight: '100vh',
                color: systemColor
            }}>
                <header style={{ backgroundColor: 'transparent', transition: 'background-color 0.5s ease-in-out' }}>
                    <h1 style={{ color: systemColor, transition: 'color 0.3s' }}>{title}</h1>
                    <div className={`lang-toggle ${lang} ${currentSystem}`}>
                        <div className="slider"></div>
                        <button
                            className={`lang-btn ${lang === 'ja' ? 'active' : ''}`}
                            onClick={() => handleSetLang('ja')}
                        >
                            Japanese (日本語)
                        </button>
                        <button
                            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                            onClick={() => handleSetLang('en')}
                        >
                            English
                        </button>
                    </div>
                </header>
                <main style={{ padding: '2rem 1rem' }}>
                    {currentSystem === 'MOMMY' ? (
                        <MommySystem lang={lang} />
                    ) : (
                        <WombSystem lang={lang} />
                    )}
                </main>

                {/* API Key Warning (Visual Only) */}
                <ApiKeyWarning currentSystem={currentSystem} />

                {/* System Switch Button */}
                <button
                    className="womb-button"
                    onClick={handleSystemSwitch}
                    style={buttonStyle}
                >
                    {buttonText}
                </button>
            </div>
        </>
    )
}

export default App
