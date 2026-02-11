import React from 'react';
import { motion } from 'framer-motion';
import { Home, SearchX } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { translations } from '../../i18n/translations';
import styles from './NotFound.module.css';

export const NotFound: React.FC = () => {
    const { setView, language } = useStore();
    const t = translations[language].notFound;

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
        >
            <motion.div
                className={styles.icon}
                animate={{
                    y: [0, -15, 0],
                    rotate: [0, 5, -5, 0]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <SearchX size={120} strokeWidth={1.5} />
            </motion.div>

            <h1 className={styles.title}>{t.title}</h1>
            <p className={styles.desc}>{t.desc}</p>

            <button
                className={styles.backBtn}
                onClick={() => setView('main')}
            >
                <Home size={20} />
                {t.back}
            </button>
        </motion.div>
    );
};
