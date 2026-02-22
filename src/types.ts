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
export interface Story {
    id: string;
    title: string;
    content: string;
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
    entityId: string;
    content: string; // Restored
    createdAt: number;
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
}
