import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Settings, PieChart, UploadCloud, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
    const { t } = useTranslation();
    const { signOut } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: t('sidebar.dashboard', 'Panel Principal'), path: '/' },
        { icon: Receipt, label: t('sidebar.transactions', 'Transacciones'), path: '/transactions' },
        { icon: UploadCloud, label: t('sidebar.files', 'Archivos'), path: '/files' },
        { icon: Settings, label: t('sidebar.settings', 'Configuración'), path: '/settings' },
    ];

    return (
        <aside style={{
            width: '250px',
            background: 'var(--surface-color)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--border-color)',
            height: '100vh',
            position: 'fixed'
        }} className="sidebar-desktop">
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <PieChart size={32} color="var(--primary-color)" />
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>FinPWA</h2>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        style={{ textDecoration: 'none' }}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', paddingBottom: '1rem' }}>
                <button
                    onClick={signOut}
                    className="sidebar-link"
                    style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--danger-color)'
                    }}
                >
                    <LogOut size={20} />
                    <span>{t('sidebar.logout', 'Cerrar Sesión')}</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
