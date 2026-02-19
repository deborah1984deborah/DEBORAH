
// Gemini API Configuration
// Gemini API Configuration (Updated for 2026 - Gemini 2.5)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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

export const callGemini = async (apiKey: string, prompt: string): Promise<string> => {
    if (!apiKey) {
        throw new Error('API Key is missing');
    }

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
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
