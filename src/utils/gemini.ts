
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
            parts: any[];
        };
    }[];
    error?: {
        message: string;
    };
}

export interface CallGeminiResult {
    text: string;
    rawParts?: any[];
    thoughtSummary?: string;
}

export const callGeminiWithThoughts = async (
    apiKey: string,
    prompt: string,
    model: GeminiModel = 'gemini-2.5-flash',
    systemInstruction?: string,
    aiThinkingLevel?: 'low' | 'medium' | 'high'
): Promise<CallGeminiResult> => {
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

        if (model.includes('3.') && aiThinkingLevel) {
            if (!requestBody.generationConfig) {
                requestBody.generationConfig = {};
            }
            requestBody.generationConfig.thinkingConfig = {
                includeThoughts: true,
                thinkingLevel: aiThinkingLevel === 'high' ? 'HIGH' : aiThinkingLevel === 'medium' ? 'MEDIUM' : 'LOW'
            };
        }

        const response = await fetch(`${getGeminiUrl(model)}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorRawData = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorRawData);
            } catch (e) {
                errorData = { error: { message: errorRawData } };
            }
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data: GeminiResponse = await response.json();

        const parts = data.candidates?.[0]?.content?.parts || [];
        const textPart = parts.find(p => !p.thought && p.text);
        const text = textPart?.text;

        const thoughtTextParts = parts.filter(p => p.thought === true && typeof p.text === 'string').map(p => p.text);
        const thoughtSummary = thoughtTextParts.length > 0 ? thoughtTextParts.join('\n\n') : undefined;

        if (!text) {
            throw new Error('No text generated from Gemini');
        }

        return { text, rawParts: parts, thoughtSummary };
    } catch (error) {
        console.error('Gemini API Call Failed:', error);
        throw error;
    }
};

export const callGemini = async (
    apiKey: string,
    prompt: string,
    model: GeminiModel = 'gemini-2.5-flash',
    systemInstruction?: string,
    aiThinkingLevel?: 'low' | 'medium' | 'high'
): Promise<string> => {
    const res = await callGeminiWithThoughts(apiKey, prompt, model, systemInstruction, aiThinkingLevel);
    return res.text;
};

// Interface for chat messages compatible with useCordChat
export interface ChatMessageData {
    role: 'user' | 'ai' | 'system' | 'function';
    content: string;
    functionCall?: {
        name: string;
        args: any;
    };
    // Include parts array explicitly when available to preserve Gemini's 'thought' or 'thought_signature' states for tool calling
    rawParts?: any[];
    thoughtSummary?: string;
}

export const callGeminiChat = async (
    apiKey: string,
    messages: ChatMessageData[],
    model: GeminiModel = 'gemini-2.5-flash',
    systemInstruction?: string,
    tools?: any[],
    aiThinkingLevel?: 'low' | 'medium' | 'high'
): Promise<{ text?: string, functionCall?: { name: string, args: any }, rawParts: any[], thoughtSummary?: string }> => {
    if (!apiKey) {
        throw new Error('API Key is missing');
    }

    try {
        // Build the contents array
        // System messages are not officially a role in standard Gemini conversations (expected "user" or "model").
        // We handle 'system' separately via the dedicated system_instruction field or by injecting it.
        const contents = messages
            .filter(msg => msg.role !== 'system') // Filter out our internal 'system' UI messages
            .map(msg => {
                if (msg.role === 'function') {
                    // When responding with a function result, the role MUST be "user" 
                    // for the Gemini REST API, otherwise it hallucinates and breaks the loop.
                    return {
                        role: 'user',
                        parts: [{
                            functionResponse: {
                                name: msg.functionCall?.name,
                                response: { result: msg.content }
                            }
                        }]
                    };
                } else if (msg.rawParts && msg.role === 'ai') {
                    // Filter out thoughts from history. Feeding thoughts back to the model 
                    // causes it to repeat its past thoughts and lose track of the conversation.
                    const filteredParts = msg.rawParts.filter(p => !p.thought && !p.thought_signature && !p.thoughtSignature);
                    return {
                        role: 'model',
                        parts: filteredParts.length > 0 ? filteredParts : [{ text: '' }]
                    };
                } else if (msg.functionCall) {
                    // Fallback for older stored messages that lack rawParts but had a function call
                    return {
                        role: 'model',
                        parts: [{
                            functionCall: msg.functionCall
                        }]
                    };
                } else {
                    return {
                        role: msg.role === 'ai' ? 'model' : 'user', // Map 'ai' to 'model'
                        parts: [{ text: msg.content }]
                    };
                }
            });

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

        if (tools && tools.length > 0) {
            requestBody.tools = tools;
        }

        // Enable Thinking Process ONLY for models that explicitly support it (like Gemini 3.1 Pro)
        if (model.includes('3.') && aiThinkingLevel) {
            if (!requestBody.generationConfig) {
                requestBody.generationConfig = {};
            }
            requestBody.generationConfig.thinkingConfig = {
                includeThoughts: true,
                thinkingLevel: aiThinkingLevel === 'high' ? 'HIGH' : aiThinkingLevel === 'medium' ? 'MEDIUM' : 'LOW'
            };
        }

        console.log("Gemini API Request Body:", JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${getGeminiUrl(model)}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorRawData = await response.text();
            console.error("Gemini API Raw Error Response:", errorRawData);
            let errorData;
            try {
                errorData = JSON.parse(errorRawData);
            } catch (e) {
                errorData = { error: { message: errorRawData } };
            }
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data: GeminiResponse = await response.json();

        const parts = data.candidates?.[0]?.content?.parts || [];
        const functionCallPart = parts.find(p => p.functionCall);

        // Extract all thought strings (where thought boolean is true, but content is in text)
        const thoughtTextParts = parts.filter(p => p.thought === true && typeof p.text === 'string').map(p => p.text);
        const thoughtSummary = thoughtTextParts.length > 0 ? thoughtTextParts.join('\n\n') : undefined;

        if (functionCallPart?.functionCall) {
            return { functionCall: functionCallPart.functionCall, rawParts: parts, thoughtSummary };
        }

        // Extract the actual response text (where it's NOT a thought)
        const textPart = parts.find(p => !p.thought && p.text);
        const text = textPart?.text;

        if (!text && thoughtSummary) {
            // Models sometimes fail to output final text if thinking takes too long, but we must return something to avoid UI crashes.
            return { text: '(System: The AI thought process completed, but it did not provide a final response text.)', rawParts: parts, thoughtSummary };
        }

        if (!text) {
            throw new Error('No text or function call generated from Gemini Chat');
        }

        return { text, rawParts: parts, thoughtSummary };
    } catch (error) {
        console.error('Gemini Chat API Call Failed:', error);
        throw error;
    }
};

export interface StreamChunk {
    textChunk?: string;
    thoughtChunk?: string;
    functionCall?: { name: string, args: any };
    rawParts?: any[];
    isDone: boolean;
}

export const callGeminiChatStream = async function* (
    apiKey: string,
    messages: ChatMessageData[],
    model: GeminiModel = 'gemini-2.5-flash',
    systemInstruction?: string,
    tools?: any[]
): AsyncGenerator<StreamChunk, void, unknown> {
    if (!apiKey) throw new Error('API Key is missing');

    try {
        const contents = messages
            .filter(msg => msg.role !== 'system')
            .map(msg => {
                if (msg.role === 'function') {
                    // Function results must be sent from the "user" role to keep Gemini from hallucinating
                    return {
                        role: 'user',
                        parts: [{ functionResponse: { name: msg.functionCall?.name, response: { result: msg.content } } }]
                    };
                } else if (msg.rawParts && msg.role === 'ai') {
                    const filteredParts = msg.rawParts.filter(p => !p.thought && !p.thought_signature && !p.thoughtSignature);
                    return { role: 'model', parts: filteredParts.length > 0 ? filteredParts : [{ text: '' }] };
                } else if (msg.functionCall) {
                    return { role: 'model', parts: [{ functionCall: msg.functionCall }] };
                } else {
                    return { role: msg.role === 'ai' ? 'model' : 'user', parts: [{ text: msg.content }] };
                }
            });

        const requestBody: any = { contents };

        if (systemInstruction) {
            requestBody.system_instruction = { parts: [{ text: systemInstruction }] };
        }

        const safetySettings = getSafetySettings();
        if (safetySettings) requestBody.safetySettings = safetySettings;

        if (tools && tools.length > 0) requestBody.tools = tools;

        if (model.includes('3.')) {
            if (!requestBody.generationConfig) requestBody.generationConfig = {};
            requestBody.generationConfig.thinkingConfig = { includeThoughts: true };
        }

        const url = `${getGeminiUrl(model).replace(':generateContent', ':streamGenerateContent')}?alt=sse&key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorRawData = await response.text();
            let errorData;
            try { errorData = JSON.parse(errorRawData); } catch (e) { errorData = { error: { message: errorRawData } }; }
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        if (!response.body) throw new Error("No response body available for streaming");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            let lines = buffer.split('\n');

            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === '[DONE]') continue;
                    if (!dataStr) continue;

                    try {
                        const data = JSON.parse(dataStr);
                        const candidates = data.candidates?.[0];
                        if (!candidates) continue;

                        const parts = candidates.content?.parts || [];

                        let textChunk = "";
                        let thoughtChunk = "";
                        let functionCall = undefined;

                        for (const p of parts) {
                            if (p.functionCall) functionCall = p.functionCall;
                            else if (p.thought === true && p.text) thoughtChunk += p.text;
                            else if (!p.thought && p.text) textChunk += p.text;
                        }

                        yield {
                            textChunk: textChunk || undefined,
                            thoughtChunk: thoughtChunk || undefined,
                            functionCall,
                            rawParts: parts,
                            isDone: false
                        };
                    } catch (e) {
                        console.error("Failed to parse SSE chunk:", line, e);
                    }
                }
            }
        }

        // Final flush
        yield { isDone: true };

    } catch (error) {
        console.error('Gemini Stream API Call Failed:', error);
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

/**
 * Specifically calls the Gemini API to perform a Google Search.
 * This is used as a workaround to allow CORD to search the web without failing
 * the API restriction that prevents combining `googleSearch` and `functionDeclarations`.
 * 
 * @param apiKey The user's Gemini API key
 * @param query The search query string
 * @param model The model to use for the search (should match the main chat model)
 * @returns The text result of the search based on Google Grounding
 */
export const callGeminiSearch = async (
    apiKey: string,
    query: string,
    model: GeminiModel = 'gemini-2.5-flash'
): Promise<string> => {
    if (!apiKey) {
        throw new Error('API Key is missing for background search');
    }

    try {
        const systemInstruction = `You are a search query executor. Your only job is to search the web for the user's query and summarize the findings concisely and factually. Do not use conversational filler.`;

        const requestBody: any = {
            contents: [{
                parts: [{ text: `Search for: ${query}` }]
            }],
            system_instruction: {
                parts: [{ text: systemInstruction }]
            },
            tools: [{ googleSearch: {} }]
        };

        const safetySettings = getSafetySettings();
        if (safetySettings) {
            requestBody.safetySettings = safetySettings;
        }

        const response = await fetch(`${getGeminiUrl(model)}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorRawData = await response.text();
            let errorData;
            try { errorData = JSON.parse(errorRawData); } catch (e) { errorData = { error: { message: errorRawData } }; }
            throw new Error(errorData.error?.message || `Search API Error: ${response.status}`);
        }

        const data: GeminiResponse = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const textPart = parts.find(p => !p.thought && p.text);

        if (!textPart || !textPart.text) {
            return "(検索を実行しましたが、結果が取得できませんでした。)";
        }

        return textPart.text;
    } catch (error) {
        console.error('Gemini Search API Call Failed:', error);
        throw error;
    }
};
