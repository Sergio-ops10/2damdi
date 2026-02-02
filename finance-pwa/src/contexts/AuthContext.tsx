import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { type Session } from '@supabase/supabase-js';
import { dataService } from '../services/dataService';

interface AuthContextType {
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ session: null, loading: true, signOut: async () => { } });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            setLoading(false);

            if (event === 'SIGNED_IN' && session) {
                dataService.pullUserData().catch(err => console.error('Sync error:', err));
            } else if (event === 'SIGNED_OUT') {
                setSession(null);
                dataService.clearLocalData().catch(err => console.error('Clear error:', err));
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        // 1. Update state immediately
        setSession(null);

        // 2. Fire and forget cleanup
        dataService.clearLocalData().catch(console.error);
        supabase.auth.signOut().catch(console.error);

        // 3. Force redirect to clear any lingering context
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ session, loading, signOut }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
