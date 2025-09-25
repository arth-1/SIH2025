'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NavbarDemo from '@/components/ui/resizable-navbar-demo';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Pages that should not have the navbar layout
  const noLayoutPages = ['/landing', '/auth/signin', '/auth/signup'];
  const shouldShowNavbar = !noLayoutPages.some(path => pathname.startsWith(path));

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

  // For pages without navbar (landing, auth)
  if (!shouldShowNavbar) {
    return <>{children}</>;
  }

  // For all other pages with navbar
  return (
    <div className="min-h-screen bg-gradient-to-br from-platinum-100 via-silver_lake_blue-100 to-yinmn_blue-100 dark:from-rich_black-DEFAULT dark:via-oxford_blue-DEFAULT dark:to-yinmn_blue-DEFAULT">
      <NavbarDemo />
      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
