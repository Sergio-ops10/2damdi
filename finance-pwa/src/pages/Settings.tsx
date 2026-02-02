import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Globe, User, Info } from 'lucide-react';
import { dataService } from '../services/dataService';

const Settings = () => {
    const { t, i18n } = useTranslation();
    const { session, signOut } = useAuth();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const [loggingOut, setLoggingOut] = React.useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await signOut();
        } catch (err) {
            console.error(err);
            setLoggingOut(false);
        }
    };

    return (
        <div className="main-content animate-fade-in">
            <div className="page-header">
                <h1>{t('settings.title', 'Configuración')}</h1>
            </div>

            <div className="grid">
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ background: 'var(--primary-color)', padding: '1rem', borderRadius: '50%' }}>
                            <User size={32} color="white" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0 }}>{t('settings.profile', 'Perfil de Usuario')}</h2>
                            <p className="text-muted">{session?.user?.email}</p>
                        </div>
                    </div>

                    <button
                        className="btn"
                        style={{ background: 'var(--danger-color)', color: 'white', width: '100%', justifyContent: 'center' }}
                        onClick={handleLogout}
                        disabled={loggingOut}
                    >
                        <LogOut size={20} />
                        {loggingOut ? t('auth.processing', 'Cerrando...') : t('settings.logout', 'Cerrar Sesión')}
                    </button>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Globe size={24} className="text-primary" />
                        <h2 style={{ margin: 0 }}>{t('settings.language', 'Idioma')}</h2>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className={`btn ${i18n.language === 'es' ? 'btn-primary' : ''}`}
                            style={{ flex: 1, justifyContent: 'center', background: i18n.language !== 'es' ? 'rgba(255,255,255,0.05)' : '' }}
                            onClick={() => changeLanguage('es')}
                        >
                            Español
                        </button>
                        <button
                            className={`btn ${i18n.language === 'en' ? 'btn-primary' : ''}`}
                            style={{ flex: 1, justifyContent: 'center', background: i18n.language !== 'en' ? 'rgba(255,255,255,0.05)' : '' }}
                            onClick={() => changeLanguage('en')}
                        >
                            English
                        </button>
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Info size={24} className="text-muted" />
                        <h2 style={{ margin: 0 }}>{t('settings.about', 'Acerca de')}</h2>
                    </div>
                    <p className="text-muted" style={{ fontWeight: 'bold' }}>{t('settings.version', 'FinPWA v1.0.0')}</p>
                    <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
                        {t('settings.desc', 'Desarrollado para gestión de finanzas personales con sincronización en la nube.')}
                    </p>

                    <button
                        className="btn"
                        style={{ border: '1px solid var(--danger-color)', color: 'var(--danger-color)', width: '100%', justifyContent: 'center' }}
                        onClick={async () => {
                            if (window.confirm(t('settings.clear_confirm', '¿Estás seguro?'))) {
                                await dataService.clearAllData();
                                window.location.reload();
                            }
                        }}
                    >
                        {t('settings.clear_data', 'Borrar Todos los Datos')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
