import './globals.css';
import type { Metadata } from 'next';
import { LanguageProvider } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import UserHeaderBadge from '@/components/UserHeaderBadge';
import Link from 'next/link';
import { Radio, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AllYouTuber — Social YouTube Jukebox & Synchronized Lounge',
  description: 'Valós idejű közösségi YouTube jukebox és közös videónéző platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-violet-500 selection:text-white">
        <LanguageProvider>
          {/* Global Header */}
          <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
              {/* Brand Logo */}
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 group-hover:scale-105 transition transform">
                  <Radio size={20} className="animate-pulse" />
                </div>
                <div>
                  <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-violet-400 bg-clip-text text-transparent">
                    AllYouTuber
                  </span>
                  <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-violet-950 border border-violet-800/60 text-violet-300">
                    LIVE
                  </span>
                </div>
              </Link>

              {/* Header Right Tools */}
              <div className="flex items-center gap-2 sm:gap-3">
                <UserHeaderBadge />

                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition"
                  title="Global Admin"
                >
                  <Shield size={14} className="text-amber-400" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>

                <LanguageSwitcher />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
