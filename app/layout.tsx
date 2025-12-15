import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ModeProvider } from '@/lib/contexts/ModeContext';
import { ToastProvider } from '@/components/ui';
import { SoundProvider } from '@/hooks/useSounds';
import './globals.css';

export const metadata: Metadata = {
  title: 'Railroad Arcade | Interactive Model Railroad Experience',
  description: 'Control a real 2-level model railroad with trains, buildings, and scenery. Insert tokens to play!',
  keywords: 'model railroad, arcade, interactive, trains, HO scale',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Railroad Arcade',
  },
};

export const viewport: Viewport = {
  themeColor: '#050508',
  width: 'device-width',
  initialScale: 1,
  // Removed maximumScale: 1 to allow user zooming for accessibility
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ModeProvider>
            <SoundProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </SoundProvider>
          </ModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
