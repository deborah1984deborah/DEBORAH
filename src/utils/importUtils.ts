import { Story, StoryEntityHistory } from '../types';

export interface ExportedStoryData {
    version: '1.0';
    exportedAt: number;
    story: Story;
    activeLores: {
        entityId: string;
        entityType: 'mommy' | 'nerd' | 'lore';
    }[];
    loreHistory: StoryEntityHistory[];
}

export const readImportedStoryData = (file: File): Promise<ExportedStoryData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                if (!event.target?.result) {
                    throw new Error("File reading yielded no result.");
                }
                const jsonData = JSON.parse(event.target.result as string);

                // Basic validation
                if (jsonData.version !== '1.0') {
                    throw new Error("Unsupported version format.");
                }
                if (!jsonData.story || !jsonData.story.id) {
                    throw new Error("Invalid story data.");
                }

                resolve(jsonData as ExportedStoryData);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsText(file);
    });
};
