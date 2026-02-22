import { useState, useEffect } from 'react';
import { LoreItem, StoryLoreRelation } from '../../types';

export const useWombLore = () => {
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

    // Load initial Lore data on mount
    useEffect(() => {
        const storedMommy = localStorage.getItem('deborah_fuckmeat_v1');
        if (storedMommy) { try { setMommyList(JSON.parse(storedMommy)); } catch (e) { console.error(e); } }

        const storedNerd = localStorage.getItem('deborah_penis_v1');
        if (storedNerd) { try { setNerdList(JSON.parse(storedNerd)); } catch (e) { console.error(e); } }

        const storedLore = localStorage.getItem('deborah_lore_v1');
        if (storedLore) { try { setLoreList(JSON.parse(storedLore)); } catch (e) { console.error(e); } }

        const storedRelations = localStorage.getItem('womb_story_relations');
        if (storedRelations) { try { setGlobalRelations(JSON.parse(storedRelations)); } catch (e) { console.error(e); } }
    }, []);

    return {
        mommyList, setMommyList,
        nerdList, setNerdList,
        loreList, setLoreList,
        activeMommyIds, setActiveMommyIds,
        activeNerdIds, setActiveNerdIds,
        activeLoreIds, setActiveLoreIds,
        globalRelations, setGlobalRelations
    };
};
