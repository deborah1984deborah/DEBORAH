import { useState } from 'react';

export const useCordDebug = () => {
    // Debug State for CORD
    const [cordDebugSystemPrompt, setCordDebugSystemPrompt] = useState<string>('');
    const [cordDebugInputText, setCordDebugInputText] = useState<string>('');
    const [cordDebugMatchedEntities, setCordDebugMatchedEntities] = useState<any[]>([]);

    return {
        cordDebugSystemPrompt,
        setCordDebugSystemPrompt,
        cordDebugInputText,
        setCordDebugInputText,
        cordDebugMatchedEntities,
        setCordDebugMatchedEntities
    };
};
