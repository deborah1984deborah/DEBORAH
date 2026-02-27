// src/utils/novelai.ts

export const testNovelAIConnection = async (apiKey: string): Promise<{ success: boolean; message: string }> => {
    try {
        if (!apiKey) {
            return { success: false, message: "API Key is missing." };
        }

        // Use the official OpenAI compatible endpoint for NovelAI (mapped via Vite proxy)
        const endpoint = '/api/nai-text/oa/v1/chat/completions';

        // OpenAI compatible payload format
        const payload = {
            model: 'glm-4-6', // Explicitly test the target model
            messages: [
                { role: 'user', content: 'Hello' }
            ],
            temperature: 0.5,
            max_tokens: 10
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[NovelAI] API Error:', response.status, errorText);

            // Try parsing JSON error
            let errorMessage = `${response.status} ${response.statusText}`;
            try {
                const errJson = JSON.parse(errorText);
                if (errJson.message) errorMessage += ` - ${errJson.message}`;
            } catch (e) { }

            return { success: false, message: `API Error: ${errorMessage}` };
        }

        const data = await response.json();
        const outputText = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
            ? data.choices[0].message.content
            : JSON.stringify(data);

        return { success: true, message: `Connected! Response: ${outputText.substring(0, 50)}...` };
    } catch (e: any) {
        console.error('[NovelAI] Request failed:', e);
        return { success: false, message: e.message || String(e) };
    }
};

import { ChatMessageData, StreamChunk } from './gemini';

const getNovelAIUrl = () => '/api/nai-text/oa/v1/chat/completions';

export const callNovelAIChat = async (
    apiKey: string,
    messages: ChatMessageData[],
    model: string = 'glm-4-6',
    systemInstruction?: string
): Promise<{ text?: string, rawParts: any[], thoughtSummary?: string }> => {

    // CORD（ストリーミング通信）側が正常に動作しているため、
    // API仕様の不具合（stream: false時の不正レスポンス）を安全に回避するため、
    // 内部的にStreamを呼び出してバッファリングするラッパー構成とします。
    const stream = callNovelAIChatStream(apiKey, messages, model, systemInstruction);
    let finalString = "";

    try {
        for await (const chunk of stream) {
            if (chunk.textChunk) {
                finalString += chunk.textChunk;
            }
        }
    } catch (e: any) {
        throw new Error(`Text Stream was empty/failed. Error: ${e.message}`);
    }

    if (!finalString) {
        throw new Error(`Text Stream resolved but text was empty.`);
    }

    return { text: finalString, rawParts: [] };
};

export const callNovelAIChatStream = async function* (
    apiKey: string,
    messages: ChatMessageData[],
    model: string = 'glm-4-6',
    systemInstruction?: string
): AsyncGenerator<StreamChunk, void, unknown> {
    if (!apiKey) throw new Error('NovelAI Access Token is missing');

    const oaiMessages: any[] = [];
    if (systemInstruction) {
        oaiMessages.push({ role: 'system', content: systemInstruction });
    }

    for (const msg of messages) {
        if (msg.role === 'function') continue;
        if (msg.role === 'system') continue;

        oaiMessages.push({
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.content
        });
    }

    const payload = {
        model,
        messages: oaiMessages,
        temperature: 0.7,
        max_tokens: 1500,
        stream: true
    };

    const response = await fetch(getNovelAIUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NovelAI API Stream Error ${response.status}: ${errorText}`);
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
        buffer = lines.pop() || "";

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') continue;
                if (!dataStr) continue;

                try {
                    const data = JSON.parse(dataStr);
                    const chunkText = data.choices?.[0]?.delta?.content || "";
                    if (chunkText) {
                        yield {
                            textChunk: chunkText,
                            isDone: false
                        };
                    }
                } catch (e) {
                    // Ignore JSON parsing errors for partial chunks
                }
            }
        }
    }

    yield { isDone: true };
};
