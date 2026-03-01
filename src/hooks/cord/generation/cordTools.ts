export const getCordTools = (sessionLang: 'ja' | 'en') => {
    return [{
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
                ? "ユーザーから「今の本文からヒストリーを抽出して」「ヒストリーに最新の流れを反映して」のように自動抽出を依頼された場合に使用します。内部で本文の差分解析プロセスを強制起動し、対象キャラクターのHistoryを自動更新させます。"
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
};
