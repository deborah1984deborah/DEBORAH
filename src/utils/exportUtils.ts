import { Story, StoryEntityHistory, StoryLoreRelation } from '../types';

interface ExportedStoryData {
    version: '1.0';
    exportedAt: number;
    story: Story;
    activeLores: {
        entityId: string;
        entityType: 'mommy' | 'nerd' | 'lore';
    }[];
    loreHistory: StoryEntityHistory[];
}

export const exportStoryData = (
    storyId: string,
    stories: Story[],
    globalRelations: StoryLoreRelation[],
    historyLogs: StoryEntityHistory[],
    activeMommyIds: string[],
    activeNerdIds: string[],
    activeLoreIds: string[]
) => {
    const story = stories.find(s => s.id === storyId);
    if (!story) {
        console.error(`[exportStoryData] Story with ID ${storyId} not found.`);
        return false;
    }

    // Combine all currently active entity IDs for this specific story
    const activeEntityIds = [...activeMommyIds, ...activeNerdIds, ...activeLoreIds];

    // Get relations for this story that are CURRENTLY active in the editor
    const activeLores = globalRelations
        .filter(rel => rel.storyId === storyId && activeEntityIds.includes(rel.entityId))
        .map(rel => ({
            entityId: rel.entityId,
            entityType: rel.entityType
        }));

    // Get all history logs associated with this story
    const storyHistory = historyLogs.filter(log => log.storyId === storyId);

    const exportData: ExportedStoryData = {
        version: '1.0',
        exportedAt: Date.now(),
        story,
        activeLores,
        loreHistory: storyHistory
    };

    try {
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const safeTitle = story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'story';
        const filename = `deborah_export_${safeTitle}_${Date.now()}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('[exportStoryData] Failed to generate download:', error);
        return false;
    }
};
