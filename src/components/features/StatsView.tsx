import React from 'react';
import { useStore } from '../../store/useStore';
import { BarChart3, TrendingUp, Award, Calendar } from 'lucide-react';
import { translations } from '../../i18n/translations';
import styles from './StatsView.module.css';

export const StatsView: React.FC = () => {
    const { stats, language } = useStore();
    const t = translations[language].stats;

    const recentHistory = [...stats.history].reverse().slice(0, 5);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>{t.title}</h1>
                <p>{t.desc}</p>
            </header>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.icon} style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                        <BarChart3 size={24} />
                    </div>
                    <div className={styles.info}>
                        <span className={styles.label}>{t.totalGames}</span>
                        <strong className={styles.value}>{stats.totalGames}</strong>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.icon} style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className={styles.info}>
                        <span className={styles.label}>{t.avgPercent}</span>
                        <strong className={styles.value}>{Math.round(stats.averagePercentage)}%</strong>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.icon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <Award size={24} />
                    </div>
                    <div className={styles.info}>
                        <span className={styles.label}>{t.bestScore}</span>
                        <strong className={styles.value}>
                            {stats.history.length > 0 ? Math.max(...stats.history.map(h => h.percentage)) : 0}%
                        </strong>
                    </div>
                </div>
            </div>

            <section className={styles.historySection}>
                <h3>{t.recentActivity}</h3>
                <div className={styles.historyList}>
                    {recentHistory.length === 0 ? (
                        <div className={styles.empty}>{t.empty}</div>
                    ) : (
                        recentHistory.map((game) => (
                            <div key={game.id} className={styles.historyItem}>
                                <div className={styles.gameDate}>
                                    <Calendar size={16} />
                                    <span>{new Date(game.date).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US')}</span>
                                </div>
                                <div className={styles.gameScore}>
                                    <span className={styles.scoreText}>{game.correctCount} / {game.totalQuestions}</span>
                                    <div className={styles.scoreMiniBar}>
                                        <div
                                            className={styles.scoreMiniFill}
                                            style={{
                                                width: `${game.percentage}%`,
                                                background: game.percentage >= 80 ? 'var(--success)' :
                                                    game.percentage >= 50 ? 'var(--primary)' : 'var(--danger)'
                                            }}
                                        />
                                    </div>
                                    <span className={styles.scorePercent}>{game.percentage}%</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};
