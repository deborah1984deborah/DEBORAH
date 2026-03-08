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
    systemInstruction?: string,
    signal?: AbortSignal
): AsyncGenerator<StreamChunk, void, unknown> {
    if (!apiKey) throw new Error('NovelAI Access Token is missing');

    const oaiMessages: any[] = [];
    if (systemInstruction) {
        oaiMessages.push({ role: 'system', content: systemInstruction });
    }

    for (const msg of messages) {
        if (msg.role === 'function' || msg.role === 'system') {
            oaiMessages.push({
                role: 'user',
                content: `[System Notification]\n${msg.content}`
            });
            continue;
        }

        let contentObj = msg.content || "";

        // --- CRITICAL FIX: Persist Tool Calls (Narrative Blueprints) for GLM-4 ---
        // Since GLM-4 does not natively support tool calling in this endpoint,
        // we must serialize any historical function calls (like trigger_womb_generation)
        // back into the text format that the AI was instructed to output.
        // Otherwise, the AI will completely forget what Blueprint it just wrote.
        if (msg.functionCall) {
            const toolString = `===BEGIN_TOOL_CALL===\n${JSON.stringify({
                name: msg.functionCall.name,
                args: msg.functionCall.args
            })}\n===END_TOOL_CALL===`;

            // Append the tool string to whatever conversational text (if any) the AI outputted before it
            contentObj = contentObj ? `${contentObj}\n${toolString}` : toolString;
        }

        oaiMessages.push({
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: contentObj
        });
    }

    // --- ENFORCE MAX CONTEXT FOR GLM-4 / NOVELAI API ---
    // The GLM-4 API throws 400 if (input_tokens + max_tokens) > 36864
    // We reserve 1500 for max_tokens, so target max input is ~35000 tokens.
    // 1 token is roughly 1-2 chars for CJK, let's be extremely safe and set a hard limit of 28000 characters total.
    const MAX_CHAR_LIMIT = 28000;

    // We always want to keep the very first message (System Instruction, if any)
    // and the very last message (The current prompt/story context)
    const hasSystemInstruction = systemInstruction ? true : false;

    let currentLength = oaiMessages.reduce((sum, m) => sum + (m.content ? m.content.length : 0), 0);

    // If we exceed the limit, start removing the oldest context messages (index 1 to length-2)
    while (currentLength > MAX_CHAR_LIMIT && oaiMessages.length > (hasSystemInstruction ? 2 : 1)) {
        // Remove the oldest message that isn't the system prompt
        const removeIdx = hasSystemInstruction ? 1 : 0;
        const removedMsg = oaiMessages.splice(removeIdx, 1)[0];
        currentLength -= (removedMsg.content ? removedMsg.content.length : 0);
        console.log(`[NovelAI] Trimmed message to stay within context limits. Removed ${removedMsg.content ? removedMsg.content.length : 0} chars.`);
    }

    // Safety fallback if the very last message itself is absurdly large (e.g. huge wombContextLength was set)
    // We shouldn't blindly truncate the user prompt because it breaks formatting, but if it's the only thing left:
    const lastMsgIndex = oaiMessages.length - 1;
    if (lastMsgIndex >= 0 && oaiMessages[lastMsgIndex].content && oaiMessages[lastMsgIndex].content.length > MAX_CHAR_LIMIT) {
        console.warn(`[NovelAI] The final user prompt itself exceeds the maximum limit (${oaiMessages[lastMsgIndex].content.length} > ${MAX_CHAR_LIMIT}). Forcing truncation.`);
        const content = oaiMessages[lastMsgIndex].content;
        oaiMessages[lastMsgIndex].content = content.substring(content.length - MAX_CHAR_LIMIT);
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
        body: JSON.stringify(payload),
        signal
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NovelAI API Stream Error ${response.status}: ${errorText}`);
    }

    if (!response.body) throw new Error("No response body available for streaming");

    try {
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
    } catch (e: any) {
        if (e.name === 'AbortError') {
            console.log("NovelAI Stream aborted early by client.");
        } else {
            throw e;
        }
    }

    yield { isDone: true };
};
