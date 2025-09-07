'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarInset } from '@/components/ui/sidebar';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Pages that should not have the sidebar layout
  const noLayoutPages = ['/landing', '/auth/signin', '/auth/signup', '/verify'];
  const shouldShowSidebar = !noLayoutPages.some(path => pathname.startsWith(path)) && user;

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to landing page if not authenticated and trying to access protected routes
  if (!user && !noLayoutPages.some(path => pathname.startsWith(path)) && pathname !== '/') {
    if (typeof window !== 'undefined') {
      window.location.href = '/landing';
    }
    return null;
  }

  // For pages without sidebar (landing, auth, verify)
  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  // For dashboard and other authenticated pages with sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
