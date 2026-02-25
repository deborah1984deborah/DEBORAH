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
    triggerAutoHistory?: () => void;
}

export const useCordGeneration = ({
    lang,
    sessions,
    messages,
    addMessage,
    cordDebug,
    STORAGE_KEY_SESSIONS,
    STORAGE_KEY_MESSAGES_PREFIX,
    saveSessionsToStorage,
    triggerAutoHistory
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

            const sessionLang = currentSession?.aiLang || lang;

            let systemPrompt = sessionLang === 'ja'
                ? "あなたはCORDという名のアシスタントです。ユーザーの執筆やアイデア出しをクリエイティブにサポートしてください。"
                : "You are an assistant named CORD. Creatively support the user's writing and brainstorming.";

            let wombContextString = "";
            if (currentSession?.isAwareOfWombStory && getWombContext) {
                try {
                    const wombContext = await getWombContext();
                    if (wombContext) {
                        wombContextString += `\n\n[System Info: Current WOMB Story Context]\n`;
                        if (wombContext.entityContext) {
                            wombContextString += `--- Matched Entities ---\n${wombContext.entityContext}\n\n`;
                        }
                        if (wombContext.allActiveLoreItems && wombContext.allActiveLoreItems.length > 0) {
                            const availableEntities = wombContext.allActiveLoreItems.map((item: any) => `- Name: ${item.name}`).join('\n');
                            wombContextString += `--- Currently Active Entities (In UI) ---\n${availableEntities}\n\n`;
                        }

                        if (wombContext.cleanedContent) {
                            wombContextString += `--- Story Body Text ---\n${wombContext.cleanedContent}`;
                        }

                        // Set matched entities for debug panel
                        cordDebug.setCordDebugMatchedEntities(wombContext.matchedLoreItems || []);
                    }
                } catch (e) {
                    console.error("Failed to load WOMB context for CORD", e);
                }
            }

            // Assemble final array for API call
            const apiMessages = [...currentMessages];
            if (wombContextString && apiMessages.length > 0) {
                // Find the last user message and append the context to it
                for (let i = apiMessages.length - 1; i >= 0; i--) {
                    if (apiMessages[i].role === 'user') {
                        // Create a new object to avoid mutating the React state/localStorage array
                        apiMessages[i] = {
                            ...apiMessages[i],
                            content: apiMessages[i].content + wombContextString
                        };
                        break;
                    }
                }
            }

            // Define tools for CORD
            const cordTools = [{
                functionDeclarations: [{
                    name: "search_web",
                    description: sessionLang === 'ja'
                        ? "最新の情報をGoogleで検索します。事実確認が必要な場合に使用してください。"
                        : "Searches Google for up-to-date information. Use this when you need to verify facts.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            query: {
                                type: "STRING",
                                description: sessionLang === 'ja' ? "検索クエリ（例: '最新のAI ニュース'）" : "The search query."
                            }
                        },
                        required: ["query"]
                    }
                }, {
                    name: "insert_womb_instruction",
                    description: sessionLang === 'ja'
                        ? "WOMBのエディタの現在のカーソル位置に、指定したAIインストラクションを挿入します。ユーザーの代わりに指示を書き込む際に使用します。"
                        : "Inserts the specified AI instruction at the current cursor position in the WOMB editor. Use this to write instructions on behalf of the user.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            instruction_text: {
                                type: "STRING",
                                description: sessionLang === 'ja' ? "挿入する具体的な指示文。" : "The specific instruction text to insert."
                            }
                        },
                        required: ["instruction_text"]
                    }
                }, {
                    name: "add_womb_history",
                    description: sessionLang === 'ja'
                        ? "ユーザーから明確な指示があった場合のみ使用します。対象のキャラクター(Entity)のHistoryに出来事や情報を追記します。対象が一意に定まらない場合はシステムから候補が返されるので、ユーザーに質問して対象のIDを絞り込んでください。"
                        : "Use ONLY when explicitly instructed by the user. Adds a new event to the History of the target character. If the target is ambiguous, candidates will be returned to you so you can ask the user to clarify the ID.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            entity_query: {
                                type: "STRING",
                                description: sessionLang === 'ja' ? "ユーザーが指定した対象キャラクターの名前やキーワード。" : "The Name or keyword of the target character specified by the user."
                            },
                            entity_id: {
                                type: "STRING",
                                description: sessionLang === 'ja' ? "対象を完全に特定できている場合(ユーザーからIDを指定された等)のシステムID。不明な場合は省略。" : "The system ID of the character if uniquely identified. Omit if unsure."
                            },
                            history_text: {
                                type: "STRING",
                                description: sessionLang === 'ja' ? "Historyに追記する情報。" : "The information to append to the History."
                            }
                        },
                    }
                }, {
                    name: "trigger_auto_history",
                    description: sessionLang === 'ja'
                        ? "ユーザーから「今の本文からヒストリーを抽出して」「最新の流れを更新して」のように自動抽出を依頼された場合に使用します。内部で本文の差分解析プロセスを強制起動し、対象キャラクターのHistoryを自動更新させます。"
                        : "Use this when the user requests to automatically extract or record history from the current text. It manually triggers the background diff-analysis process to update character histories.",
                    parameters: {
                        type: "OBJECT",
                        properties: {}
                    }
                }]
            }]; // Notice: googleSearch is deliberately omitted to prevent API 400 errors

            // Update Debug State visually
            cordDebug.setCordDebugSystemPrompt(systemPrompt);
            cordDebug.setCordDebugInputText(JSON.stringify(apiMessages, null, 2));

            // Call Chat API with Streaming, loop for multi-turn function calls
            setIsStreaming(true);
            setStreamingText('');
            setStreamingThought('');

            let currentApiMessages = [...apiMessages];
            let loopCount = 0;
            const MAX_LOOPS = 5;

            try {
                while (loopCount < MAX_LOOPS) {
                    loopCount++;
                    let accumulatedText = '';
                    let accumulatedThought = '';
                    let finalFunctionCall: any = undefined;
                    let finalRawParts: any[] = [];

                    if (loopCount > 1) {
                        setIsStreaming(true);
                        setStreamingText('');
                        setStreamingThought('');
                    }

                    const stream = callGeminiChatStream(apiKey, currentApiMessages as any, aiModel, systemPrompt, cordTools);

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

                    if (finalFunctionCall) {
                        // Function Call Received
                        let functionLogMsg = '';
                        let uiDisplayMsg = '';

                        // Visually add the AI's internal decision to the chat
                        addMessage('ai', '', sessionId, finalFunctionCall, finalRawParts, accumulatedThought || undefined);

                        // Clear streaming state during background execution to prevent UI duplicate thoughts
                        setIsStreaming(false);
                        setStreamingText('');
                        setStreamingThought('');

                        if (finalFunctionCall.name === 'search_web') {
                            const args = finalFunctionCall.args;
                            const query = args.query;
                            addMessage('system', sessionLang === 'ja' ? `ウェブで「${query}」を検索しています...` : `Searching the web for "${query}"...`, sessionId);
                            try {
                                const { callGeminiSearch } = await import('../../utils/gemini');
                                const searchResult = await callGeminiSearch(apiKey, query, aiModel);
                                functionLogMsg = `[Search Results for "${query}"]\n${searchResult}`;
                                uiDisplayMsg = sessionLang === 'ja' ? `「${query}」の検索結果を取得しました。` : `Got search results for "${query}".`;
                            } catch (e: any) {
                                functionLogMsg = `[Search Error] ${e.message}`;
                                uiDisplayMsg = sessionLang === 'ja' ? `検索エラーが発生しました。` : `Search error occurred.`;
                            }
                        } else if (finalFunctionCall.name === 'insert_womb_instruction') {
                            const args = finalFunctionCall.args;
                            const instructionText = args.instruction_text;
                            const event = new CustomEvent('womb:insert-instruction', { detail: { instructionText } });
                            window.dispatchEvent(event);

                            functionLogMsg = sessionLang === 'ja' ? 'WOMBにインストラクションを記述しました。' : 'Inserted instruction into WOMB.';
                            uiDisplayMsg = functionLogMsg;
                        } else if (finalFunctionCall.name === 'add_womb_history') {
                            const args = finalFunctionCall.args;
                            const entityQuery = args.entity_query || args.entityQuery || args.entity_name || args.entityName;
                            const explicitlyProvidedId = args.entity_id || args.entityId;
                            const historyText = args.history_text || args.historyText || args.history;

                            let isResolved = false;
                            let targetEntityId = explicitlyProvidedId || "";
                            let targetEntityName = "不明なキャラクター";
                            let storyTitle = "名称未設定のストーリー";

                            if (getWombContext) {
                                try {
                                    const wombContext = await getWombContext();
                                    if (wombContext.storyTitle) storyTitle = wombContext.storyTitle;

                                    if (targetEntityId && wombContext.allLoreItems) {
                                        const matchedById = wombContext.allLoreItems.find((item: any) => item.id === targetEntityId);
                                        if (matchedById) {
                                            isResolved = true;
                                            targetEntityName = matchedById.name;
                                            functionLogMsg = `[System] Success. History added to "${matchedById.name}" (ID: ${matchedById.id}).`;
                                        }
                                    }

                                    if (!isResolved && wombContext.allLoreItems && entityQuery) {
                                        const allItems = wombContext.allLoreItems;
                                        const activeItems = wombContext.allActiveLoreItems || [];
                                        const queryLower = entityQuery.toLowerCase();
                                        const searchData = (item: any) => item.name.toLowerCase().includes(queryLower) || (item.keywords && item.keywords.some((kw: string) => kw.toLowerCase().includes(queryLower)));

                                        let matches = activeItems.filter(searchData);
                                        if (matches.length === 0) matches = allItems.filter(searchData);

                                        if (matches.length === 1) {
                                            targetEntityId = matches[0].id;
                                            targetEntityName = matches[0].name;
                                            isResolved = true;
                                            functionLogMsg = `[System] Success. History added to "${matches[0].name}" (ID: ${matches[0].id}).`;
                                        } else if (matches.length > 1) {
                                            const candidatesStr = matches.map((m: any) => `- ID: ${m.id}, Name: ${m.name}`).join('\n');
                                            functionLogMsg = `[System] Error: Ambiguous target. Multiple characters match the query "${entityQuery}".\nCandidates:\n${candidatesStr}\n\nPlease ask the user to clarify which ID they meant.`;
                                        } else {
                                            const { getLevenshteinDistance } = await import('../../utils/bison');
                                            const scoredItems = allItems.map((item: any) => ({ item, distance: getLevenshteinDistance(queryLower, item.name.toLowerCase()) })).sort((a: any, b: any) => a.distance - b.distance);
                                            const closestStr = scoredItems.slice(0, 3).map((s: any) => `- ID: ${s.item.id}, Name: ${s.item.name}`).join('\n');
                                            functionLogMsg = `[System] Error: Target not found. No character perfectly matches "${entityQuery}".\nDid the user mean one of these?\nCandidates:\n${closestStr}\n\nPlease ask the user if they meant one of these characters.`;
                                        }
                                    }
                                } catch (e) {
                                    functionLogMsg = `[System] Error: Failed to query database.`;
                                }
                            } else {
                                if (explicitlyProvidedId) {
                                    targetEntityId = explicitlyProvidedId;
                                    isResolved = true;
                                    functionLogMsg = `[System] Success. Executed with provided ID.`;
                                }
                            }

                            uiDisplayMsg = functionLogMsg;
                            if (isResolved && targetEntityId) {
                                const event = new CustomEvent('womb:add-history', { detail: { entityId: targetEntityId, historyText } });
                                window.dispatchEvent(event);
                                uiDisplayMsg = `${targetEntityName}(${targetEntityId})のヒストリーに追記しました(${storyTitle})`;
                            }
                        } else if (finalFunctionCall.name === 'trigger_auto_history') {
                            if (triggerAutoHistory) {
                                triggerAutoHistory();
                                functionLogMsg = sessionLang === 'ja' ? "本文からの自動ヒストリー抽出処理を開始しました。変更があった場合はまもなく反映されます。" : "Started automatic history extraction from the text. Changes will be reflected shortly if any are found.";
                            } else {
                                functionLogMsg = "[System Error] triggerAutoHistory is not available.";
                            }
                            uiDisplayMsg = functionLogMsg;
                        } else {
                            // Unknown function
                            functionLogMsg = `[System] Unknown function called: ${finalFunctionCall.name}`;
                            uiDisplayMsg = functionLogMsg;
                        }

                        // Prepare function response and update message history for the next loop
                        const funcCallMsg: ChatMessageData = {
                            role: 'ai',
                            content: '',
                            functionCall: finalFunctionCall,
                            rawParts: finalRawParts
                        };
                        const funcResMsg: ChatMessageData = {
                            role: 'function',
                            content: functionLogMsg,
                            functionCall: { name: finalFunctionCall.name, args: {} }
                        };

                        addMessage('function', uiDisplayMsg, sessionId, { name: finalFunctionCall.name, args: {} });
                        currentApiMessages = [...currentApiMessages, funcCallMsg as any, funcResMsg as any];

                        // loop continues!
                    } else if (accumulatedText || accumulatedThought) {
                        // AI finished with text
                        addMessage('ai', accumulatedText || '', sessionId, undefined, finalRawParts, accumulatedThought || undefined);

                        // Clear streaming state immediately before any background processing
                        setIsStreaming(false);
                        setStreamingText('');
                        setStreamingThought('');

                        // --- Auto Titling Logic ---
                        if (currentMessages.length === 1 && currentMessages[0].role === 'user') {
                            const freshSessionsStr = localStorage.getItem(STORAGE_KEY_SESSIONS);
                            const freshSessions: ChatSession[] = freshSessionsStr ? JSON.parse(freshSessionsStr) : sessions;
                            const sessionToUpdate = freshSessions.find(s => s.id === sessionId);
                            if (sessionToUpdate && sessionToUpdate.title === 'New Chat') {
                                try {
                                    const titlePrompt = sessionLang === 'ja'
                                        ? `次のユーザーの入力を元に、このチャットのタイトルを20文字以内で作成してください。\n※「(〇〇文字)」のような文字数のカウントやカッコなどの補足情報は一切含めず、純粋なタイトル文字列のみを出力してください。\n\nユーザー入力: "${currentMessages[0].content}"`
                                        : `Create a title for this chat based on the following user input. Keep it under 20 characters.\n* Output ONLY the pure title string without quotes, parentheses, or character counts.\n\nUser input: "${currentMessages[0].content}"`;

                                    const generatedTitle = await callGemini(apiKey, titlePrompt, 'gemini-2.5-flash');
                                    const cleanTitle = generatedTitle.replace(/["']/g, '').trim();

                                    const updatedSessions = freshSessions.map(s => s.id === sessionId ? { ...s, title: cleanTitle } : s);
                                    saveSessionsToStorage(updatedSessions);
                                } catch (titleError) {
                                    console.error("Failed to generate title:", titleError);
                                }
                            }
                        }
                        break; // Exit the loop successfully
                    } else {
                        break; // Edge case, exit to prevent infinite loop
                    }
                }
            } finally {
                setIsStreaming(false);
            }

        } catch (error: any) {
            console.error("CORD AI Generate Error:", error);
            const fallbackLang = lang;
            // Fallback to mock on API Error (e.g., invalid key)
            const responseText = fallbackLang === 'ja'
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
