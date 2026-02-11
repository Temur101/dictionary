import React, { useState } from 'react';
import { Plus, Trash2, List as ListIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { Modal } from '../common/Modal';
import { translations } from '../../i18n/translations';
import styles from './Sidebar.module.css';
import clsx from 'clsx';

interface SidebarProps {
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
    const { lists, activeListId, addList, deleteList, selectList, setView, language } = useStore();
    const t = translations[language].sidebar;

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newListTitle.trim()) {
            await addList(newListTitle.trim());
            setNewListTitle('');
            setIsAddModalOpen(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
        e.stopPropagation();
        if (confirm(t.confirmDelete.replace('{title}', title))) {
            await deleteList(id);
        }
    };

    return (
        <motion.aside
            className={styles.sidebar}
            layout
        >
            <div className={styles.header}>
                <h3>{t.title}</h3>
                <button
                    className={styles.addBtn}
                    onClick={() => setIsAddModalOpen(true)}
                    title={t.newList}
                >
                    <Plus size={20} />
                </button>
            </div>

            <nav className={styles.listNav}>
                {lists.length === 0 ? (
                    <div className={styles.empty}>{t.empty}</div>
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
                title={t.newList}
            >
                <form onSubmit={handleCreateList} className={styles.form}>
                    <input
                        autoFocus
                        type="text"
                        placeholder={t.placeholder}
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
