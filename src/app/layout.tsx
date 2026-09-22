import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { TabBar } from '@/components/layout/tab-bar';

const sans = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'VOLTA',
  description: 'Магазин электроники: смартфоны, ноутбуки, наушники и гаджеты',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={sans.variable}>
      <body>
        <Providers>
          <div className="phone-shell">
            {children}
            <TabBar />
          </div>
        </Providers>
      </body>
    </html>
  );
}
