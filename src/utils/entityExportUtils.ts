import JSZip from 'jszip';
import { LoreItem } from '../types';

export const exportAllEntitiesAsZip = async (
    mommyList: LoreItem[],
    nerdList: LoreItem[],
    loreList: LoreItem[]
): Promise<boolean> => {
    try {
        const zip = new JSZip();

        // Helper to add a list of items to a specific folder in the zip
        const addFolderToZip = (folderName: string, items: LoreItem[]) => {
            const folder = zip.folder(folderName);
            if (!folder) return;

            items.forEach(item => {
                // Sanitize filename to prevent invalid characters in zip
                const safeName = item.name.replace(/[/\\?%*:|"<>]/g, '_') || 'unnamed';
                const filename = `${safeName}_${item.id}.json`;

                // Format the JSON data nicely with 2 spaces
                const jsonContent = JSON.stringify(item, null, 2);
                folder.file(filename, jsonContent);
            });
        };

        // Add each list to its respective folder
        addFolderToZip('mommy', mommyList);
        addFolderToZip('nerd', nerdList);
        addFolderToZip('lore', loreList);

        // Generate the ZIP file as a Blob
        const blob = await zip.generateAsync({ type: 'blob' });

        // Create a download link and trigger it
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `deborah_entities_${timestamp}.zip`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('[exportAllEntitiesAsZip] Failed to generate ZIP:', error);
        return false;
    }
};
