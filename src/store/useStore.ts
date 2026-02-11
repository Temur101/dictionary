import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { List, Word, GameStats, GameResult, AppView, AppTheme, AppLanguage, GameMode, GameSession, User } from '../types';
import { supabase } from '../lib/supabase';

interface AppState {
    // Data
    lists: List[];
    words: Word[];
    stats: GameStats;

    // Navigation/UI
    view: AppView;
    activeListId: string | null;
    isTranslatorOpen: boolean;
    theme: AppTheme;
    language: AppLanguage;
    gameMode: GameMode;
    isGameActive: boolean;
    user: User | null;
    gameSession: GameSession | null;
    isLoading: boolean;

    // Actions - Data Initialization
    fetchUserData: () => Promise<void>;

    // Actions - Lists
    addList: (title: string) => Promise<void>;
    deleteList: (id: string) => Promise<void>;
    selectList: (id: string | null) => void;

    // Actions - Words
    addWord: (en: string, ru: string, description?: string) => Promise<void>;
    updateWord: (id: string, updates: Partial<Word>) => Promise<void>;
    deleteWord: (id: string) => Promise<void>;

    // Actions - Stats
    addGameResult: (result: Omit<GameResult, 'id' | 'date'>) => Promise<void>;

    // Actions - Game Session
    startDbSession: (list_ids: string[], mode: GameMode) => Promise<void>;
    updateDbSession: (updates: Partial<GameSession>) => Promise<void>;
    finishDbSession: () => Promise<void>;

    // Navigation/UI
    setView: (view: AppView) => void;
    setTranslatorOpen: (open: boolean) => void;
    setTheme: (theme: AppTheme) => void;
    setLanguage: (lang: AppLanguage) => void;
    setGameMode: (mode: GameMode) => void;
    setGameActive: (active: boolean) => void;
    setUser: (user: User | null) => void;
    logout: () => Promise<void>;
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            lists: [],
            words: [],
            stats: {
                totalGames: 0,
                averagePercentage: 0,
                history: [],
            },
            view: 'main',
            activeListId: null,
            isTranslatorOpen: false,
            theme: 'light',
            language: 'en',
            gameMode: 'regular',
            isGameActive: false,
            user: null,
            gameSession: null,
            isLoading: false,

            fetchUserData: async () => {
                const user = get().user;
                if (!user) return;

                set({ isLoading: true });
                try {
                    // Fetch lists
                    const { data: dbLists } = await supabase
                        .from('lists')
                        .select('*')
                        .eq('user_id', user.id);

                    // Fetch words
                    const { data: dbWords } = await supabase
                        .from('words')
                        .select('*')
                        .eq('user_id', user.id);

                    // Fetch game sessions (most recent active one)
                    const { data: activeSessions } = await supabase
                        .from('game_sessions')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('is_finished', false)
                        .order('updated_at', { ascending: false })
                        .limit(1);

                    // Fetch finished sessions for stats
                    const { data: finishedSessions } = await supabase
                        .from('game_sessions')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('is_finished', true);

                    // Map DB records to state
                    const words = (dbWords || []) as Word[];
                    const lists = (dbLists || []).map(l => ({
                        ...l,
                        wordIds: words.filter(w => w.list_id === l.id).map(w => w.id)
                    })) as List[];

                    // Calculate stats from finished sessions
                    const history: GameResult[] = (finishedSessions || []).map(s => {
                        const correctCount = s.answers.filter((a: any) => a.correct).length;
                        const totalQuestions = s.answers.length;
                        return {
                            id: s.id,
                            date: new Date(s.started_at).getTime(),
                            totalQuestions,
                            correctCount,
                            percentage: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
                            incorrectWords: s.answers.filter((a: any) => !a.correct).map((a: any) => a.word_id)
                        };
                    });

                    const totalGames = history.length;
                    const averagePercentage = totalGames > 0
                        ? history.reduce((acc, curr) => acc + curr.percentage, 0) / totalGames
                        : 0;

                    set({
                        lists,
                        words,
                        stats: { totalGames, averagePercentage, history },
                        gameSession: activeSessions?.[0] || null,
                        isLoading: false
                    });
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    set({ isLoading: false });
                }
            },

            addList: async (title) => {
                const user = get().user;
                if (!user) return;

                const { data, error } = await supabase
                    .from('lists')
                    .insert([{ title, user_id: user.id }])
                    .select()
                    .single();

                if (data && !error) {
                    const newList: List = { ...data, wordIds: [] };
                    set(state => ({ lists: [...state.lists, newList] }));
                }
            },

            deleteList: async (id) => {
                const { error } = await supabase
                    .from('lists')
                    .delete()
                    .eq('id', id);

                if (!error) {
                    set(state => ({
                        lists: state.lists.filter(l => l.id !== id),
                        words: state.words.filter(w => w.list_id !== id),
                        activeListId: state.activeListId === id ? null : state.activeListId,
                    }));
                }
            },

            selectList: (id) => set({ activeListId: id }),

            addWord: async (en, ru, description) => {
                const { user, activeListId } = get();
                if (!user || !activeListId) return;

                const { data, error } = await supabase
                    .from('words')
                    .insert([{
                        en,
                        ru,
                        description,
                        list_id: activeListId,
                        user_id: user.id
                    }])
                    .select()
                    .single();

                if (data && !error) {
                    const newWord = data as Word;
                    set(state => ({
                        words: [...state.words, newWord],
                        lists: state.lists.map(l =>
                            l.id === activeListId
                                ? { ...l, wordIds: [...l.wordIds, newWord.id] }
                                : l
                        )
                    }));
                }
            },

            updateWord: async (id, updates) => {
                const { error } = await supabase
                    .from('words')
                    .update(updates)
                    .eq('id', id);

                if (!error) {
                    set(state => ({
                        words: state.words.map(w => w.id === id ? { ...w, ...updates } : w)
                    }));
                }
            },

            deleteWord: async (id) => {
                const word = get().words.find(w => w.id === id);
                if (!word) return;

                const { error } = await supabase
                    .from('words')
                    .delete()
                    .eq('id', id);

                if (!error) {
                    set(state => ({
                        words: state.words.filter(w => w.id !== id),
                        lists: state.lists.map(l =>
                            l.id === word.list_id
                                ? { ...l, wordIds: l.wordIds.filter(wid => wid !== id) }
                                : l
                        )
                    }));
                }
            },

            addGameResult: async (resultData) => {
                // For now we still use local history for stats display or we could create a results table
                // Let's create a result entry locally for simplicity, or handle it via session history
                const newResult: GameResult = {
                    ...resultData,
                    id: crypto.randomUUID(),
                    date: Date.now(),
                };

                set(state => {
                    const newHistory = [...state.stats.history, newResult];
                    const totalGames = newHistory.length;
                    const averagePercentage = newHistory.reduce((acc, curr) => acc + curr.percentage, 0) / totalGames;
                    return {
                        stats: { totalGames, averagePercentage, history: newHistory }
                    };
                });
            },

            startDbSession: async (list_ids, mode) => {
                const user = get().user;
                if (!user) return;

                // Mark previous sessions as finished (optional cleanup)
                await supabase
                    .from('game_sessions')
                    .update({ is_finished: true })
                    .eq('user_id', user.id)
                    .eq('is_finished', false);

                const { data, error } = await supabase
                    .from('game_sessions')
                    .insert([{
                        user_id: user.id,
                        list_ids,
                        mode,
                        current_word_index: 0,
                        answers: [],
                        is_finished: false,
                        started_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (data && !error) {
                    set({ gameSession: data as GameSession });
                }
            },

            updateDbSession: async (updates) => {
                const session = get().gameSession;
                if (!session?.id) return;

                const fullUpdates = { ...updates, updated_at: new Date().toISOString() };

                const { error } = await supabase
                    .from('game_sessions')
                    .update(fullUpdates)
                    .eq('id', session.id);

                if (!error) {
                    set(state => ({
                        gameSession: state.gameSession ? { ...state.gameSession, ...fullUpdates } : null
                    }));
                }
            },

            finishDbSession: async () => {
                const session = get().gameSession;
                if (!session?.id) return;

                await supabase
                    .from('game_sessions')
                    .update({ is_finished: true, updated_at: new Date().toISOString() })
                    .eq('id', session.id);

                set({ gameSession: null });
            },

            setView: (view) => set({ view }),
            setTranslatorOpen: (open) => set({ isTranslatorOpen: open }),
            setTheme: (theme) => set({ theme }),
            setLanguage: (language) => set({ language }),
            setGameMode: (gameMode) => set({ gameMode }),
            setGameActive: (isGameActive) => set({ isGameActive }),
            setUser: (user) => set({ user }),
            logout: async () => {
                await supabase.auth.signOut();
                set({ user: null, gameSession: null, lists: [], words: [], view: 'main' });
                localStorage.removeItem('dictionary-storage');
            },
        }),
        {
            name: 'dictionary-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                theme: state.theme,
                language: state.language,
                view: state.view,
                user: state.user // Persist user for quick landing
            }),
        }
    )
);
