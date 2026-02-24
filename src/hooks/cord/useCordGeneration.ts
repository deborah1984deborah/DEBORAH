import { useState } from 'react';
import { ChatSession, ChatMessage } from '../../types';
import { ChatMessageData } from '../../utils/gemini';

interface UseCordGenerationProps {
    lang: 'ja' | 'en';
    sessions: ChatSession[];
    messages: ChatMessage[];
    addMessage: (role: 'user' | 'ai' | 'system' | 'function', content: string, sessionIdOverride?: string, functionCall?: any, rawParts?: any[], thoughtSummary?: string) => string;
    cordDebug: {
        setCordDebugSystemPrompt: (v: string) => void;
        setCordDebugInputText: (v: string) => void;
        setCordDebugMatchedEntities: (v: any[]) => void;
    };
    STORAGE_KEY_SESSIONS: string;
    STORAGE_KEY_MESSAGES_PREFIX: string;
    saveSessionsToStorage: (updatedSessions: ChatSession[]) => void;
}

export const useCordGeneration = ({
    lang,
    sessions,
    messages,
    addMessage,
    cordDebug,
    STORAGE_KEY_SESSIONS,
    STORAGE_KEY_MESSAGES_PREFIX,
    saveSessionsToStorage
}: UseCordGenerationProps) => {
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [streamingText, setStreamingText] = useState<string>('');
    const [streamingThought, setStreamingThought] = useState<string>('');

    // Action: Generate AI Response
    const generateAiResponse = async (
        sessionId: string,
        apiKey: string,
        aiModel: 'gemini-2.5-flash' | 'gemini-3.1-pro-preview',
        getWombContext?: () => Promise<{ systemInstruction: string, entityContext?: string, scanTargetContent?: string, matchedLoreItems: any[], allActiveLoreItems: any[], allLoreItems: any[], cleanedContent: string, storyTitle: string }>
    ) => {
        if (!apiKey) {
            // Fallback mock if no API key
            setIsTyping(true);
            setTimeout(() => {
                const responseText = lang === 'ja'
                    ? 'なるほど、それは興味深いですね。（※APIキーが未設定のためモック応答です）'
                    : 'I see, that sounds interesting. (Mock response due to missing API key)';
                addMessage('ai', responseText, sessionId);
                setIsTyping(false);
            }, 1000);
            return;
        }

        setIsTyping(true);
        try {
            const { callGeminiChatStream, callGemini } = await import('../../utils/gemini');

            // Get latest messages for this session from state/localStorage
            const storedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES_PREFIX + sessionId);
            const currentMessages: ChatMessage[] = storedMessages ? JSON.parse(storedMessages) : messages;

            const freshSessionsStrForCheck = localStorage.getItem(STORAGE_KEY_SESSIONS);
            const freshCurrentSessions: ChatSession[] = freshSessionsStrForCheck ? JSON.parse(freshSessionsStrForCheck) : sessions;
            const currentSession = freshCurrentSessions.find(s => s.id === sessionId);

            // System prompt for CORD
            let systemPrompt = lang === 'ja'
                ? "あなたはCORDという名のアシスタントです。ユーザーの執筆やアイデア出しをクリエイティブにサポートしてください。"
                : "You are an assistant named CORD. Creatively support the user's writing and brainstorming.";

            if (currentSession?.isAwareOfWombStory && getWombContext) {
                try {
                    const wombContext = await getWombContext();
                    if (wombContext) {
                        systemPrompt += `\n\n[WOMB Story Context]\n`;
                        if (wombContext.entityContext) {
                            systemPrompt += `--- Matched Entities ---\n${wombContext.entityContext}\n\n`;
                        }
                        if (wombContext.allActiveLoreItems && wombContext.allActiveLoreItems.length > 0) {
                            const availableEntities = wombContext.allActiveLoreItems.map((item: any) => `- Name: ${item.name}`).join('\n');
                            systemPrompt += `--- Currently Active Entities (In UI) ---\n${availableEntities}\n\n`;
                        }

                        if (wombContext.cleanedContent) {
                            systemPrompt += `--- Story Body Text ---\n${wombContext.cleanedContent}`;
                        }

                        // Set matched entities for debug panel
                        cordDebug.setCordDebugMatchedEntities(wombContext.matchedLoreItems || []);
                    }
                } catch (e) {
                    console.error("Failed to load WOMB context for CORD", e);
                }
            }

            // Define tools for CORD
            const cordTools = [{
                functionDeclarations: [{
                    name: "insert_womb_instruction",
                    description: lang === 'ja'
                        ? "WOMBのエディタの現在のカーソル位置に、指定したAIインストラクションを挿入します。ユーザーの代わりに指示を書き込む際に使用します。"
                        : "Inserts the specified AI instruction at the current cursor position in the WOMB editor. Use this to write instructions on behalf of the user.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            instruction_text: {
                                type: "STRING",
                                description: lang === 'ja' ? "挿入する具体的な指示文。" : "The specific instruction text to insert."
                            }
                        },
                        required: ["instruction_text"]
                    }
                }, {
                    name: "add_womb_history",
                    description: lang === 'ja'
                        ? "ユーザーから明確な指示があった場合のみ使用します。対象のキャラクター(Entity)のHistoryに出来事や情報を追記します。対象が一意に定まらない場合はシステムから候補が返されるので、ユーザーに質問して対象のIDを絞り込んでください。"
                        : "Use ONLY when explicitly instructed by the user. Adds a new event to the History of the target character. If the target is ambiguous, candidates will be returned to you so you can ask the user to clarify the ID.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            entity_query: {
                                type: "STRING",
                                description: lang === 'ja' ? "ユーザーが指定した対象キャラクターの名前やキーワード。" : "The Name or keyword of the target character specified by the user."
                            },
                            entity_id: {
                                type: "STRING",
                                description: lang === 'ja' ? "対象を完全に特定できている場合(ユーザーからIDを指定された等)のシステムID。不明な場合は省略。" : "The system ID of the character if uniquely identified. Omit if unsure."
                            },
                            history_text: {
                                type: "STRING",
                                description: lang === 'ja' ? "Historyに追記する情報。" : "The information to append to the History."
                            }
                        },
                        required: ["entity_query", "history_text"]
                    }
                }]
            }];

            // Update Debug State visually
            cordDebug.setCordDebugSystemPrompt(systemPrompt);
            cordDebug.setCordDebugInputText(JSON.stringify(currentMessages, null, 2));

            // Call Chat API with Streaming
            setIsStreaming(true);
            setStreamingText('');
            setStreamingThought('');

            let finalFunctionCall = undefined;
            let finalRawParts: any[] = [];
            let accumulatedText = '';
            let accumulatedThought = '';

            const stream = callGeminiChatStream(apiKey, currentMessages as any, aiModel, systemPrompt, cordTools);

            for await (const chunk of stream) {
                if (chunk.textChunk) {
                    accumulatedText += chunk.textChunk;
                    setStreamingText(accumulatedText);
                }
                if (chunk.thoughtChunk) {
                    accumulatedThought += chunk.thoughtChunk;
                    setStreamingThought(accumulatedThought);
                }
                if (chunk.functionCall) {
                    finalFunctionCall = chunk.functionCall;
                }
                if (chunk.rawParts && chunk.rawParts.length > 0) {
                    finalRawParts = chunk.rawParts;
                }
            }

            setIsStreaming(false);

            const response = {
                text: accumulatedText || undefined,
                thoughtSummary: accumulatedThought || undefined,
                functionCall: finalFunctionCall,
                rawParts: finalRawParts
            };

            if (response.functionCall) {
                // Handle Function Call
                if (response.functionCall.name === 'insert_womb_instruction') {
                    const args = response.functionCall.args;
                    const instructionText = args.instruction_text;

                    // Dispatch custom event to WombEditor
                    const event = new CustomEvent('womb:insert-instruction', {
                        detail: { instructionText }
                    });
                    window.dispatchEvent(event);

                    const functionLogMsg = lang === 'ja'
                        ? 'WOMBにインストラクションを記述しました。'
                        : 'Inserted instruction into WOMB.';

                    // Add the function call to local state so the next reply knows what happened
                    // Create the objects directly to send to Gemini instantly
                    const funcCallMsg: ChatMessageData = {
                        role: 'ai',
                        content: '',
                        functionCall: response.functionCall,
                        rawParts: response.rawParts
                    };
                    const funcResMsg: ChatMessageData = {
                        role: 'function',
                        content: functionLogMsg,
                        functionCall: { name: 'insert_womb_instruction', args: {} }
                    };

                    addMessage('ai', '', sessionId, response.functionCall, response.rawParts, response.thoughtSummary);
                    addMessage('function', functionLogMsg, sessionId, { name: 'insert_womb_instruction', args: {} }); // We map 'function' back to API in gemini.ts

                    // Recurse to let AI give final string answer
                    // Combine the original messages with the new function call/response
                    const followUpMessages = [...currentMessages, funcCallMsg, funcResMsg];

                    try {
                        setIsStreaming(true);
                        setStreamingText('');
                        setStreamingThought('');
                        let fuText = '';
                        let fuThought = '';
                        let fuRawParts: any[] = [];

                        const fuStream = callGeminiChatStream(apiKey, followUpMessages as any, aiModel, systemPrompt, cordTools);
                        for await (const chunk of fuStream) {
                            if (chunk.textChunk) { fuText += chunk.textChunk; setStreamingText(fuText); }
                            if (chunk.thoughtChunk) { fuThought += chunk.thoughtChunk; setStreamingThought(fuThought); }
                            if (chunk.rawParts && chunk.rawParts.length > 0) fuRawParts = chunk.rawParts;
                        }
                        setIsStreaming(false);

                        if (fuText || fuThought) {
                            addMessage('ai', fuText || '', sessionId, undefined, fuRawParts, fuThought || undefined);
                        }
                    } catch (e) {
                        console.error("AI Follow up failed after function call", e);
                        addMessage('ai', lang === 'ja' ? '処理を完了しましたが、応答でエラーが発生しました。' : 'Action completed, but failed to generate response.', sessionId);
                    }
                } else if (response.functionCall.name === 'add_womb_history') {
                    const args = response.functionCall.args;
                    const entityQuery = args.entity_query || args.entityQuery || args.entity_name || args.entityName;
                    const explicitlyProvidedId = args.entity_id || args.entityId;
                    const historyText = args.history_text || args.historyText || args.history;

                    if (!entityQuery || !historyText) {
                        console.error('CORD provided incomplete data for add_womb_history:', args);
                    }

                    // --- HUMAN-IN-THE-LOOP RESOLUTION FLOW ---
                    let functionLogMsg = "";
                    let isResolved = false;
                    let targetEntityId = explicitlyProvidedId || "";
                    let targetEntityName = "不明なキャラクター";
                    let storyTitle = "名称未設定のストーリー";

                    if (getWombContext) {
                        try {
                            const wombContext = await getWombContext();
                            if (wombContext.storyTitle) storyTitle = wombContext.storyTitle;

                            // 1. If ID was directly provided by AI, verify it exists.
                            if (targetEntityId && wombContext.allLoreItems) {
                                const matchedById = wombContext.allLoreItems.find((item: any) => item.id === targetEntityId);
                                if (matchedById) {
                                    isResolved = true;
                                    targetEntityName = matchedById.name;
                                    functionLogMsg = `[System] Success. History added to "${matchedById.name}" (ID: ${matchedById.id}).`;
                                }
                            }

                            // 2. If not resolved, execute the 3-Step Search Flow
                            if (!isResolved && wombContext.allLoreItems && entityQuery) {
                                const allItems = wombContext.allLoreItems;
                                const activeItems = wombContext.allActiveLoreItems || [];

                                const queryLower = entityQuery.toLowerCase();
                                const searchData = (item: any) => {
                                    return item.name.toLowerCase().includes(queryLower) ||
                                        (item.keywords && item.keywords.some((kw: string) => kw.toLowerCase().includes(queryLower)));
                                };

                                // Step 1: Search Active Entities first
                                let matches = activeItems.filter(searchData);

                                // Step 2: If none found in Active, search all
                                if (matches.length === 0) {
                                    matches = allItems.filter(searchData);
                                }

                                if (matches.length === 1) {
                                    // Step X-C: Exactly 1 found
                                    targetEntityId = matches[0].id;
                                    targetEntityName = matches[0].name;
                                    isResolved = true;
                                    functionLogMsg = `[System] Success. History added to "${matches[0].name}" (ID: ${matches[0].id}).`;
                                } else if (matches.length > 1) {
                                    // Step X-B: Multiple matches
                                    const candidatesStr = matches.map((m: any) => `- ID: ${m.id}, Name: ${m.name}`).join('\n');
                                    functionLogMsg = `[System] Error: Ambiguous target. Multiple characters match the query "${entityQuery}".\nCandidates:\n${candidatesStr}\n\nPlease ask the user to clarify which ID they meant.`;
                                } else {
                                    // Step 3-A: None found, do fallback approximate matching
                                    const { getLevenshteinDistance } = await import('../../utils/bison');

                                    const scoredItems = allItems.map((item: any) => ({
                                        item,
                                        distance: getLevenshteinDistance(queryLower, item.name.toLowerCase())
                                    })).sort((a: any, b: any) => a.distance - b.distance);

                                    // Take top 3 closest
                                    const closestStr = scoredItems.slice(0, 3).map((s: any) => `- ID: ${s.item.id}, Name: ${s.item.name}`).join('\n');

                                    functionLogMsg = `[System] Error: Target not found. No character perfectly matches "${entityQuery}".\nDid the user mean one of these?\nCandidates:\n${closestStr}\n\nPlease ask the user if they meant one of these characters.`;
                                }
                            }
                        } catch (e) {
                            console.error("[CORD Tool] Failed to execute 3-step entity resolution", e);
                            functionLogMsg = `[System] Error: Failed to query database.`;
                        }
                    } else {
                        // Fallback if context is entirely broken
                        if (explicitlyProvidedId) {
                            targetEntityId = explicitlyProvidedId;
                            isResolved = true;
                            functionLogMsg = `[System] Success. Executed with provided ID.`;
                        }
                    }

                    let uiDisplayMsg = functionLogMsg; // Fallback for errors

                    if (isResolved && targetEntityId) {
                        // Dispatch only if fully resolved
                        const event = new CustomEvent('womb:add-history', {
                            detail: { entityId: targetEntityId, historyText }
                        });
                        console.log(`[CORD Tool] Dispatching 'womb:add-history' event for real...`, { entityId: targetEntityId, historyText });
                        window.dispatchEvent(event);

                        // Set the formatted message requested by the user
                        uiDisplayMsg = `${targetEntityName}(${targetEntityId})のヒストリーに追記しました(${storyTitle})`;
                    } else {
                        console.log(`[CORD Tool] womb:add-history resolution failed or ambiguous. Asking AI to confirm with user.`);
                    }

                    const funcCallMsg: ChatMessageData = {
                        role: 'ai',
                        content: '',
                        functionCall: response.functionCall,
                        rawParts: response.rawParts
                    };
                    const funcResMsg: ChatMessageData = {
                        role: 'function',
                        content: functionLogMsg,
                        functionCall: { name: 'add_womb_history', args: {} }
                    };

                    addMessage('ai', '', sessionId, response.functionCall, response.rawParts, response.thoughtSummary);
                    addMessage('function', uiDisplayMsg, sessionId, { name: 'add_womb_history', args: {} });

                    const followUpMessages = [...currentMessages, funcCallMsg, funcResMsg];

                    try {
                        setIsStreaming(true);
                        setStreamingText('');
                        setStreamingThought('');
                        let fuText = '';
                        let fuThought = '';
                        let fuRawParts: any[] = [];

                        const fuStream = callGeminiChatStream(apiKey, followUpMessages as any, aiModel, systemPrompt, cordTools);
                        for await (const chunk of fuStream) {
                            if (chunk.textChunk) { fuText += chunk.textChunk; setStreamingText(fuText); }
                            if (chunk.thoughtChunk) { fuThought += chunk.thoughtChunk; setStreamingThought(fuThought); }
                            if (chunk.rawParts && chunk.rawParts.length > 0) fuRawParts = chunk.rawParts;
                        }
                        setIsStreaming(false);

                        if (fuText || fuThought) {
                            addMessage('ai', fuText || '', sessionId, undefined, fuRawParts, fuThought || undefined);
                        }
                    } catch (e) {
                        console.error("AI Follow up failed after function call", e);
                        addMessage('ai', lang === 'ja' ? '処理を完了しましたが、応答でエラーが発生しました。' : 'Action completed, but failed to generate response.', sessionId);
                    }
                }
            } else if (response.text || response.thoughtSummary) {
                // Add the AI message along with its raw parts and thought summary
                addMessage('ai', response.text || '', sessionId, undefined, response.rawParts, response.thoughtSummary);

                // --- Auto Titling Logic ---
                // Fetch fresh sessions from localStorage to avoid closure overwrite
                const freshSessionsStr = localStorage.getItem(STORAGE_KEY_SESSIONS);
                const freshSessions: ChatSession[] = freshSessionsStr ? JSON.parse(freshSessionsStr) : sessions;

                if (currentMessages.length === 1 && currentMessages[0].role === 'user') {
                    const sessionToUpdate = freshSessions.find(s => s.id === sessionId);
                    if (sessionToUpdate && sessionToUpdate.title === 'New Chat') {
                        try {
                            // Prompt AI to generate a title
                            const titlePrompt = lang === 'ja'
                                ? `次のユーザーの入力を元に、このチャットのタイトルを20文字以内で作成してください。\n※「(〇〇文字)」のような文字数のカウントやカッコなどの補足情報は一切含めず、純粋なタイトル文字列のみを出力してください。\n\nユーザー入力: "${currentMessages[0].content}"`
                                : `Create a title for this chat based on the following user input. Keep it under 20 characters.\n* Output ONLY the pure title string without quotes, parentheses, or character counts.\n\nUser input: "${currentMessages[0].content}"`;

                            const generatedTitle = await callGemini(apiKey, titlePrompt, 'gemini-2.5-flash');
                            const cleanTitle = generatedTitle.replace(/["']/g, '').trim();

                            const updatedSessions = freshSessions.map(s =>
                                s.id === sessionId ? { ...s, title: cleanTitle } : s
                            );
                            saveSessionsToStorage(updatedSessions);
                        } catch (titleError) {
                            console.error("Failed to generate title:", titleError);
                        }
                    }
                }
            }

        } catch (error: any) {
            console.error("CORD AI Generate Error:", error);
            // Fallback to mock on API Error (e.g., invalid key)
            const responseText = lang === 'ja'
                ? 'なるほど、それは興味深いですね。（※API通信エラーのためモック応答です）'
                : 'I see, that sounds interesting. (Mock response due to API error)';
            addMessage('ai', responseText, sessionId);
        } finally {
            setIsTyping(false);
        }
    };

    return {
        isTyping,
        isStreaming,
        streamingText,
        streamingThought,
        generateAiResponse
    };
};
