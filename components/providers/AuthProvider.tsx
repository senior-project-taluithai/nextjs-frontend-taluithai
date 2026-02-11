"use client"

import React, { createContext, useContext } from 'react';
import { UserProfile } from '@/lib/dtos/user.dto';
import { useUserProfile } from '@/hooks/api/useUser';

interface AuthContextType {
    user: UserProfile | null | undefined;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: user, isLoading: loading } = useUserProfile();

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
