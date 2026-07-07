import type { Metadata, Viewport } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-space',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AIrena | Neo-Brutalist Tournament Operations Platform',
  description: 'AIrena is a Generative AI-powered smart tournament operations platform for international sporting events built in high-contrast Neo-brutalist style.',
};

export const viewport: Viewport = {
  themeColor: '#FFFDF5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} dark`} suppressHydrationWarning>
      <body className="antialiased bg-[#FFFDF5] text-black min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
