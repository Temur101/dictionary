import React, { useState } from 'react';
import { Plus, Trash2, List as ListIcon, Play, BarChart2, Languages, Book, Palette, Globe, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { Modal } from '../common/Modal';
import { translations } from '../../i18n/translations';
import styles from './Sidebar.module.css';
import clsx from 'clsx';
import type { AppTheme } from '../../types';

interface SidebarProps {
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
    const {
        lists, activeListId, addList, deleteList, selectList,
        setView, view, language, setLanguage, theme, setTheme,
        isTranslatorOpen, setTranslatorOpen, logout
    } = useStore();

    const t = translations[language];
    const s = t.sidebar;

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newListTitle.trim()) {
            await addList(newListTitle.trim());
            setNewListTitle('');
            setIsAddModalOpen(false);
            onClose?.(); // Close sidebar on mobile after creation
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
        e.stopPropagation();
        if (confirm(s.confirmDelete.replace('{title}', title))) {
            await deleteList(id);
        }
    };

    const themeCycle = () => {
        const themes: AppTheme[] = ['light', 'dark', 'blue', 'orange', 'purple', 'green', 'red', 'pink'];
        const nextIdx = (themes.indexOf(theme) + 1) % themes.length;
        setTheme(themes[nextIdx]);
    };

    return (
        <motion.aside
            className={styles.sidebar}
            layout
        >
            {/* Mobile Navigation Section */}
            <div className={styles.mobileOnlyNav}>
                <div className={styles.sectionTitle}>{t.game.selectMode}</div>
                <div className={styles.navGrid}>
                    <button
                        className={clsx(styles.navItem, view === 'main' && styles.active)}
                        onClick={() => { setView('main'); onClose?.(); }}
                    >
                        <Book size={20} />
                        <span>{t.nav.words}</span>
                    </button>
                    <button
                        className={clsx(styles.navItem, view === 'game' && styles.active)}
                        onClick={() => { setView('game'); onClose?.(); }}
                    >
                        <Play size={20} />
                        <span>{t.nav.play}</span>
                    </button>
                    <button
                        className={clsx(styles.navItem, view === 'stats' && styles.active)}
                        onClick={() => { setView('stats'); onClose?.(); }}
                    >
                        <BarChart2 size={20} />
                        <span>{t.nav.stats}</span>
                    </button>
                    <button
                        className={styles.navItem}
                        onClick={() => { setTranslatorOpen(!isTranslatorOpen); onClose?.(); }}
                    >
                        <Languages size={20} />
                        <span>{language === 'ru' ? 'Переводчик' : 'Translator'}</span>
                    </button>
                </div>

                <div className={styles.sectionTitle}>{language === 'ru' ? 'Настройки' : 'Settings'}</div>
                <div className={styles.navGrid}>
                    <button className={styles.navItem} onClick={themeCycle}>
                        <Palette size={20} />
                        <span>{language === 'ru' ? 'Тема' : 'Theme'}</span>
                        <div className={styles.themePreview} style={{ background: 'var(--primary)' }} />
                    </button>
                    <button className={styles.navItem} onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}>
                        <Globe size={20} />
                        <span>{language.toUpperCase()}</span>
                    </button>
                    <button className={clsx(styles.navItem, styles.logout)} onClick={() => { logout(); onClose?.(); }}>
                        <LogOut size={20} />
                        <span>{language === 'ru' ? 'Выход' : 'Logout'}</span>
                    </button>
                </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.header}>
                <h3>{s.title}</h3>
                <button
                    className={styles.addBtn}
                    onClick={() => setIsAddModalOpen(true)}
                    title={s.newList}
                >
                    <Plus size={20} />
                </button>
            </div>

            <nav className={styles.listNav}>
                {lists.length === 0 ? (
                    <div className={styles.empty}>{s.empty}</div>
                ) : (
                    lists.map((list) => (
                        <div
                            key={list.id}
                            className={clsx(styles.listItem, activeListId === list.id && styles.active, 'hover-card')}
                            onClick={() => {
                                selectList(list.id);
                                setView('main');
                                onClose?.();
                            }}
                        >
                            <ListIcon size={18} />
                            <span className={styles.listTitle}>{list.title}</span>
                            <button
                                className={styles.deleteBtn}
                                onClick={(e) => handleDelete(e, list.id, list.title)}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </nav>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={s.newList}
            >
                <form onSubmit={handleCreateList} className={styles.form}>
                    <input
                        autoFocus
                        type="text"
                        placeholder={s.placeholder}
                        value={newListTitle}
                        onChange={(e) => setNewListTitle(e.target.value)}
                        className={styles.input}
                    />
                    <div className={styles.formActions}>
                        <button type="button" onClick={() => setIsAddModalOpen(false)}>{translations[language].wordList.cancel}</button>
                        <button type="submit" className={styles.confirmBtn}>{translations[language].wordList.add}</button>
                    </div>
                </form>
            </Modal>
        </motion.aside>
    );
};
