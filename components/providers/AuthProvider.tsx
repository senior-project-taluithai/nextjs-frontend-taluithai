"use client";

import React, { createContext, useContext } from "react";
import { usePathname } from "next/navigation";

import { UserProfile } from "@/lib/dtos/user.dto";
import { useUserProfile } from "@/hooks/api/useUser";

interface AuthContextType {
  user: UserProfile | null | undefined;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_EXCLUDED_ROUTES = ["/auth"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldFetchUser = !AUTH_EXCLUDED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const { data: user, isLoading: loading } = useUserProfile(shouldFetchUser);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
