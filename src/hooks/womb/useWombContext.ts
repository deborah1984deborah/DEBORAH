import { useCallback } from 'react';
import { StoryEntityHistory } from '../../types';

interface UseWombContextProps {
    content: string;
    keywordScanRange: number;
    wombContextLength: number;
    mommyList: any[];
    nerdList: any[];
    loreList: any[];
    activeMommyIds: string[];
    activeNerdIds: string[];
    activeLoreIds: string[];
    activeHistoryLogs: StoryEntityHistory[];
    currentStoryId: string | null;
}

export const useWombContext = ({
    content,
    keywordScanRange,
    wombContextLength,
    mommyList,
    nerdList,
    loreList,
    activeMommyIds,
    activeNerdIds,
    activeLoreIds,
    activeHistoryLogs,
    currentStoryId
}: UseWombContextProps) => {

    const buildWombContext = useCallback(async () => {
        const { parseStoryContent } = await import('../../utils/bison');
        const cleanedContent = parseStoryContent(content);

        const scanTargetContent = cleanedContent.slice(-keywordScanRange);

        const allLoreItems = [...mommyList, ...nerdList, ...loreList];

        const allActiveLoreItems = [
            ...mommyList.filter(item => activeMommyIds.includes(item.id)),
            ...nerdList.filter(item => activeNerdIds.includes(item.id)),
            ...loreList.filter(item => activeLoreIds.includes(item.id))
        ];

        const matchedLoreItems = allActiveLoreItems.filter(item => {
            if ('isAlwaysActive' in item && item.isAlwaysActive) return true;
            const nameMatch = scanTargetContent.includes(item.name);
            const keywordMatch = item.keywords.some((kw: string) => scanTargetContent.includes(kw));
            return nameMatch || keywordMatch;
        });

        let systemInstruction = `=== WRITING INSTRUCTIONS ===
You are an expert AI co-writer (codename: WOMB). 
The user is writing a story. You must continue the story naturally based on the provided text.

CRITICAL RULE:
If you see lines enclosed in "#region" and "#endregion" that start with "//", these are DIRECT META-INSTRUCTIONS from the author to you. 
Example:
#region
// Make the next scene more dramatic and focus on Deborah's anger.
#endregion

Do NOT output these instructions in your generated text. Instead, strictly FOLLOW the instructions provided in those lines when writing the continuation of the story.
===========================
`;
        let textToSend = cleanedContent;
        if (textToSend.length > wombContextLength) {
            textToSend = textToSend.substring(textToSend.length - wombContextLength);

            let balance = 0;
            let lastOrphanedEndIndex = -1;

            const tokenRegex = /#(region|endregion)\b/g;
            let match;

            while ((match = tokenRegex.exec(textToSend)) !== null) {
                if (match[1] === 'region') {
                    balance++;
                } else if (match[1] === 'endregion') {
                    if (balance === 0) {
                        lastOrphanedEndIndex = match.index + match[0].length;
                    } else {
                        balance--;
                    }
                }
            }

            if (lastOrphanedEndIndex !== -1) {
                textToSend = textToSend.substring(lastOrphanedEndIndex);
                textToSend = textToSend.replace(/^\s+/, '');
                console.log(`[useWombContext] Removed orphaned #endregion(s) from truncated text. (Cut ${lastOrphanedEndIndex} chars)`);
            }

            console.log(`[useWombContext] Truncated story text to last ${textToSend.length} chars (Target: ${wombContextLength})`);
        }


        let dynamicStoryContext = `==========================================
【The Main Story User is Writing】
==========================================
${textToSend}
==========================================`;
        let entityContext = "";

        if (matchedLoreItems.length > 0) {
            entityContext = matchedLoreItems.map(item => {
                if (item.type === 'lore') {
                    return `Name: ${item.name}, Summary: ${item.summary}`;
                } else if (item.type === 'fuckmeat') {
                    return `Name: ${item.name}, Age: ${item.age}, Face: ${item.face}, Height: ${item.height}(cm), Measurements: B${item.bust}/W${item.waist}/H${item.hip}(cm), History: ${item.history}`;
                } else if (item.type === 'penis') {
                    return `Name: ${item.name}, Age: ${item.age}, History: ${item.history}`;
                }
                return "";
            }).join('\n');

            const relevantHistory = activeHistoryLogs
                .filter((log: StoryEntityHistory) => log.storyId === currentStoryId && matchedLoreItems.some(item => item.id === log.entityId))
                .sort((a: StoryEntityHistory, b: StoryEntityHistory) => a.createdAt - b.createdAt);

            if (relevantHistory.length > 0) {
                const historyStr = matchedLoreItems.map(item => {
                    const logsForEntity = relevantHistory.filter(log => log.entityId === item.id);
                    if (logsForEntity.length === 0) return "";
                    const evStr = logsForEntity.map(log => `- ${log.content}`).join('\n');
                    return `\n[Recent History for ${item.name}]\n${evStr}`;
                }).filter(Boolean).join('\n');

                if (historyStr) {
                    entityContext += `\n\n=== PAST EVENTS IN THIS STORY ===${historyStr}`;
                }
            }
            dynamicStoryContext += `\n\n--- Lorebook Context ---\n${entityContext}`;
        }

        const derivedTitle = content.split('\n')[0]?.trim() || "Untitled Story";

        return { systemInstruction, dynamicStoryContext, entityContext, scanTargetContent, matchedLoreItems, allActiveLoreItems, allLoreItems, cleanedContent, storyTitle: derivedTitle };
    }, [content, keywordScanRange, wombContextLength, mommyList, activeMommyIds, nerdList, activeNerdIds, loreList, activeLoreIds, activeHistoryLogs, currentStoryId]);

    return {
        buildWombContext
    };
};
