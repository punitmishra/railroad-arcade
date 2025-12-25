import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ModeProvider } from '@/lib/contexts/ModeContext';
import { ToastProvider } from '@/components/ui';
import { SoundProvider } from '@/hooks/useSounds';
import { AchievementNotifier } from '@/components/AchievementNotifier';
import './globals.css';

export const metadata: Metadata = {
  title: 'Railroad Arcade | Interactive Model Railroad Experience',
  description: 'Control a real 2-level model railroad with trains, buildings, and scenery. Insert tokens to play!',
  keywords: 'model railroad, arcade, interactive, trains, HO scale, train control, railroad simulator',
  manifest: '/manifest.json',
  metadataBase: new URL('https://railroad-arcade.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://railroad-arcade.vercel.app',
    siteName: 'Railroad Arcade',
    title: 'Railroad Arcade | Interactive Model Railroad Experience',
    description: 'Control a real 2-level model railroad with trains, buildings, and scenery. Insert tokens to play!',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Railroad Arcade Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Railroad Arcade | Interactive Model Railroad',
    description: 'Control a real 2-level model railroad with trains, buildings, and scenery.',
    images: ['/icons/icon-512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
                <AchievementNotifier />
                {children}
              </ToastProvider>
            </SoundProvider>
          </ModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
