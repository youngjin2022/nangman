import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ActivityWatcher } from '@/components/ActivityWatcher';

export const metadata: Metadata = {
  title: '낭만포차 모바일 주문',
  description: 'QR로 간편하게 주문하세요',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '낭만포차',
  },
};

// 모바일 뷰포트 설정 - 사용자 줌 허용 (접근성), 안전영역 사용
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0F0F12',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <ActivityWatcher />
        {children}
      </body>
    </html>
  );
}
