// src/utils/storageUtils.ts

const DB_NAME = 'DeborahSystemDB';
const DB_VERSION = 2; // Incremented to 2 to create cord_store for existing users

// Define stores we will use
export const STORES = {
    STORIES: 'stories_store',       // For womb_stories (Large JSON array)
    RELATIONS: 'relations_store',   // For womb_story_relations
    LORE: 'lore_store',             // For deborah_fuckmeat_v1, deborah_penis_v1, deborah_lore_v1
    HISTORY: 'history_store',       // For deborah_history_logs_v1, invalidations
    SETTINGS: 'settings_store',     // For fallback/settings
    CORD: 'cord_store'              // For cord_chat_sessions, cord_chat_messages_[ID]
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

// Initialize the database
const initDB = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create object stores if they don't exist
            Object.values(STORES).forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    // We just use a simple key-value store for now to mimic LocalStorage behavior
                    db.createObjectStore(storeName);
                }
            });
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
            reject((event.target as IDBOpenDBRequest).error);
        };
    });

    return dbPromise;
};

// Generic get item
export const getItem = async <T>(storeName: string, key: string): Promise<T | null> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result !== undefined ? request.result : null);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error(`Error getting item [${key}] from [${storeName}]:`, error);
        return null;
    }
};

// Generic set item
export const setItem = async <T>(storeName: string, key: string, value: T): Promise<void> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(value, key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error(`Error setting item [${key}] in [${storeName}]:`, error);
        throw error;
    }
};

// Generic remove item
export const removeItem = async (storeName: string, key: string): Promise<void> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error(`Error removing item [${key}] from [${storeName}]:`, error);
        throw error;
    }
};

// --- Migration Utility ---

/**
 * Migrates data from LocalStorage to IndexedDB.
 * Call this once during application startup.
 */
export const migrateFromLocalStorage = async (): Promise<boolean> => {
    console.log("[StorageMigration] Starting migration check...");

    const isCoreMigrated = localStorage.getItem('deborah_migration_completed') === 'true';
    const isCordMigrated = localStorage.getItem('cord_migration_completed') === 'true';

    if (isCoreMigrated && isCordMigrated) {
        console.log("[StorageMigration] All migrations already completed.");
        return true;
    }

    try {
        // Function to safely move a key to a specific store
        const migrateKey = async (localKey: string, storeName: string, asJson: boolean = true) => {
            const data = localStorage.getItem(localKey);
            if (data) {
                console.log(`[StorageMigration] Migrating ${localKey} -> ${storeName}`);
                const parsedData = asJson ? JSON.parse(data) : data;
                await setItem(storeName, localKey, parsedData);
                // We do NOT delete from LocalStorage immediately for safety.
                // localStorage.removeItem(localKey); 
            }
        };

        if (!isCoreMigrated) {
            console.log("[StorageMigration] Migrating core data (stories, lore, history)...");
            // Story Data (The heaviest)
            await migrateKey('womb_stories', STORES.STORIES);
            await migrateKey('womb_story_relations', STORES.RELATIONS);

            // Lore Data
            await migrateKey('deborah_fuckmeat_v1', STORES.LORE);
            await migrateKey('deborah_penis_v1', STORES.LORE);
            await migrateKey('deborah_lore_v1', STORES.LORE);

            // History Data
            await migrateKey('deborah_history_logs_v1', STORES.HISTORY);
            await migrateKey('deborah_history_invalidations_v1', STORES.HISTORY);

            localStorage.setItem('deborah_migration_completed', 'true');
        }

        if (!isCordMigrated) {
            // Cord Chat Data
            console.log("[StorageMigration] Migrating CORD chat data...");
            // 1. Migrate the sessions array
            const sessionsData = localStorage.getItem('cord_chat_sessions');
            if (sessionsData) {
                await migrateKey('cord_chat_sessions', STORES.CORD);
                // 2. Parse sessions to find all message keys and migrate them individually
                try {
                    const sessions = JSON.parse(sessionsData);
                    if (Array.isArray(sessions)) {
                        for (const session of sessions) {
                            if (session.id) {
                                const msgKey = `cord_chat_messages_${session.id}`;
                                await migrateKey(msgKey, STORES.CORD);
                            }
                        }
                    }
                } catch (e) {
                    console.error("[StorageMigration] Failed to parse cord sessions for message migration:", e);
                }
            }

            localStorage.setItem('cord_migration_completed', 'true');
        }

        console.log("[StorageMigration] Migration successfully completed.");
        return true;

    } catch (error) {
        console.error("[StorageMigration] Migration failed:", error);
        return false;
    }
};
