import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { WombSafetyModal } from './WombSafetyModal';
import { ActiveCordSettingsModal } from './ActiveCordSettingsModal';
import { ThinkingSettingsModal } from './ThinkingSettingsModal';

import { SettingsOutputLength } from './SettingsOutputLength';
import { SettingsAiModel } from './SettingsAiModel';
import { SettingsContextScan } from './SettingsContextScan';
import { SettingsAdvancedToggles } from './SettingsAdvancedToggles';
import { SettingsApiKeys } from './SettingsApiKeys';

interface WombSettingsPanelProps {
    showSettings: boolean;
    lang: 'ja' | 'en';
    wombOutputLength: number;
    setWombOutputLength: (length: number) => void;
    cordOutputLength: number;
    setCordOutputLength: (length: number) => void;
    wombContextLength: number;
    setWombContextLength: (length: number) => void;
    keywordScanRange: number;
    setKeywordScanRange: (length: number) => void;
    activeCordHistoryInterval: number;
    setActiveCordHistoryInterval: (interval: number) => void;
    isCordActiveModeEnabled: boolean;
    setIsCordActiveModeEnabled: (enabled: boolean) => void;
    showDebugInfo: boolean;
    setShowDebugInfo: (show: boolean) => void;
    showWombDebugInfo: boolean;
    setShowWombDebugInfo: (show: boolean) => void;
    apiKey: string;
    setApiKey: (key: string) => void;
    tmdbAccessToken: string;
    setTmdbAccessToken: (token: string) => void;
    aiModel: 'gemini-2.5-flash' | 'gemini-3.1-pro-preview';
    setAiModel: (model: 'gemini-2.5-flash' | 'gemini-3.1-pro-preview') => void;
    aiThinkingLevel: 'low' | 'medium' | 'high';
    setAiThinkingLevel: (level: 'low' | 'medium' | 'high') => void;
    anchorRef: React.RefObject<HTMLButtonElement>;
}

export const WombSettingsPanel: React.FC<WombSettingsPanelProps> = ({
    showSettings,
    lang,
    wombOutputLength,
    setWombOutputLength,
    cordOutputLength,
    setCordOutputLength,
    wombContextLength,
    setWombContextLength,
    keywordScanRange,
    setKeywordScanRange,
    activeCordHistoryInterval,
    setActiveCordHistoryInterval,
    isCordActiveModeEnabled,
    setIsCordActiveModeEnabled,
    showDebugInfo,
    setShowDebugInfo,
    showWombDebugInfo,
    setShowWombDebugInfo,
    apiKey,
    setApiKey,
    tmdbAccessToken,
    setTmdbAccessToken,
    aiModel,
    setAiModel,
    aiThinkingLevel,
    setAiThinkingLevel,
    anchorRef
}) => {
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [isFront, setIsFront] = useState(false);

    // Modals
    const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
    const [isThinkingModalOpen, setIsThinkingModalOpen] = useState(false);
    const [isCordSettingsModalOpen, setIsCordSettingsModalOpen] = useState(false);

    useEffect(() => {
        if (!showSettings) {
            setIsFront(false);
        }
    }, [showSettings]);

    useEffect(() => {
        const updateCoords = () => {
            if (anchorRef.current) {
                const rect = anchorRef.current.getBoundingClientRect();
                setCoords({
                    top: window.scrollY + rect.top,
                    left: window.scrollX + rect.right + 8
                });
            }
        };

        if (showSettings) {
            updateCoords();
        }

        window.addEventListener('resize', updateCoords);
        return () => window.removeEventListener('resize', updateCoords);
    }, [anchorRef, showSettings]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <>
            <div
                onClick={() => setIsFront(true)}
                style={{
                    position: 'absolute',
                    top: coords.top,
                    left: coords.left,
                    width: '280px',
                    backgroundColor: 'rgba(26, 26, 32, 0.95)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '8px',
                    padding: '1rem',
                    zIndex: isFront ? 10000 : 9996,
                    backdropFilter: 'blur(10px)',
                    boxShadow: isFront ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 4px 12px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    opacity: showSettings ? 1 : 0,
                    transform: showSettings ? 'translateX(0)' : 'translateX(-10px)',
                    pointerEvents: showSettings ? 'auto' : 'none',
                    transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                <div style={{
                    borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                    paddingBottom: '0.5rem',
                    marginBottom: '0.5rem',
                    color: '#38bdf8',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.05em'
                }}>
                    AI CONFIGURATION
                </div>

                <SettingsOutputLength
                    lang={lang}
                    wombOutputLength={wombOutputLength}
                    setWombOutputLength={setWombOutputLength}
                    cordOutputLength={cordOutputLength}
                    setCordOutputLength={setCordOutputLength}
                />

                <SettingsAiModel
                    lang={lang}
                    aiModel={aiModel}
                    setAiModel={setAiModel}
                    aiThinkingLevel={aiThinkingLevel}
                    onEditThinking={(e) => { e.stopPropagation(); setIsThinkingModalOpen(true); }}
                />

                <SettingsContextScan
                    lang={lang}
                    wombContextLength={wombContextLength}
                    setWombContextLength={setWombContextLength}
                    keywordScanRange={keywordScanRange}
                    setKeywordScanRange={setKeywordScanRange}
                />

                <SettingsAdvancedToggles
                    lang={lang}
                    isCordActiveModeEnabled={isCordActiveModeEnabled}
                    setIsCordActiveModeEnabled={setIsCordActiveModeEnabled}
                    showWombDebugInfo={showWombDebugInfo}
                    setShowWombDebugInfo={setShowWombDebugInfo}
                    showDebugInfo={showDebugInfo}
                    setShowDebugInfo={setShowDebugInfo}
                    onEditSafety={(e) => { e.stopPropagation(); setIsSafetyModalOpen(true); }}
                    onEditActiveCordSettings={(e) => { e.stopPropagation(); setIsCordSettingsModalOpen(true); }}
                />

                <SettingsApiKeys
                    lang={lang}
                    apiKey={apiKey}
                    setApiKey={setApiKey}
                    tmdbAccessToken={tmdbAccessToken}
                    setTmdbAccessToken={setTmdbAccessToken}
                />
            </div>

            <WombSafetyModal isOpen={isSafetyModalOpen} onClose={() => setIsSafetyModalOpen(false)} lang={lang} />
            <ThinkingSettingsModal
                isOpen={isThinkingModalOpen}
                onClose={() => setIsThinkingModalOpen(false)}
                lang={lang}
                aiThinkingLevel={aiThinkingLevel}
                setAiThinkingLevel={setAiThinkingLevel}
            />
            <ActiveCordSettingsModal
                isOpen={isCordSettingsModalOpen}
                onClose={() => setIsCordSettingsModalOpen(false)}
                lang={lang}
                activeCordHistoryInterval={activeCordHistoryInterval}
                setActiveCordHistoryInterval={setActiveCordHistoryInterval}
            />
        </>,
        document.body
    );
};
