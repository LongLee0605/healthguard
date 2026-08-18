import type { Metadata, Viewport } from 'next';
import { ReduxProvider } from '@/store/provider';
import { ToastProvider } from '@/context/ToastContext';
import PwaRegister from '@/components/PwaRegister';
import './globals.css';

export const metadata: Metadata = {
  title: 'HealthGuard — Quản lý sức khỏe cá nhân',
  description: 'Hệ thống quản lý sức khỏe cá nhân tích hợp AI',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ReduxProvider>
          <ToastProvider>
            <PwaRegister />
            {children}
          </ToastProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
