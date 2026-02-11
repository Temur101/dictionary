export interface Word {
    id: string;
    en: string;
    ru: string;
    description?: string;
    list_id: string;
    user_id: string;
    created_at: string;
}

export interface List {
    id: string;
    title: string;
    user_id: string;
    created_at: string;
    // Note: wordIds is a virtual field in our app state, but in DB it's linked via words table
    wordIds: string[];
}

export interface GameSession {
    id?: string;
    user_id: string;
    list_ids: string[];
    mode: GameMode;
    current_word_index: number;
    // answers structure: { word_id, answer, correct }
    answers: Array<{
        word_id: string;
        answer: string;
        correct: boolean;
    }>;
    is_finished: boolean;
    started_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    email: string;
    name?: string;
}

export interface GameResult {
    id: string;
    date: number;
    totalQuestions: number;
    correctCount: number;
    percentage: number;
    incorrectWords: string[]; // word IDs
}

export interface GameStats {
    totalGames: number;
    averagePercentage: number;
    history: GameResult[];
}

export type AppView = 'main' | 'game' | 'stats' | 'notFound';
export type AppTheme = 'light' | 'dark' | 'blue' | 'orange' | 'purple' | 'green' | 'red' | 'pink';
export type AppLanguage = 'en' | 'ru';
export type GameMode = 'regular' | 'timed' | 'reverse';
