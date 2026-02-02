import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Desktop Sidebar - Hidden on mobile via CSS (todo) */}
            <div className="hidden-mobile" style={{ width: '250px', flexShrink: 0 }}>
                <Sidebar />
            </div>

            <main style={{ flex: 1, padding: '2rem', marginLeft: '0' }}>
                <Outlet />
            </main>

            {/* Mobile Navigation Bar (Bottom) - To be implemented for < 768px */}
            <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          main { padding: 1rem !important; padding-bottom: 80px !important; }
        }
      `}</style>
        </div>
    );
};

export default MainLayout;
