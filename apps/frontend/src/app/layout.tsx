import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';

export const metadata: Metadata = {
  title: '博客平台',
  description: '面向内容创作者的现代化博客系统',
  openGraph: {
    title: '博客平台',
    description: '面向内容创作者的现代化博客系统',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} 博客平台
        </footer>
      </body>
    </html>
  );
}
