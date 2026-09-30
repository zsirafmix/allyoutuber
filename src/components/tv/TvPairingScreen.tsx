'use client';

import React, { useEffect, useState } from 'react';
import { Tv, Sparkles, RefreshCw, Smartphone, QrCode, Wifi } from 'lucide-react';

interface TvPairingScreenProps {
  pairingCode: string | null;
  expiresAt: string | null;
  deviceName: string;
  loading: boolean;
  error?: string | null;
  onRefreshCode: () => void;
  directUrl?: string;
}

const YouTubeLogo = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export default function TvPairingScreen({
  pairingCode,
  expiresAt,
  deviceName,
  loading,
  error,
  onRefreshCode,
  directUrl,
}: TvPairingScreenProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Remote navigation: Enter key triggers refresh if focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onRefreshCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRefreshCode]);

  // Expiration countdown
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const remainingSec = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      const mins = Math.floor(remainingSec / 60);
      const secs = remainingSec % 60;
      setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const qrTargetUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?pairTv=${pairingCode || ''}`
    : directUrl || '';

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrTargetUrl)}&color=ffffff&bgcolor=0f172a&qzone=1`;

  return (
    <div className="relative min-h-screen w-screen bg-black flex flex-col justify-between p-8 sm:p-14 overflow-hidden select-none">
      {/* Background UI Texture and Ambient Neon Glow */}
      <div className="absolute inset-0 bg-[url('/ui-texture.jpg')] bg-cover bg-center opacity-10 mix-blend-screen pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-xl shadow-red-600/40 border border-red-400/40">
            <YouTubeLogo className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                AllYouTuber <span className="text-red-500 font-mono">TV</span>
              </h1>
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-black uppercase tracking-wider">
                Smart TV Mode
              </span>
            </div>
            <p className="text-sm text-slate-400 font-medium mt-0.5">
              Közösségi Zenehallgatás & Szinkronizált TV Kijelző
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 text-sm font-semibold">
          <Tv size={18} className="text-red-400" />
          <span>Eszköz: <strong>{deviceName}</strong></span>
        </div>
      </header>

      {/* Center Pairing Box */}
      <main className="relative z-10 my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto w-full">
        {/* Left Column: Code & Instructions */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Smart TV Párosítás</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              TV Párosítási Kód
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              Csatlakoztasd ezt a TV-t az AllYouTuber szobádhoz a telefonodról vagy számítógépedről!
            </p>
          </div>

          {/* Large Code Display Box */}
          <div className="relative p-6 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-red-500/60 shadow-2xl shadow-red-950/60 ring-2 ring-red-500/30 backdrop-blur-xl">
            <div className="flex flex-col items-center justify-center text-center gap-3">
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
                Írd be ezt a 6 karakteres kódot a telefonodon:
              </span>

              {loading ? (
                <div className="py-6 flex items-center justify-center gap-3 text-red-400 font-bold text-xl animate-pulse">
                  <RefreshCw className="animate-spin" size={28} />
                  <span>Új kód generálása...</span>
                </div>
              ) : pairingCode ? (
                <div className="py-2 px-6 rounded-2xl bg-black/60 border border-red-500/40 w-full flex items-center justify-center">
                  <span className="font-mono text-6xl sm:text-7xl lg:text-8xl font-black tracking-[0.2em] text-transparent bg-gradient-to-r from-red-400 via-rose-300 to-amber-300 bg-clip-text drop-shadow-[0_0_35px_rgba(239,68,68,0.6)] select-all">
                    {pairingCode}
                  </span>
                </div>
              ) : (
                <div className="text-red-400 font-semibold py-4">
                  {error || 'A kód nem érhető el.'}
                </div>
              )}

              {expiresAt && (
                <div className="flex items-center justify-between w-full pt-3 border-t border-slate-800 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Várakozás párosításra...
                  </span>
                  <span className="font-mono text-slate-300 font-bold">
                    Lejárat: {timeLeft || '10:00'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3 Step Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-1">
              <span className="w-6 h-6 rounded-full bg-red-600/30 text-red-300 text-xs font-black flex items-center justify-center">1</span>
              <p className="text-xs font-bold text-white">Nyisd meg a szobát</p>
              <p className="text-[11px] text-slate-400">Telefonon vagy gépen lépj be az AllYouTuberbe</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-1">
              <span className="w-6 h-6 rounded-full bg-red-600/30 text-red-300 text-xs font-black flex items-center justify-center">2</span>
              <p className="text-xs font-bold text-white">"TV Kijelzők" gomb</p>
              <p className="text-[11px] text-slate-400">Kattints a TV ikonra a fejlécben vagy szobában</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-1">
              <span className="w-6 h-6 rounded-full bg-red-600/30 text-red-300 text-xs font-black flex items-center justify-center">3</span>
              <p className="text-xs font-bold text-white">Írd be a kódot</p>
              <p className="text-[11px] text-slate-400">Add meg a fenti kódot vagy olvasd be a QR-t</p>
            </div>
          </div>
        </div>

        {/* Right Column: QR Code Box */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <QrCode size={18} className="text-red-400" />
              <span>Azonnali QR-kódos Csatlakozás</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border-2 border-red-500/40 shadow-xl shadow-red-950/30">
              <img
                src={qrImageUrl}
                alt="TV Pairing QR Code"
                className="w-56 h-56 rounded-xl object-contain"
              />
            </div>

            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Irányítsd a telefonod kameráját a QR-kódra a párosítási felület azonnali megnyitásához!
            </p>

            <button
              onClick={onRefreshCode}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition active:scale-95 shadow-md"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Új kód kérése (Távirányító Enter)</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-slate-900 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Wifi size={14} className="text-emerald-400" />
          <span>Smart TV Kliens Készenlétben (LG, Samsung, Hisense kompatibilis)</span>
        </div>
        <div>
          <span>AllYouTuber &copy; 2026 • Szinkronizált YouTube Jukebox</span>
        </div>
      </footer>
    </div>
  );
}
