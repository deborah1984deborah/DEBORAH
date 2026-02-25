export interface Entity {
    name: string
    keywords: string[]
}

export interface Character extends Entity {
    id: string
    type: 'fuckmeat' | 'penis'
    // name is inherited from Entity
    age: string
    history: string
    createdAt: number

    // Optional fields in base, required in Fuckmeat
    face?: string
    height?: string
    bust?: string
    waist?: string
    hip?: string
}

export interface Fuckmeat extends Character {
    type: 'fuckmeat'
    face: string
    height: string
    bust: string
    waist: string
    hip: string
}

export interface Penis extends Character {
    type: 'penis'
    // face, height, measurements are not used/required
}

export type MommyCharacter = Fuckmeat
export type NerdCharacter = Penis

export interface Lore extends Entity {
    id: string
    type: 'lore'
    // name is inherited from Entity
    // keywords is inherited from Entity
    summary: string // 概要
    isAlwaysActive: boolean
    createdAt: number
}

export type LoreItem = Fuckmeat | Penis | Lore;


// Story Interface
export interface StoryVersion {
    id: string; // Unique ID for this version (e.g., v_timestamp)
    parentId: string | null; // ID of the version this branched from (null for initial)
    content: string; // The text content at this version
    savedAt: number; // Timestamp of save
    saveType: 'manual' | 'generate_pre' | 'generate_post'; // How this version was created
    autoHistoryGenerated?: boolean; // Flag indicating if CORD background history was generated for this version
}

export interface Story {
    id: string;
    title: string;
    currentVersionId: string; // The active version being edited/viewed
    versions: StoryVersion[]; // All versions of this story
    createdAt: number;
    updatedAt: number;
}

// Relational Table for Story <-> Entity (Join Table)
export interface StoryLoreRelation {
    id: string;
    storyId: string;
    entityId: string;
    entityType: 'mommy' | 'nerd' | 'lore';
}

// History Log for an Entity within a specific Story
export interface StoryEntityHistory {
    id: string;
    storyId: string;
    versionId: string; // The specific version ID when this history was created/active
    entityId: string;
    content: string; // Restored
    createdAt: number;
}

export interface StoryEntityHistoryInvalidation {
    historyId: string; // The ID of the history record being invalidated
    versionId: string; // The specific version ID of the story when this invalidation occurred
}

// CORD Chat Interfaces
export interface ChatSession {
    id: string;
    title: string;
    storyId?: string; // Optional: Link to a specific Story
    isGlobal?: boolean; // Flag for global chats
    isAwareOfWombStory?: boolean; // Flag for WOMB Context awareness
    createdAt: number;
    updatedAt: number;
}

export interface ChatMessage {
    id: string;
    sessionId: string;
    role: 'user' | 'ai' | 'system' | 'function'; // Added function role
    content: string;
    createdAt: number;
    functionCall?: any; // Added for Tool Calling
    rawParts?: any[]; // Added to preserve Gemini API 'thought' or 'thought_signature' across conversation history
    thoughtSummary?: string; // Human-readable output from the model's Thinking Process
}

// WOMB Generation Interaction Log
export interface WombChatInteraction {
    id: string;
    storyId: string;
    role: 'user' | 'ai' | 'system';
    content: string;
    rawParts?: any[];
    thoughtSummary?: string;
    createdAt: number;
    chunkId?: number; // Used to separate context windows (0-indexed)
}
