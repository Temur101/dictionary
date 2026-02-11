import React, { useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Search } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Modal } from '../common/Modal';
import { translations } from '../../i18n/translations';
import styles from './WordList.module.css';
import clsx from 'clsx';
import type { Word } from '../../types';

export const WordList: React.FC = () => {
    const { lists, words, activeListId, addWord, deleteWord, updateWord, language } = useStore();
    const t = translations[language].wordList;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWord, setEditingWord] = useState<Word | null>(null);
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState({
        en: '',
        ru: '',
        description: ''
    });

    const activeList = lists.find(l => l.id === activeListId);
    const listWords = words.filter(w => w.list_id === activeListId);
    const filteredWords = listWords.filter(w =>
        w.en.toLowerCase().includes(search.toLowerCase()) ||
        w.ru.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenAdd = () => {
        setEditingWord(null);
        setFormData({ en: '', ru: '', description: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (word: Word) => {
        setEditingWord(word);
        setFormData({
            en: word.en,
            ru: word.ru,
            description: word.description || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.en.trim() || !formData.ru.trim()) return;

        if (editingWord) {
            await updateWord(editingWord.id, {
                en: formData.en.trim(),
                ru: formData.ru.trim(),
                description: formData.description.trim()
            });
        } else {
            if (listWords.length >= 10) {
                alert(t.maxWords);
                return;
            }
            await addWord(formData.en.trim(), formData.ru.trim(), formData.description.trim());
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string, word: string) => {
        if (confirm(t.confirmDelete.replace('{word}', word))) {
            deleteWord(id);
        }
    };

    if (!activeListId) {
        return (
            <div className={styles.emptyState}>
                <BookOpen size={48} />
                <h2>{t.noActiveList}</h2>
                <p>{t.journey}</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerInfo}>
                    <h1>{activeList?.title}</h1>
                    <span className={styles.counter}>{t.counter.replace('{count}', listWords.length.toString())}</span>
                </div>

                <div className={styles.actions}>
                    <div className={styles.searchBar}>
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder={t.search}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className={styles.addBtn} onClick={handleOpenAdd}>
                        <Plus size={20} />
                        {t.addWord}
                    </button>
                </div>
            </header>

            <div className={styles.grid}>
                {filteredWords.length === 0 ? (
                    <div className={styles.noResults}>
                        {search ? t.noMatches : t.empty}
                    </div>
                ) : (
                    filteredWords.map((word) => (
                        <div
                            key={word.id}
                            className={clsx(styles.wordCard, 'hover-card')}
                        >
                            <div className={styles.wordContent}>
                                <div className={styles.english}>{word.en}</div>
                                <div className={styles.russian}>{word.ru}</div>
                                {word.description && (
                                    <div className={styles.description}>{word.description}</div>
                                )}
                            </div>
                            <div className={styles.wordActions}>
                                <button onClick={() => handleOpenEdit(word)} title="Edit">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(word.id, word.en)} title="Delete">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingWord ? t.editWord : t.addNewWord}
            >
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>{t.englishLabel}</label>
                        <input
                            autoFocus
                            required
                            type="text"
                            value={formData.en}
                            onChange={(e) => setFormData({ ...formData, en: e.target.value })}
                        />
                    </div>
                    <div className={styles.field}>
                        <label>{t.russianLabel}</label>
                        <input
                            required
                            type="text"
                            value={formData.ru}
                            onChange={(e) => setFormData({ ...formData, ru: e.target.value })}
                        />
                    </div>
                    <div className={styles.field}>
                        <label>{t.descriptionLabel}</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" onClick={() => setIsModalOpen(false)}>{t.cancel}</button>
                        <button type="submit" className={styles.submitBtn}>
                            {editingWord ? t.save : t.add}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
