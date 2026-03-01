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
    triggerWombGeneration?: (blueprintOverride?: string) => Promise<void>;
    cordOutputLength: number;
    checkIsBackgroundProcessing?: () => boolean;
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
    triggerAutoHistory,
    triggerWombGeneration,
    cordOutputLength,
    checkIsBackgroundProcessing
}: UseCordGenerationProps) => {
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [streamingText, setStreamingText] = useState<string>('');
    const [streamingThought, setStreamingThought] = useState<string>('');

    // Action: Generate AI Response
    const generateAiResponse = async (
        sessionId: string,
        apiKey: string,
        novelAIApiKey: string,
        aiModel: 'gemini-2.5-flash' | 'gemini-3.1-pro-preview' | 'glm-4-6',
        getWombContext?: () => Promise<{ systemInstruction: string, entityContext?: string, scanTargetContent?: string, matchedLoreItems: any[], allActiveLoreItems: any[], allLoreItems: any[], cleanedContent: string, storyTitle: string }>
    ) => {
        if (!apiKey && !novelAIApiKey) {
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
                ? `あなたは能動的物語分析AI「CORD」です。ユーザーの執筆やアイデア出しをサポートしてください。
重要な役割として、WOMB（執筆AI）に続きを書かせるための「Narrative Blueprint（展開指示書）」の作成があります。
自動生成を求められた場合は、必ず以下の要件とフォーマットを満たしたNarrative Blueprintを作成してください。

【Narrative Blueprint の要件】
- 現状の簡単な分析と要約
- 次のシーンで達成すべき目的（Must-have）
- 登場人物の感情の動きとアクション
- セリフのトーンや描写のテイスト設定
- Narrative Blueprintを生成する際は、trigger_womb_generationツールの引数のみにNarrative Blueprintを渡してください。ユーザーへの返答テキストにはBlueprintの内容を含めないでください。
- ツール呼び出しが成功した後は、ユーザーへの返答として「WOMBで生成を開始しました」などの短い完了報告のみをテキスト出力して回答を終了してください。同じツールを複数回呼ばないでください。`
                : `You are the Active Story Analysis AI, "CORD". Support the user's writing and brainstorming.
An important role of yours is to create a "Narrative Blueprint" for WOMB (the writing AI) to write the continuation.
When auto-generation is requested, you MUST create a Narrative Blueprint that meets the following requirements and format.

[Narrative Blueprint Requirements]
- Provide a brief analysis and summary of the current situation.
- The objective that must be achieved in the next scene (Must-have).
- The character's emotional movements and actions.
- The tone of the dialogue and the taste of the description.
- When generating a Narrative Blueprint, pass the Narrative Blueprint ONLY to the arguments of the trigger_womb_generation tool. Do not include the contents of the Narrative Blueprint in the response text.
- After the tool call is successful, output a short confirmation text like "Started generation in WOMB" and finish your response. Do not call the same tool multiple times in a row.`;

            let wombContextString = "";
            if (currentSession?.isAwareOfWombStory && getWombContext) {
                try {
                    const wombContext = await getWombContext();
                    if (wombContext) {
                        wombContextString += `[System Info: Current WOMB Story Context]\n`;
                        if (wombContext.entityContext) {
                            wombContextString += `--- Matched Entities ---\n${wombContext.entityContext}\n\n`;
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
                // Find the last user message and prepend the context to it, keeping the user input at the very end
                for (let i = apiMessages.length - 1; i >= 0; i--) {
                    if (apiMessages[i].role === 'user') {
                        const originalInput = apiMessages[i].content;

                        // Construct Output Length Constraint for CORD
                        const lengthConstraint = sessionLang === 'ja'
                            ? `\n\n【出力形式の制約】\nあなたの返答テキストは、全体で大体 ${cordOutputLength} 文字以内になるように調整してください。`
                            : `\n\n[Output Constraints]\nAdjust the character count of your response to be roughly within ${cordOutputLength} characters.`;

                        const userInputHeader = `${lengthConstraint}\n\n=== User Input ===\n`;

                        apiMessages[i] = {
                            ...apiMessages[i],
                            content: wombContextString + userInputHeader + originalInput
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
                }, {
                    name: "trigger_womb_generation",
                    description: sessionLang === 'ja'
                        ? "ユーザーから「続きを書いて」「〇〇の展開を生成して」のように、WOMB(執筆AI)による本文の自動生成を依頼された場合に使用します。これを呼び出すと、あなたが作成した分析・指示(Narrative Blueprint)に基づいてWOMBが小説の続きを執筆します。"
                        : "Use this when the user asks you to 'write the continuation' or 'generate the next part'. Calling this will trigger the WOMB (Writing AI) to write the next part of the novel based on your analysis and instructions (Narrative Blueprint).",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            blueprint_text: {
                                type: "STRING",
                                description: sessionLang === 'ja' ? "WOMBに渡すためのNarrative Blueprintのテキスト全文" : "The full text of the Narrative Blueprint to pass to WOMB"
                            }
                        },
                        required: ["blueprint_text"]
                    }
                }]
            }]; // Notice: googleSearch is deliberately omitted to prevent API 400 errors

            // [HACK] For GLM-4 model which ignores tool definitions in the system param,
            // we manually append the tool descriptions and formatting rules into the system prompt.
            if (aiModel === 'glm-4-6') {
                systemPrompt += `\n\n【重要: ツールの使用と出力フォーマットの厳守】
あなたは現在の環境において、追加で以下の3つのツールを使用することができます。

- 名前: "insert_womb_instruction"
- 目的: WOMBのエディタの現在のカーソル位置に、指定したAIインストラクションを挿入します。ユーザーの代わりに指示を書き込む際に使用します。
- 引数: "instruction_text" (文字列)

- 名前: "add_womb_history"
- 目的: WOMB上の特定のキャラクター（Entity）の履歴に情報を追加します。
- 引数:
  - "entity_query" (文字列): 対象キャラクターの名前またはキーワード。
  - "history_text" (文字列): 追加する履歴のテキスト。

- 名前: "trigger_womb_generation"
- 目的: WOMB(執筆AI)による本文の自動生成を依頼された場合に使用します。これを呼び出すことで、あなたが作成した分析・展開指示(Narrative Blueprint)に基づいてWOMBが小説の続きを執筆します。
- 引数:
  - "blueprint_text" (文字列): WOMBに渡すためのNarrative Blueprintのテキスト全文。

ツールを使用する場合は、**完全に推論と文章の出力を完了したあと、発言の最後尾に**以下の厳密なフォーマットのみを出力し、「===END_TOOL_CALL===」の閉じ文字まで完全に書き切ってから終了してください。
途中で出力を停止したり、JSONの構造を破壊したりすることはシステムエラーに直結するため絶対に避けてください。

[正しい出力の例（insert_womb_instructionの場合）]
わかりました！指示を挿入しますね。
===BEGIN_TOOL_CALL===
{"name": "insert_womb_instruction", "args": {"instruction_text": "挿入したい指示文"}}
===END_TOOL_CALL===

[正しい出力の例（add_womb_historyの場合）]
王様の履歴に追加しました！
===BEGIN_TOOL_CALL===
{"name": "add_womb_history", "args": {"entity_query": "王様", "history_text": "城の修繕を命じた"}}
===END_TOOL_CALL===

[正しい出力の例（trigger_womb_generationの場合）]
分析が終わりました！この展開指示でWOMBに生成を依頼しますね。
===BEGIN_TOOL_CALL===
{"name": "trigger_womb_generation", "args": {"blueprint_text": "【前回のあらすじ】王様は城から脱出し...【今後の展開】森へ向かう一行は..."}}
===END_TOOL_CALL===
`;
            }

            // Update Debug State visually
            let lastUserInput = "";
            for (let i = apiMessages.length - 1; i >= 0; i--) {
                if (apiMessages[i].role === 'user') {
                    lastUserInput = apiMessages[i].content;
                    break;
                }
            }
            cordDebug.setCordDebugSystemPrompt(systemPrompt);
            cordDebug.setCordDebugInputText(lastUserInput);

            // Call Chat API with Streaming, loop for multi-turn function calls
            setIsStreaming(true);
            setStreamingText('');
            setStreamingThought('');

            let currentApiMessages = [...apiMessages];
            let loopCount = 0;
            const MAX_LOOPS = 5;
            let hasTriggeredWomb = false;
            let hasTriggeredAutoHistory = false;

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

                    let abortController: AbortController | undefined;
                    let stream;
                    if (aiModel === 'glm-4-6') {
                        const { callNovelAIChatStream } = await import('../../utils/novelai');
                        abortController = new AbortController();
                        // tools are ignored in NovelAI for now
                        stream = callNovelAIChatStream(novelAIApiKey, currentApiMessages as any, aiModel, systemPrompt, abortController.signal);
                    } else {
                        stream = callGeminiChatStream(apiKey, currentApiMessages as any, aiModel as any, systemPrompt, cordTools);
                    }

                    for await (const chunk of stream) {
                        if (chunk.textChunk) {
                            accumulatedText += chunk.textChunk;
                            // Remove leading newlines/spaces that some models (like GLM) might return
                            setStreamingText(accumulatedText.trimStart());

                            // Abort streaming early if tool call block is finished
                            if (aiModel === 'glm-4-6' && accumulatedText.includes("===END_TOOL_CALL===")) {
                                if (abortController) abortController.abort();
                                break;
                            }
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

                    // --- Post-Streaming Async Tool Parsing (Fallback logic specifically for models without native tool call like NovelAI) ---
                    let isAsyncParsedTool = false; // Flag to stop recursive loops
                    if (!finalFunctionCall && accumulatedText) {
                        const TOOL_START_TAG = "===BEGIN_TOOL_CALL===";
                        const TOOL_END_TAG = "===END_TOOL_CALL===";
                        if (accumulatedText.includes(TOOL_START_TAG) && accumulatedText.includes(TOOL_END_TAG)) {
                            try {
                                const startIdx = accumulatedText.indexOf(TOOL_START_TAG) + TOOL_START_TAG.length;
                                const endIdx = accumulatedText.indexOf(TOOL_END_TAG, startIdx);
                                if (endIdx !== -1) {
                                    let jsonStr = accumulatedText.substring(startIdx, endIdx).trim();
                                    jsonStr = jsonStr.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
                                    jsonStr = jsonStr.replace(/^```json/g, "").replace(/^```/g, "").replace(/```$/g, "").trim();

                                    const parsedToolCall = JSON.parse(jsonStr);
                                    if (parsedToolCall.name) {
                                        finalFunctionCall = parsedToolCall;
                                        isAsyncParsedTool = true;
                                        console.log("[Async Tool Parser] Successfully extracted tool call from text:", finalFunctionCall);
                                    }
                                }
                            } catch (e) {
                                console.error("[Async Tool Parser Error]", e, "Could not parse JSON block from text.");
                            }
                        }
                    }
                    // ----------------------------------------------------------------------------------------------------------

                    if (finalFunctionCall) {
                        // Function Call Received
                        let functionLogMsg = '';
                        let uiDisplayMsg = '';

                        // Extract any conversational text the AI generated *before* the tool block
                        let textBeforeTool = "";
                        if (isAsyncParsedTool && accumulatedText) {
                            const startIdx = accumulatedText.indexOf("===BEGIN_TOOL_CALL===");
                            if (startIdx > 0) {
                                textBeforeTool = accumulatedText.substring(0, startIdx).trim();
                            }
                        }

                        // Visually add the AI's internal decision to the chat
                        // If there is text before the tool, show it. Otherwise, it's just a tool call.
                        addMessage('ai', textBeforeTool, sessionId, finalFunctionCall, finalRawParts, accumulatedThought || undefined);

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
                                const searchResult = await callGeminiSearch(apiKey, query, aiModel as any);

                                // Show the short completion notification first
                                addMessage('system', sessionLang === 'ja' ? `「${query}」の検索結果を取得しました。` : `Got search results for "${query}".`, sessionId);

                                functionLogMsg = `[Search Results for "${query}"]\n${searchResult}`;
                                uiDisplayMsg = `🔍 **Google Search Results (${query})**\n\n${searchResult}`;
                            } catch (e: any) {
                                functionLogMsg = `[Search Error] ${e.message}`;
                                uiDisplayMsg = sessionLang === 'ja' ? `検索エラーが発生しました。` : `Search error occurred.`;
                            }
                        } else if (finalFunctionCall.name === 'insert_womb_instruction') {
                            const args = finalFunctionCall.args;
                            const instructionText = args.instruction_text;
                            const event = new CustomEvent('womb:insert-instruction', { detail: { instructionText } });
                            window.dispatchEvent(event);

                            functionLogMsg = sessionLang === 'ja' ? 'システム: WOMBにインストラクションを記述しました。ツール呼び出しが終わったら短いテキストで完了を報告してターンを終了してください。' : 'System: Inserted instruction into WOMB. Report completion if no other tools are needed.';
                            uiDisplayMsg = sessionLang === 'ja' ? 'WOMBにインストラクションを記述しました。' : 'Inserted instruction into WOMB.';
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
                                            functionLogMsg = sessionLang === 'ja'
                                                ? `[System] Success. History added to "${matchedById.name}" (ID: ${matchedById.id}).\nシステム: ヒストリーへの追加が完了しました。これ以上のツールの呼び出しは不要です。「${matchedById.name}のヒストリーに追加しました」とテキスト出力してターンを終了してください。`
                                                : `[System] Success. History added to "${matchedById.name}" (ID: ${matchedById.id}).\nSystem: History addition complete. No further tool calls are needed. Output a short confirmation text and end your turn.`;
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
                                            functionLogMsg = sessionLang === 'ja'
                                                ? `[System] Success. History added to "${matches[0].name}" (ID: ${matches[0].id}).\nシステム: ヒストリーへの追加が完了しました。これ以上のツールの呼び出しは不要です。「${matches[0].name}のヒストリーに追加しました」とテキスト出力してターンを終了してください。`
                                                : `[System] Success. History added to "${matches[0].name}" (ID: ${matches[0].id}).\nSystem: History addition complete. No further tool calls are needed. Output a short confirmation text and end your turn.`;
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
                                    functionLogMsg = sessionLang === 'ja'
                                        ? `[System] Success. Executed with provided ID.\nシステム: ヒストリーへの追加が完了しました。これ以上のツールの呼び出しは不要です。完了した旨をテキスト出力してターンを終了してください。`
                                        : `[System] Success. Executed with provided ID.\nSystem: History addition complete. No further tool calls are needed. Output a short confirmation text and end your turn.`;
                                }
                            }

                            uiDisplayMsg = functionLogMsg;
                            if (isResolved && targetEntityId) {
                                const event = new CustomEvent('womb:add-history', { detail: { entityId: targetEntityId, historyText } });
                                window.dispatchEvent(event);
                                uiDisplayMsg = `${targetEntityName}(${targetEntityId})のヒストリーに追記しました(${storyTitle})`;
                            }
                        } else if (finalFunctionCall.name === 'trigger_auto_history') {
                            if (hasTriggeredAutoHistory) {
                                functionLogMsg = sessionLang === 'ja'
                                    ? "システムエラー: すでにこのターンで抽出を実行済です。短い完了応答を出力して終了してください。"
                                    : "System Error: Extraction already triggered. Output a short confirmation text and end your turn.";
                            } else if (triggerAutoHistory) {
                                hasTriggeredAutoHistory = true;
                                triggerAutoHistory();
                                functionLogMsg = sessionLang === 'ja' ? "システム: 自動ヒストリー抽出を開始しました。これ以上のツール呼び出しは不要です。「ヒストリーの抽出を開始しました」とテキスト出力してターンを終了してください。" : "System: Started automatic history extraction. No further tool calls are needed. Output a short confirmation text and end your turn.";
                            } else {
                                functionLogMsg = "[System Error] triggerAutoHistory is not available.";
                            }
                            uiDisplayMsg = sessionLang === 'ja' ? "本文からの自動ヒストリー抽出処理を開始しました。変更があった場合はまもなく反映されます。" : "Started automatic history extraction from the text. Changes will be reflected shortly if any are found.";
                        } else if (finalFunctionCall.name === 'trigger_womb_generation') {
                            if (hasTriggeredWomb) {
                                functionLogMsg = sessionLang === 'ja'
                                    ? "システムエラー: すでにこのターンでWOMBをトリガーしています。これ以上のツール呼び出しは不要です。「生成を開始しました」などの短いテキストを返答して終了してください。"
                                    : "System Error: WOMB already triggered. Output a short confirmation text and end your turn.";
                                uiDisplayMsg = functionLogMsg;
                            } else if (triggerWombGeneration) {
                                hasTriggeredWomb = true;
                                const blueprintText = finalFunctionCall.args?.blueprint_text || accumulatedText;

                                if (aiModel === 'glm-4-6') {
                                    // GLM-4 specific: Wait for WOMB to finish before acknowledging the tool
                                    // This completely prevents 429 concurrent limit errors on NovelAI.
                                    addMessage('system', sessionLang === 'ja' ? "WOMBでの自動生成完了を待機しています..." : "Waiting for WOMB generation to complete...", sessionId);

                                    await triggerWombGeneration(blueprintText);

                                    // Wait for Auto-History to finish if it got triggered by the generation save process
                                    if (checkIsBackgroundProcessing) {
                                        // Give the WOMB save process a tiny head start to sync state (evaluateBackgroundTrigger)
                                        await new Promise(resolve => setTimeout(resolve, 500));

                                        if (checkIsBackgroundProcessing()) {
                                            console.log("[CORD] Waiting for background auto-history extraction to complete...");
                                            addMessage('system', sessionLang === 'ja' ? "背景での自動ヒストリー抽出の完了を待機しています..." : "Waiting for background auto-history extraction...", sessionId);
                                            while (checkIsBackgroundProcessing()) {
                                                await new Promise(resolve => setTimeout(resolve, 1500));
                                            }
                                        }
                                    }

                                    functionLogMsg = sessionLang === 'ja'
                                        ? "システム: WOMBでの本文生成が完了しました。これ以上の操作は不要です。「生成が完了しました」等の短いテキストを返答してターンを終了してください。"
                                        : "System: WOMB generation has completed. No further tool calls are needed. Output a short confirmation text and end your turn.";
                                    uiDisplayMsg = sessionLang === 'ja' ? "WOMBでの本文生成が完了しました。" : "WOMB generation completed.";
                                } else {
                                    // Gemini specific: Fire and forget
                                    triggerWombGeneration(blueprintText);

                                    // Wait for Auto-History to finish if it got triggered by the generation save process
                                    if (checkIsBackgroundProcessing) {
                                        // Give the WOMB save process a tiny head start to sync state (evaluateBackgroundTrigger)
                                        await new Promise(resolve => setTimeout(resolve, 500));

                                        if (checkIsBackgroundProcessing()) {
                                            console.log("[CORD] Waiting for background auto-history extraction to complete...");
                                            addMessage('system', sessionLang === 'ja' ? "背景での自動ヒストリー抽出の完了を待機しています..." : "Waiting for background auto-history extraction...", sessionId);
                                            while (checkIsBackgroundProcessing()) {
                                                await new Promise(resolve => setTimeout(resolve, 1500));
                                            }
                                        }
                                    }

                                    functionLogMsg = sessionLang === 'ja'
                                        ? "システム: Narrative Blueprintを作成し、WOMBに送信しました。これ以上のツール呼び出しは不要です。「WOMBにて生成を開始しました」とテキスト出力してターンを終了してください。"
                                        : "System: The Narrative Blueprint is created and sent to WOMB. No further tool calls are needed. Output a short text like '[Generating in WOMB]' to end your turn.";
                                    uiDisplayMsg = sessionLang === 'ja' ? "Narrative Blueprintを作成し、WOMBに送信しました。" : "The Narrative Blueprint is created and sent to WOMB.";
                                }
                            } else {
                                functionLogMsg = "[System Error] triggerWombGeneration is not available.";
                                uiDisplayMsg = functionLogMsg;
                            }
                        } else {
                            // Unknown function
                            functionLogMsg = `[System] Unknown function called: ${finalFunctionCall.name}`;
                            uiDisplayMsg = functionLogMsg;
                        }

                        // Prepare function response and update message history for the next loop
                        const funcCallMsg: ChatMessageData = {
                            role: 'ai',
                            // For GLM-4, store ONLY the conversational part of the text so the system remembers the AI spoke
                            content: textBeforeTool,
                            functionCall: finalFunctionCall,
                            rawParts: isAsyncParsedTool ? [{ text: textBeforeTool }] : finalRawParts
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
                        const finalText = accumulatedText ? accumulatedText.trimStart() : '';
                        addMessage('ai', finalText, sessionId, undefined, finalRawParts, accumulatedThought || undefined);

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
