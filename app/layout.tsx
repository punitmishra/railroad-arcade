import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ModeProvider } from '@/lib/contexts/ModeContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Railroad Arcade | Interactive Model Railroad Experience',
  description: 'Control a real 2-level model railroad with trains, buildings, and scenery. Insert tokens to play!',
  keywords: 'model railroad, arcade, interactive, trains, HO scale',
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
            {children}
          </ModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
