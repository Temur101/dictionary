import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabase';
import { translations } from '../../i18n/translations';
import { Eye, EyeOff } from 'lucide-react';
import styles from './AuthPage.module.css';

export const AuthPage: React.FC = () => {
    const { language, setUser } = useStore();
    const t = translations[language].auth;

    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                if (data.user) {
                    setUser({ id: data.user.id, email: data.user.email!, name: data.user.user_metadata?.name });
                }
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { name },
                        emailRedirectTo: undefined, // Disable confirmation requirement (handled in Supabase Dashboard usually, but we try to skip)
                    },
                });
                if (error) throw error;
                if (data.user) {
                    setUser({ id: data.user.id, email: data.user.email!, name: data.user.user_metadata?.name });
                }
            }
        } catch (err: any) {
            setError(err.message || t.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1>{isLogin ? t.login : t.register}</h1>
                    <p>{translations[language].welcome}</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form className={styles.form} onSubmit={handleAuth}>
                    {!isLogin && (
                        <div className={styles.inputGroup}>
                            <label>{t.name}</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <label>{t.email}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@mail.com"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>{t.password}</label>
                        <div className={styles.passwordWrapper}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? t.loading : (isLogin ? t.signIn : t.signUp)}
                    </button>
                </form>

                <div className={styles.switch}>
                    {isLogin ? t.noAccount : t.hasAccount}
                    <button onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? t.signUp : t.signIn}
                    </button>
                </div>
            </div>
        </div>
    );
};
