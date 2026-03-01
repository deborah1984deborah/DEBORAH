export interface CordToolHandlerArgs {
    finalFunctionCall: any;
    sessionLang: 'ja' | 'en';
    sessionId: string;
    aiModel: string;
    apiKey: string;
    accumulatedText: string;
    hasTriggeredAutoHistory: boolean;
    hasTriggeredWomb: boolean;
    addMessage: (role: any, content: string, sessionId: string, functionCall?: any) => void;
    triggerAutoHistory?: () => void;
    triggerWombGeneration?: (blueprint: string) => Promise<void>;
    checkIsBackgroundProcessing?: () => boolean;
    getWombContext?: () => Promise<any>;
}

export interface CordToolHandlerResult {
    functionLogMsg: string;
    uiDisplayMsg: string;
    hasTriggeredAutoHistory: boolean;
    hasTriggeredWomb: boolean;
}

export const handleCordToolCall = async (args: CordToolHandlerArgs): Promise<CordToolHandlerResult> => {
    const {
        finalFunctionCall,
        sessionLang,
        sessionId,
        aiModel,
        apiKey,
        accumulatedText,
        addMessage,
        triggerAutoHistory,
        triggerWombGeneration,
        checkIsBackgroundProcessing,
        getWombContext
    } = args;

    let { hasTriggeredAutoHistory, hasTriggeredWomb } = args;
    let functionLogMsg = '';
    let uiDisplayMsg = '';

    if (finalFunctionCall.name === 'search_web') {
        const query = finalFunctionCall.args.query;
        addMessage('system', sessionLang === 'ja' ? `ウェブで「${query}」を検索しています...` : `Searching the web for "${query}"...`, sessionId);
        try {
            const { callGeminiSearch } = await import('../../../utils/gemini');
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
        const instructionText = finalFunctionCall.args.instruction_text;
        const event = new CustomEvent('womb:insert-instruction', { detail: { instructionText } });
        window.dispatchEvent(event);

        functionLogMsg = sessionLang === 'ja' ? 'システム: WOMBにインストラクションを記述しました。ツール呼び出しが終わったら短いテキストで完了を報告してターンを終了してください。' : 'System: Inserted instruction into WOMB. Report completion if no other tools are needed.';
        uiDisplayMsg = sessionLang === 'ja' ? 'WOMBにインストラクションを記述しました。' : 'Inserted instruction into WOMB.';
    } else if (finalFunctionCall.name === 'add_womb_history') {
        const entityArgs = finalFunctionCall.args;
        const entityQuery = entityArgs.entity_query || entityArgs.entityQuery || entityArgs.entity_name || entityArgs.entityName;
        const explicitlyProvidedId = entityArgs.entity_id || entityArgs.entityId;
        const historyText = entityArgs.history_text || entityArgs.historyText || entityArgs.history;

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
                        const { getLevenshteinDistance } = await import('../../../utils/bison');
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
                addMessage('system', sessionLang === 'ja' ? "WOMBでの自動生成完了を待機しています..." : "Waiting for WOMB generation to complete...", sessionId);

                await triggerWombGeneration(blueprintText);

                if (checkIsBackgroundProcessing) {
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
                triggerWombGeneration(blueprintText);

                if (checkIsBackgroundProcessing) {
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
        functionLogMsg = `[System] Unknown function called: ${finalFunctionCall.name}`;
        uiDisplayMsg = functionLogMsg;
    }

    return {
        functionLogMsg,
        uiDisplayMsg,
        hasTriggeredAutoHistory,
        hasTriggeredWomb
    };
};
