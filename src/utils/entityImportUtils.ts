import JSZip from 'jszip';
import { LoreItem } from '../types';

export interface ImportedEntities {
    mommyList: LoreItem[];
    nerdList: LoreItem[];
    loreList: LoreItem[];
}

export const readImportedEntitiesZip = async (file: File): Promise<ImportedEntities> => {
    try {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);

        const result: ImportedEntities = {
            mommyList: [],
            nerdList: [],
            loreList: []
        };

        // Go through each file in the zip
        for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
            // Skip directories and non-JSON files
            if (zipEntry.dir || !relativePath.endsWith('.json')) {
                continue;
            }

            try {
                // Read the file content
                const jsonContent = await zipEntry.async('text');
                const parsedEntity = JSON.parse(jsonContent) as LoreItem;

                // Basic validation: ensure it has an ID and name
                if (!parsedEntity.id || !parsedEntity.name) {
                    console.warn(`[readImportedEntitiesZip] Skipped invalid entity in ${relativePath}`);
                    continue;
                }

                // Determine category based on the folder path
                if (relativePath.startsWith('mommy/')) {
                    result.mommyList.push(parsedEntity);
                } else if (relativePath.startsWith('nerd/')) {
                    result.nerdList.push(parsedEntity);
                } else if (relativePath.startsWith('lore/')) {
                    result.loreList.push(parsedEntity);
                } else {
                    console.warn(`[readImportedEntitiesZip] File ${relativePath} is not in a recognized category folder. Skipped.`);
                }

            } catch (err) {
                console.error(`[readImportedEntitiesZip] Failed to parse ${relativePath}:`, err);
            }
        }

        return result;
    } catch (error) {
        console.error('[readImportedEntitiesZip] Failed to read ZIP file:', error);
        throw error;
    }
};
