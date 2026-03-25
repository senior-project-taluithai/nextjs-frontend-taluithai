"use client";

import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { MobileMenuButton } from "@/components/mobile-menu-button";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { RouteGuard } from "@/components/providers/RouteGuard";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";

const HIDE_SHELL_ROUTES = ["/auth"];
const PROTECTED_ROUTES = ["/ai-planner", "/my-trip", "/saved", "/profile"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const useShell = !HIDE_SHELL_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const requiresAuth = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  return (
    <AuthProvider>
      {useShell ? (
        <SidebarProvider>
          <AppSidebar />
          <MobileMenuButton />
          {requiresAuth ? (
            <RouteGuard>
              <main className="w-full relative overflow-x-hidden">
                {children}
              </main>
            </RouteGuard>
          ) : (
            <main className="w-full relative overflow-x-hidden">
              {children}
            </main>
          )}
        </SidebarProvider>
      ) : (
        <main className="w-full relative overflow-x-hidden">{children}</main>
      )}
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
