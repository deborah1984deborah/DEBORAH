import { useState, useEffect } from 'react';

export const useWombSettings = () => {
    // Settings State
    const [wombOutputLength, setWombOutputLength] = useState<number>(() => {
        const stored = localStorage.getItem('womb_output_length');
        return stored ? Number(stored) : 1000;
    });

    const [cordOutputLength, setCordOutputLength] = useState<number>(() => {
        const stored = localStorage.getItem('cord_output_length');
        return stored ? Number(stored) : 300;
    });

    const [wombContextLength, setWombContextLength] = useState<number>(() => {
        const stored = localStorage.getItem('womb_context_length');
        return stored ? Number(stored) : 10000;
    });

    const [keywordScanRange, setKeywordScanRange] = useState<number>(() => {
        const stored = localStorage.getItem('womb_keyword_scan_range');
        return stored ? Number(stored) : 10000;
    });

    const [activeCordHistoryInterval, setActiveCordHistoryInterval] = useState<number>(() => {
        const stored = localStorage.getItem('womb_active_cord_history_interval');
        return stored ? Number(stored) : 10000;
    });

    const [showSettings, setShowSettings] = useState<boolean>(false);

    const [showDebugInfo, setShowDebugInfo] = useState<boolean>(() => {
        const stored = localStorage.getItem('cord_debug_info');
        return stored === 'true';
    });

    const [showWombDebugInfo, setShowWombDebugInfo] = useState<boolean>(() => {
        const stored = localStorage.getItem('womb_debug_info');
        return stored === 'true';
    });

    // API Keys
    const [apiKey, setApiKey] = useState<string>(''); // Gemini
    // TMDB Access Token
    const [tmdbAccessToken, setTmdbAccessToken] = useState<string>('');

    // AI Model
    const [aiModel, setAiModel] = useState<'gemini-2.5-flash' | 'gemini-3.1-pro-preview'>(() => {
        const stored = localStorage.getItem('womb_ai_model');
        return (stored as 'gemini-2.5-flash' | 'gemini-3.1-pro-preview') || 'gemini-2.5-flash';
    });

    // Load API Keys on mount (localStorage > .env)
    useEffect(() => {
        // Gemini
        const storedKey = localStorage.getItem('womb_gemini_api_key');
        if (storedKey) {
            setApiKey(storedKey);
        } else {
            const envKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (envKey) setApiKey(envKey);
        }

        // TMDB
        const storedTmdbToken = localStorage.getItem('womb_tmdb_access_token');
        if (storedTmdbToken) {
            setTmdbAccessToken(storedTmdbToken);
        } else {
            const envTmdbToken = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
            if (envTmdbToken) setTmdbAccessToken(envTmdbToken);
        }
    }, []);

    // Save Settings when changed
    useEffect(() => {
        if (apiKey) localStorage.setItem('womb_gemini_api_key', apiKey);
    }, [apiKey]);

    useEffect(() => {
        if (tmdbAccessToken) localStorage.setItem('womb_tmdb_access_token', tmdbAccessToken);
    }, [tmdbAccessToken]);

    useEffect(() => {
        localStorage.setItem('womb_ai_model', aiModel);
    }, [aiModel]);

    useEffect(() => {
        localStorage.setItem('womb_output_length', wombOutputLength.toString());
    }, [wombOutputLength]);

    useEffect(() => {
        localStorage.setItem('cord_output_length', cordOutputLength.toString());
    }, [cordOutputLength]);

    useEffect(() => {
        localStorage.setItem('womb_context_length', wombContextLength.toString());
    }, [wombContextLength]);

    useEffect(() => {
        localStorage.setItem('womb_keyword_scan_range', keywordScanRange.toString());
    }, [keywordScanRange]);

    useEffect(() => {
        localStorage.setItem('womb_active_cord_history_interval', activeCordHistoryInterval.toString());
    }, [activeCordHistoryInterval]);

    useEffect(() => {
        localStorage.setItem('cord_debug_info', showDebugInfo.toString());
    }, [showDebugInfo]);

    useEffect(() => {
        localStorage.setItem('womb_debug_info', showWombDebugInfo.toString());
    }, [showWombDebugInfo]);

    return {
        wombOutputLength, setWombOutputLength,
        cordOutputLength, setCordOutputLength,
        wombContextLength, setWombContextLength,
        keywordScanRange, setKeywordScanRange,
        activeCordHistoryInterval, setActiveCordHistoryInterval,
        showSettings, setShowSettings,
        showDebugInfo, setShowDebugInfo,
        showWombDebugInfo, setShowWombDebugInfo,
        apiKey, setApiKey,
        tmdbAccessToken, setTmdbAccessToken,
        aiModel, setAiModel
    };
};
