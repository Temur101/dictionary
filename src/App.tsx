import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { WordList } from './components/features/WordList';
import { GameView } from './components/features/GameView';
import { StatsView } from './components/features/StatsView';
import { Translator } from './components/features/Translator';
import { AuthPage } from './components/auth/AuthPage';
import { NotFound } from './components/common/NotFound';
import { useStore } from './store/useStore';
import { supabase } from './lib/supabase';
import { Menu, X as CloseIcon, Play, BarChart2, Languages, Book, Palette, Globe, LogOut } from 'lucide-react';
import { translations } from './i18n/translations';
import styles from './App.module.css';
import clsx from 'clsx';
import type { AppTheme, AppLanguage } from './types';

const App: React.FC = () => {
  const {
    view, setView, isTranslatorOpen, setTranslatorOpen,
    theme, setTheme, language, setLanguage,
    isGameActive, user, setUser, logout,
    fetchUserData, isLoading
  } = useStore();
  const t = translations[language];

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [view]);

  // Supabase Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email!, name: session.user.user_metadata?.name });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email!, name: session.user.user_metadata?.name });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  useEffect(() => {
    if (isGameActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isGameActive]);

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className={clsx(
      styles.app,
      isGameActive && styles.immersionActive,
      isSidebarOpen && styles.sidebarOpen
    )}>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
        </div>
      )}

      {isSidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      <div className={clsx(styles.bgLayer, isGameActive && styles.blur)}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className={clsx(styles.mainContent, isGameActive && styles.mainImmersion)}>
        <header className={clsx(styles.topNav, isGameActive && styles.blur)}>
          <div className={styles.navLeft}>
            <button className={styles.menuBtn} onClick={() => setSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
            </button>
            <div className={styles.logo}>
              <img src="/icon.svg" alt="Logo" className={styles.navLogo} />
            </div>
          </div>

          <nav className={styles.navActions}>
            <div className={styles.desktopOnlyActions}>
              <div className={styles.switchers}>
                <ThemeSwitcher current={theme} onSelect={setTheme} />

                <button className={styles.iconBtn} onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}>
                  <Globe size={18} />
                  <span className={styles.langLabel}>{language.toUpperCase()}</span>
                </button>
              </div>

              <div className={styles.divider} />

              <button
                className={view === 'main' ? styles.active : ''}
                onClick={() => setView('main')}
              >
                <Book size={18} /> <span>{t.nav.words}</span>
              </button>

              <button
                className={view === 'game' ? styles.active : ''}
                onClick={() => setView('game')}
              >
                <Play size={18} /> <span>{t.nav.play}</span>
              </button>

              <StatsTrigger t={t} />

              <button className={styles.iconBtn} onClick={() => setTranslatorOpen(!isTranslatorOpen)}>
                <Languages size={18} />
              </button>

              <div className={styles.divider} />

              <button className={styles.logoutBtn} onClick={() => logout()}>
                <LogOut size={18} /> <span>Выход</span>
              </button>
            </div>
          </nav>
        </header>

        <div className={styles.contentArea}>
          <div className={styles.viewContainer}>
            {view === 'main' && <WordList />}
            {view === 'game' && <GameView />}
            {view === 'stats' && <StatsView />}
            {view === 'notFound' && <NotFound />}
          </div>

          {isTranslatorOpen && (
            <div className={clsx(styles.translatorSide, isGameActive && styles.blur)}>
              <Translator onClose={() => setTranslatorOpen(false)} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const StatsTrigger = ({ t }: { t: any }) => {
  const { view, setView } = useStore();
  return (
    <button
      className={view === 'stats' ? styles.active : ''}
      onClick={() => setView(view === 'stats' ? 'main' : 'stats')}
    >
      <BarChart2 size={18} /> <span>{t.nav.stats}</span>
    </button>
  );
};

const ThemeSwitcher = ({ current, onSelect }: { current: AppTheme, onSelect: (t: AppTheme) => void }) => {
  const themes: AppTheme[] = ['light', 'dark', 'blue', 'orange', 'purple', 'green', 'red', 'pink'];

  const cycle = () => {
    const nextIdx = (themes.indexOf(current) + 1) % themes.length;
    onSelect(themes[nextIdx]);
  };

  return (
    <button className={styles.iconBtn} onClick={cycle} title="Switch Theme">
      <Palette size={18} />
      <span className={styles.themeDot} style={{ background: `var(--primary)` }} />
    </button>
  );
};

export default App;
