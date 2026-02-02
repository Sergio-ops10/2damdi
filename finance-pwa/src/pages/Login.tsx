import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            let result;
            if (isRegistering) {
                result = await supabase.auth.signUp({ email, password });
            } else {
                result = await supabase.auth.signInWithPassword({ email, password });
            }

            const { data, error } = result;

            if (error) {
                setMessage(error.message);
                setLoading(false);
            } else {
                if (isRegistering) {
                    setMessage(t('auth.reg_success', '¡Registro con éxito! Ya puedes entrar.'));
                    setIsRegistering(false);
                    setLoading(false);
                } else if (data?.session) {
                    setLoading(false);
                    // The AuthProvider will detect the session and ProtectedRoute will allow entry.
                    // We navigate to / and the layout will handle the rest.
                    navigate('/', { replace: true });
                } else {
                    setLoading(false);
                }
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            setMessage(err.message || 'An unexpected error occurred');
            setLoading(false);
        }
    };

    const handleMagicLink = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) setMessage(error.message);
        else setMessage(t('auth.magic_link_sent', '¡Listo! Mira tu correo para el enlace.'));
        setLoading(false);
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'var(--bg-color)',
            color: 'var(--text-main)'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '1.5rem' }}>
                    {isRegistering ? t('auth.register', 'Crear Cuenta') : t('auth.login', 'Iniciar Sesión')}
                </h1>

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="input-group">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? t('auth.processing', 'Procesando...') : (isRegistering ? t('auth.register', 'Crear Cuenta') : t('auth.login', 'Iniciar Sesión'))}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {isRegistering ? t('auth.have_account', '¿Ya tienes cuenta? Entra') : t('auth.need_account', '¿Necesitas cuenta? Regístrate')}
                    </button>

                    {!isRegistering && (
                        <button
                            onClick={handleMagicLink}
                            disabled={loading || !email}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                            {t('auth.magic_link', 'O enviar Enlace Mágico')}
                        </button>
                    )}
                </div>

                {message && <p style={{ marginTop: '1rem', color: message.includes('success') || message.includes('enlace') || message.includes('Check') ? 'var(--success-color)' : 'var(--danger-color)' }}>{message}</p>}
            </div>
        </div>
    );
};

export default Login;
