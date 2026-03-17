import { useState, useEffect } from 'react';
import { LoreItem, StoryLoreRelation } from '../../types';
import { getItem, STORES } from '../../utils/storageUtils';

export const useWombLore = () => {
    // Status State
    const [isLoreReady, setIsLoreReady] = useState<boolean>(false);

    // Lore Data (Loaded from main storage)
    const [mommyList, setMommyList] = useState<LoreItem[]>([]);
    const [nerdList, setNerdList] = useState<LoreItem[]>([]);
    const [loreList, setLoreList] = useState<LoreItem[]>([]);

    // Active Lore State for Current Story
    const [activeMommyIds, setActiveMommyIds] = useState<string[]>([]);
    const [activeNerdIds, setActiveNerdIds] = useState<string[]>([]);
    const [activeLoreIds, setActiveLoreIds] = useState<string[]>([]);

    // Global Relations State (Join Table)
    const [globalRelations, setGlobalRelations] = useState<StoryLoreRelation[]>([]);

    // Load initial Lore data on mount asynchronously from IndexedDB
    useEffect(() => {
        let isMounted = true;

        const loadLoreData = async () => {
            try {
                const storedMommy = await getItem<LoreItem[]>(STORES.LORE, 'deborah_fuckmeat_v1');
                if (storedMommy && isMounted) setMommyList(storedMommy);

                const storedNerd = await getItem<LoreItem[]>(STORES.LORE, 'deborah_penis_v1');
                if (storedNerd && isMounted) setNerdList(storedNerd);

                const storedLore = await getItem<LoreItem[]>(STORES.LORE, 'deborah_lore_v1');
                if (storedLore && isMounted) setLoreList(storedLore);

                const storedRelations = await getItem<StoryLoreRelation[]>(STORES.RELATIONS, 'womb_story_relations');
                if (storedRelations && isMounted) setGlobalRelations(storedRelations);

            } catch (error) {
                console.error("Failed to load lore data from IndexedDB:", error);
            } finally {
                if (isMounted) setIsLoreReady(true);
            }
        };

        loadLoreData();

        return () => {
            isMounted = false;
        };
    }, []);

    return {
        isLoreReady,
        mommyList, setMommyList,
        nerdList, setNerdList,
        loreList, setLoreList,
        activeMommyIds, setActiveMommyIds,
        activeNerdIds, setActiveNerdIds,
        activeLoreIds, setActiveLoreIds,
        globalRelations, setGlobalRelations
    };
};
