import React, { useState } from 'react';
import { Languages, ArrowRightLeft, Loader2, Copy, Trash2, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { translations } from '../../i18n/translations';
import styles from './Translator.module.css';

interface TranslatorProps {
    onClose?: () => void;
}

export const Translator: React.FC<TranslatorProps> = ({ onClose }) => {
    const { language } = useStore();
    const t = translations[language].translator;

    const [text, setText] = useState('');
    const [translation, setTranslation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [langPair, setLangPair] = useState({ from: 'en', to: 'ru' });

    const handleTranslate = async () => {
        if (!text.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair.from}|${langPair.to}`
            );
            const data = await response.json();
            if (data.responseData) {
                setTranslation(data.responseData.translatedText);
            }
        } catch (error) {
            console.error('Translation error:', error);
            alert(language === 'ru' ? 'Ошибка перевода. Попробуйте еще раз.' : 'Failed to translate. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const swapLanguages = () => {
        setLangPair({ from: langPair.to, to: langPair.from });
        setText(translation);
        setTranslation(text);
    };

    const copyToClipboard = (val: string) => {
        navigator.clipboard.writeText(val);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <Languages size={20} />
                    <h3>{t.title}</h3>
                </div>
                {onClose && (
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={18} />
                    </button>
                )}
            </div>

            <div className={styles.langSelector}>
                <div className={styles.lang}>{langPair.from === 'en' ? (language === 'ru' ? 'Английский' : 'English') : (language === 'ru' ? 'Русский' : 'Russian')}</div>
                <button className={styles.swapBtn} onClick={swapLanguages}>
                    <ArrowRightLeft size={16} />
                </button>
                <div className={styles.lang}>{langPair.to === 'en' ? (language === 'ru' ? 'Английский' : 'English') : (language === 'ru' ? 'Русский' : 'Russian')}</div>
            </div>

            <div className={styles.inputs}>
                <div className={styles.inputGroup}>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={t.placeholder}
                    />
                    <div className={styles.inputActions}>
                        <button onClick={() => setText('')} title={t.clear}>
                            <Trash2 size={16} />
                        </button>
                        <button onClick={() => copyToClipboard(text)} title={t.copy}>
                            <Copy size={16} />
                        </button>
                    </div>
                </div>

                <button
                    className={styles.translateBtn}
                    onClick={handleTranslate}
                    disabled={isLoading || !text.trim()}
                >
                    {isLoading ? <Loader2 className={styles.spinner} size={18} /> : t.translate}
                </button>

                <div className={styles.outputGroup}>
                    <textarea
                        readOnly
                        value={translation}
                        placeholder={t.outputPlaceholder}
                    />
                    <div className={styles.inputActions}>
                        <button onClick={() => copyToClipboard(translation)} title={t.copy}>
                            <Copy size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
