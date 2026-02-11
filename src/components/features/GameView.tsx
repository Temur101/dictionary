import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import type { Word } from '../../types';
import { CheckCircle, XCircle, Trophy, RotateCcw, Home, Clock, ArrowRightLeft, Target, ListFilter } from 'lucide-react';
import { translations } from '../../i18n/translations';
import { Modal } from '../common/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './GameView.module.css';
import clsx from 'clsx';

export const GameView: React.FC = () => {
    const {
        lists, words, setView, addGameResult, language,
        gameMode, setGameMode, setGameActive,
        gameSession, startDbSession, updateDbSession, finishDbSession
    } = useStore();
    const t = translations[language].game;

    const [selectedListIds, setSelectedListIds] = useState<string[]>(gameSession?.list_ids || []);
    const [isModeModalOpen, setIsModeModalOpen] = useState(false);
    const [gameWords, setGameWords] = useState<Word[]>([]);
    const [userInput, setUserInput] = useState('');
    const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [timeLeft, setTimeLeft] = useState(15);
    const [options, setOptions] = useState<string[]>([]);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    // Sync gameWords when words or session changes
    useEffect(() => {
        if (gameSession?.list_ids) {
            const sessionWords = words.filter(w => gameSession.list_ids.includes(w.list_id));
            setGameWords(sessionWords);
        }
    }, [words, gameSession?.list_ids]);

    // Derived values from session
    const isStarted = !!gameSession && !gameSession.is_finished;
    const isFinished = !!gameSession?.is_finished;
    const currentIndex = gameSession?.current_word_index || 0;
    const results = useMemo(() => {
        const correct = gameSession?.answers.filter(a => a.correct).length || 0;
        const incorrect = gameSession?.answers.filter(a => !a.correct).length || 0;
        const incorrectWords = gameSession?.answers.filter(a => !a.correct).map(a => a.word_id) || [];
        return { correct, incorrect, incorrectWords };
    }, [gameSession?.answers]);

    // Generate options for choice mode
    useEffect(() => {
        if (isStarted && !isFinished && gameMode === 'choice' && gameWords.length > 0) {
            const currentWord = gameWords[currentIndex];
            if (!currentWord) return;

            const correctAnswer = currentWord.ru;
            const otherWords = words.filter(w => w.id !== currentWord.id);

            // Get 3 random unique translations
            const distractors = [...new Set(otherWords.map(w => w.ru))]
                .filter(ru => ru !== correctAnswer)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);

            // If not enough distractors, add some placeholders or fill from any words
            while (distractors.length < 3) {
                distractors.push(`Option ${distractors.length + 1}`);
            }

            const allOptions = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
            setOptions(allOptions);
            setSelectedOption(null);
        }
    }, [isStarted, isFinished, gameMode, currentIndex, gameWords, words]);

    // Sync immersion mode
    useEffect(() => {
        setGameActive(isStarted || isModeModalOpen);
        return () => setGameActive(false);
    }, [isStarted, isModeModalOpen, setGameActive]);

    // Timer logic
    useEffect(() => {
        let timer: any;
        if (isStarted && !isFinished && !showFeedback && gameMode === 'timed') {
            if (timeLeft > 0) {
                timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
            } else {
                handleCheck(undefined, true);
            }
        }
        return () => clearTimeout(timer);
    }, [isStarted, isFinished, showFeedback, timeLeft, gameMode]);

    const toggleList = (id: string) => {
        setSelectedListIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleStartClick = () => {
        const potentialWords = words.filter(w => selectedListIds.includes(w.list_id));
        if (potentialWords.length === 0) {
            alert(t.noWords);
            return;
        }
        setIsModeModalOpen(true);
    };

    const startGame = async (customWords?: Word[]) => {
        const targetListIds = customWords
            ? Array.from(new Set(customWords.map(w => w.list_id)))
            : selectedListIds;

        await startDbSession(targetListIds, gameMode);
        setIsModeModalOpen(false);
        setUserInput('');
        setSelectedOption(null);
        setTimeLeft(15);
    };

    const handleOptionSelect = (option: string) => {
        if (showFeedback) return;
        setSelectedOption(option);
        handleCheckChoice(option);
    };

    const handleCheckChoice = async (answer: string) => {
        const currentWord = gameWords[currentIndex];
        if (!currentWord) return;

        const isCorrect = answer === currentWord.ru;
        setShowFeedback(isCorrect ? 'correct' : 'incorrect');

        const newAnswer = {
            word_id: currentWord.id,
            answer: answer,
            correct: isCorrect
        };

        const isLastWord = currentIndex === gameWords.length - 1;

        setTimeout(async () => {
            setShowFeedback(null);
            setSelectedOption(null);

            if (!isLastWord) {
                await updateDbSession({
                    current_word_index: currentIndex + 1,
                    answers: [...(gameSession?.answers || []), newAnswer]
                });
            } else {
                finishGame([...(gameSession?.answers || []), newAnswer]);
            }
        }, 1500);
    };

    const finishGame = async (finalAnswers: any[]) => {
        const finalCorrect = finalAnswers.filter(a => a.correct).length;
        const finalIncorrectWords = finalAnswers.filter(a => !a.correct).map(a => a.word_id);

        addGameResult({
            totalQuestions: gameWords.length,
            correctCount: finalCorrect,
            percentage: Math.round((finalCorrect / gameWords.length) * 100),
            incorrectWords: finalIncorrectWords
        });

        await updateDbSession({
            answers: finalAnswers,
            is_finished: true
        });
    };

    const handleCheck = async (e?: React.FormEvent, isTimeUp = false) => {
        if (e) e.preventDefault();
        if (showFeedback || (gameMode !== 'timed' && !userInput.trim() && !isTimeUp)) return;

        const currentWord = gameWords[currentIndex];
        if (!currentWord) return;

        const expectedAnswer = gameMode === 'reverse' ? currentWord.en : currentWord.ru;
        const isCorrect = !isTimeUp && userInput.trim().toLowerCase() === expectedAnswer.toLowerCase();

        setShowFeedback(isCorrect ? 'correct' : 'incorrect');

        const newAnswer = {
            word_id: currentWord.id,
            answer: userInput.trim(),
            correct: isCorrect
        };

        const isLastWord = currentIndex === gameWords.length - 1;

        setTimeout(async () => {
            setShowFeedback(null);
            setUserInput('');
            setTimeLeft(15);

            if (!isLastWord) {
                await updateDbSession({
                    current_word_index: currentIndex + 1,
                    answers: [...(gameSession?.answers || []), newAnswer]
                });
            } else {
                finishGame([...(gameSession?.answers || []), newAnswer]);
            }
        }, 1200);
    };

    const repeatMistakes = () => {
        const mistakeWords = words.filter(w => results.incorrectWords.includes(w.id));
        startGame(mistakeWords);
    };

    const resetGame = async () => {
        await finishDbSession();
        setView('main');
    };

    // UI Rendering
    if (!isStarted) {
        const availableLists = lists.filter(l => l.wordIds.length > 0);
        const totalSelectedWordsCount = words.filter(w => selectedListIds.includes(w.list_id)).length;

        return (
            <div className={styles.setup}>
                <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>{t.setupTitle}</motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>{t.setupDesc}</motion.p>

                <div className={styles.listGrid}>
                    {availableLists.map((list, idx) => (
                        <motion.div
                            key={list.id}
                            className={clsx(styles.listCard, selectedListIds.includes(list.id) && styles.selected)}
                            onClick={() => toggleList(list.id)}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <h3>{list.title}</h3>
                            <span>{list.wordIds.length} {translations[language].wordList.counter.split('/')[1].trim()}</span>
                        </motion.div>
                    ))}
                </div>

                <div className={styles.setupActions}>
                    <button onClick={() => setView('main')} className={styles.backBtn}>{t.back}</button>
                    <div className={styles.startGroup}>
                        {selectedListIds.length > 0 && (
                            <span className={styles.selectedCount}>
                                {t.selectedCount.replace('{count}', totalSelectedWordsCount.toString())}
                            </span>
                        )}
                        <button disabled={selectedListIds.length === 0} onClick={handleStartClick} className={styles.startBtn}>{t.start}</button>
                    </div>
                </div>

                <Modal isOpen={isModeModalOpen} onClose={() => setIsModeModalOpen(false)} title={t.selectMode}>
                    <div className={styles.modeGrid}>
                        <div className={clsx(styles.modeCard, gameMode === 'regular' && styles.activeMode)} onClick={() => { setGameMode('regular'); startGame(); }}>
                            <Target size={32} />
                            <div className={styles.modeInfo}><h4>{t.modeRegular}</h4><p>{t.modeRegularDesc}</p></div>
                        </div>
                        <div className={clsx(styles.modeCard, gameMode === 'choice' && styles.activeMode)} onClick={() => { setGameMode('choice'); startGame(); }}>
                            <ListFilter size={32} />
                            <div className={styles.modeInfo}><h4>{t.modeChoice}</h4><p>{t.modeChoiceDesc}</p></div>
                        </div>
                        <div className={clsx(styles.modeCard, gameMode === 'timed' && styles.activeMode)} onClick={() => { setGameMode('timed'); startGame(); }}>
                            <Clock size={32} />
                            <div className={styles.modeInfo}><h4>{t.modeTimed}</h4><p>{t.modeTimedDesc}</p></div>
                        </div>
                        <div className={clsx(styles.modeCard, gameMode === 'reverse' && styles.activeMode)} onClick={() => { setGameMode('reverse'); startGame(); }}>
                            <ArrowRightLeft size={32} />
                            <div className={styles.modeInfo}><h4>{t.modeReverse}</h4><p>{t.modeReverseDesc}</p></div>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }

    if (isFinished) {
        const p = Math.round((results.correct / (gameWords.length || 1)) * 100);
        const performance = p >= 80 ? { text: t.excellent, color: 'var(--success)' } :
            p >= 50 ? { text: t.good, color: 'var(--primary)' } :
                p >= 30 ? { text: t.needsImprovement, color: '#f59e0b' } :
                    { text: t.studyMore, color: 'var(--danger)' };

        return (
            <motion.div className={styles.finish} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Trophy size={64} className={styles.trophy} />
                <h1 style={{ color: performance.color }}>{performance.text}</h1>
                <div className={styles.scoreBoard}>
                    <div className={styles.scoreItem}><span>{t.scoreCorrect}</span><strong>{results.correct}</strong></div>
                    <div className={styles.scoreItem}><span>{t.scoreIncorrect}</span><strong>{results.incorrect}</strong></div>
                    <div className={styles.scoreItem}><span>{t.scorePercent}</span><strong>{p}%</strong></div>
                </div>
                <div className={styles.finishActions}>
                    <button onClick={resetGame}><Home size={18} /> {t.exitToMain}</button>
                    {results.incorrectWords.length > 0 && (
                        <button onClick={repeatMistakes}><RotateCcw size={18} /> {t.repeatMistakes}</button>
                    )}
                    <button className={styles.primaryBtn} onClick={() => startGame()}>{t.tryAgain}</button>
                </div>
            </motion.div>
        );
    }

    const currentWord = gameWords[currentIndex];
    const questionWord = currentWord ? (gameMode === 'reverse' ? currentWord.ru : currentWord.en) : '';

    return (
        <div className={styles.game}>
            <div className={styles.progress}>
                <div className={styles.progressBar}>
                    <motion.div
                        className={styles.progressFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentIndex + 1) / (gameWords.length || 1)) * 100}%` }}
                    />
                </div>
                <div className={styles.progressLabel}>
                    <span>{t.progress.replace('{current}', (currentIndex + 1).toString()).replace('{total}', gameWords.length.toString())}</span>
                    {gameMode === 'timed' && (
                        <div className={clsx(styles.timer, timeLeft <= 5 && styles.timerUrgent)}>
                            <Clock size={16} />
                            <span>{timeLeft}s</span>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={currentIndex} className={styles.card} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className={styles.question}>
                        <span className={styles.label}>
                            {gameMode === 'choice' ? translations[language].game.translateThis : t.translateThis}
                        </span>
                        <h2 className={styles.word}>{questionWord}</h2>
                    </div>

                    {gameMode === 'choice' ? (
                        <div className={styles.optionsGrid}>
                            {options.map((option, idx) => (
                                <button
                                    key={idx}
                                    className={clsx(
                                        styles.optionBtn,
                                        selectedOption === option && styles.selectedOption,
                                        showFeedback && option === currentWord.ru && styles.correctOption,
                                        showFeedback === 'incorrect' && selectedOption === option && styles.incorrectOption
                                    )}
                                    onClick={() => handleOptionSelect(option)}
                                    disabled={!!showFeedback}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={(e) => handleCheck(e)} className={styles.answerArea}>
                            <input
                                autoFocus
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder={t.placeholder}
                                disabled={!!showFeedback}
                            />
                            <button type="submit" disabled={!!showFeedback || (!userInput.trim() && gameMode !== 'timed')}>
                                {currentIndex === gameWords.length - 1 ? t.finish : t.check}
                            </button>
                        </form>
                    )}

                    <AnimatePresence>
                        {showFeedback && (
                            <motion.div className={clsx(styles.feedback, styles[showFeedback])} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                {showFeedback === 'correct' ? <><CheckCircle size={24} /> {t.correct}</> : <><XCircle size={24} /> {t.incorrect.replace('{answer}', currentWord ? (gameMode === 'reverse' ? currentWord.en : currentWord.ru) : '')}</>}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </AnimatePresence>

            <div className={styles.gameActions}>
                <button className={styles.finishEarly} onClick={() => { if (confirm(t.confirmFinish)) resetGame(); }}>{t.finishEarly}</button>
            </div>
        </div>
    );
};
