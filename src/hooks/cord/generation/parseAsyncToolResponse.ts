export interface ParsedAsyncToolResponse {
    finalFunctionCall: any | undefined;
    textBeforeTool: string | undefined;
}

export const parseAsyncToolResponse = (accumulatedText: string): ParsedAsyncToolResponse => {
    let finalFunctionCall: any = undefined;
    let textBeforeTool: string | undefined = undefined;

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
                    console.log("[Async Tool Parser] Successfully extracted tool call from text:", finalFunctionCall);

                    // Extract text before tool
                    const preToolIdx = accumulatedText.indexOf(TOOL_START_TAG);
                    if (preToolIdx > 0) {
                        textBeforeTool = accumulatedText.substring(0, preToolIdx).trim();
                    }
                }
            }
        } catch (e) {
            console.error("[Async Tool Parser Error]", e, "Could not parse JSON block from text.");
        }
    }

    return { finalFunctionCall, textBeforeTool };
};
