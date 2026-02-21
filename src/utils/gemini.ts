
// Gemini API Configuration
// Gemini API Configuration (Updated for 2026 - Gemini 2.5 & 3.1)
import { SafetySetting } from '../components/womb/WombSafetyModal';

export type GeminiModel = 'gemini-2.5-flash' | 'gemini-3.1-pro-preview';
const getGeminiUrl = (model: GeminiModel) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const getSafetySettings = (): SafetySetting[] | undefined => {
    const stored = localStorage.getItem('womb_safety_settings');
    if (stored) {
        try {
            return JSON.parse(stored) as SafetySetting[];
        } catch (e) {
            console.error("Failed to parse safety settings", e);
        }
    }
    return undefined;
};

interface GeminiResponse {
    candidates: {
        content: {
            parts: {
                text: string;
            }[];
        };
    }[];
    error?: {
        message: string;
    };
}

export const callGemini = async (apiKey: string, prompt: string, model: GeminiModel = 'gemini-2.5-flash', systemInstruction?: string): Promise<string> => {
    if (!apiKey) {
        throw new Error('API Key is missing');
    }

    try {
        const requestBody: any = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        if (systemInstruction) {
            requestBody.system_instruction = {
                parts: [{ text: systemInstruction }]
            };
        }

        const safetySettings = getSafetySettings();
        if (safetySettings) {
            requestBody.safetySettings = safetySettings;
        }

        const response = await fetch(`${getGeminiUrl(model)}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data: GeminiResponse = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No text generated from Gemini');
        }

        return text;
    } catch (error) {
        console.error('Gemini API Call Failed:', error);
        throw error;
    }
};

// Interface for chat messages compatible with useCordChat
export interface ChatMessageData {
    role: 'user' | 'ai' | 'system';
    content: string;
}

export const callGeminiChat = async (
    apiKey: string,
    messages: ChatMessageData[],
    model: GeminiModel = 'gemini-2.5-flash',
    systemInstruction?: string
): Promise<string> => {
    if (!apiKey) {
        throw new Error('API Key is missing');
    }

    try {
        // Build the contents array
        // System messages are not officially a role in standard Gemini conversations (expected "user" or "model").
        // We handle 'system' separately via the dedicated system_instruction field or by injecting it.
        const contents = messages
            .filter(msg => msg.role !== 'system') // Filter out our internal 'system' UI messages
            .map(msg => ({
                role: msg.role === 'ai' ? 'model' : 'user', // Map 'ai' to 'model'
                parts: [{ text: msg.content }]
            }));

        const requestBody: any = { contents };

        // Add system instructions if provided (Supported in newer Gemini APIs)
        if (systemInstruction) {
            requestBody.system_instruction = {
                parts: [{ text: systemInstruction }]
            };
        }

        const safetySettings = getSafetySettings();
        if (safetySettings) {
            requestBody.safetySettings = safetySettings;
        }

        const response = await fetch(`${getGeminiUrl(model)}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data: GeminiResponse = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No text generated from Gemini Chat');
        }

        return text;
    } catch (error) {
        console.error('Gemini Chat API Call Failed:', error);
        throw error;
    }
};

export const testGeminiConnection = async (apiKey: string): Promise<{ success: boolean; message?: string }> => {
    try {
        await callGemini(apiKey, 'Hello, just checking connection. Reply with "OK".');
        return { success: true, message: 'OK' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Unknown Error' };
    }
};

export const verifyCelebrity = async (apiKey: string, name: string): Promise<boolean> => {
    const prompt = `Is '${name}' a real famous female celebrity? Reply strictly with 'YES' or 'NO'.`;
    // We let errors bubble up so the caller can distinguish between "Not a celebrity" (false) and "API Error" (exception)
    const response = await callGemini(apiKey, prompt);
    const cleanResponse = response.trim().toUpperCase();
    return cleanResponse.includes('YES');
};
