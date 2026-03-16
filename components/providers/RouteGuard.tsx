"use client"

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

const PROTECTED_ROUTES = [
    '/ai-planner',
    '/my-trip',
    '/saved',
    '/profile',
];

const PUBLIC_AUTH_ROUTES = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
];

export function RouteGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
        const isAuthRoute = PUBLIC_AUTH_ROUTES.some(route => pathname.startsWith(route));

        if (!user && isProtectedRoute) {
            router.push(`/auth/login?redirect=${pathname}`);
        } else if (user && isAuthRoute) {
            router.push('/');
        }
    }, [user, loading, pathname, router]);

    // Optional: Show a full-screen loader while checking auth on protected routes
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    if (loading && isProtectedRoute) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-sm font-medium text-gray-400">Authenticating...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
