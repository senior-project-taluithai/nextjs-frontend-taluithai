"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, UserProfile, LoginDto, RegisterDto } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    login: (data: LoginDto) => Promise<void>;
    register: (data: RegisterDto) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initAuth = async () => {
            try {
                const profile = await authService.getProfile();
                setUser(profile);
            } catch (error) {
                // Not authenticated or error
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (data: LoginDto) => {
        try {
            const response = await authService.login(data);
            // After login, fetch profile to ensure we have user details
            // Or use the response.user if available and reliable
            setUser(response.user);
            router.push('/');
        } catch (error) {
            // Error is handled by the caller (UI displays toast)
            throw error;
        }
    };

    const register = async (data: RegisterDto) => {
        try {
            const response = await authService.register(data);
            setUser(response.user);
            router.push('/');
        } catch (error) {
            // Error is handled by the caller (UI displays toast)
            throw error;
        }
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
