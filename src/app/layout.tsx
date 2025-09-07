import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import './globals.css';
import { ThemeProvider } from 'next-themes';

export const metadata: Metadata = {
  title: 'CertiCheck - Authenticity Validator for Academia',
  description: 'Blockchain-powered certificate verification platform for secure academic credential validation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Playfair+Display:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased min-h-screen')}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
