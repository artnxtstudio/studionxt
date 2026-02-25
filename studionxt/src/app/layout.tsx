import Nav from '@/components/Nav';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'StudioNXT',
  description: 'Intelligent archiving for artists. Preserve, understand and celebrate your creative legacy.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'StudioNXT',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/logo.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0A0A0A" />
      </head>
      <body className={inter.variable + ' ' + playfair.variable + ' font-sans antialiased bg-[#0A0908]'}>
        <Nav />{children}
      </body>
    </html>
  );
}
