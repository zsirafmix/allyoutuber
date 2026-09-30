'use client';

import React, { useState, useEffect } from 'react';
import { Tv, X, Copy, Check, ExternalLink, QrCode, Sparkles } from 'lucide-react';

interface TvManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomId: string;
  currentRoomName: string;
  currentRoomSlug: string;
}

export default function TvManagerModal({
  isOpen,
  onClose,
  currentRoomId,
  currentRoomName,
  currentRoomSlug,
}: TvManagerModalProps) {
  const [copied, setCopied] = useState(false);
  const [tvUrl, setTvUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && currentRoomSlug) {
      setTvUrl(`${window.location.origin}/tv/${currentRoomSlug}`);
    }
  }, [currentRoomSlug, isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!tvUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(tvUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = tvUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(tvUrl)}&color=ffffff&bgcolor=0f172a&qzone=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-red-500/40 shadow-2xl shadow-red-950/60 p-6 sm:p-7 overflow-hidden text-white">
        {/* Background UI Texture and Ambient Glow */}
        <div className="absolute inset-0 bg-[url('/ui-texture.jpg')] bg-cover bg-center opacity-[0.06] mix-blend-screen pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition z-20"
        >
          <X size={20} />
        </button>

        <div className="relative z-10 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30 border border-red-400/40">
              <Tv size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>TV Megosztás</span>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-black uppercase tracking-wider">
                  Smart TV
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Szoba: <strong className="text-white">{currentRoomName}</strong>
              </p>
            </div>
          </div>

          {/* Explanation */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Nyisd meg az alábbi linket a <strong>Smart TV (LG, Samsung, Hisense)</strong> beépített böngészőjében, és a TV azonnal a szoba aktuális videóját és a következő 3 dalt fogja mutatni!
          </p>

          {/* Direct Link Box & Copy Button */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              A szoba közvetlen TV linkje:
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-red-400 font-mono text-xs sm:text-sm font-bold truncate select-all">
                {tvUrl || `/tv/${currentRoomSlug}`}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/30 transition active:scale-95 shrink-0"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-white" />
                    <span>Másolva!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Másolás</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="p-2 rounded-xl bg-slate-900 border border-red-500/30 shrink-0">
              {tvUrl && (
                <img
                  src={qrImageUrl}
                  alt="TV Room QR Code"
                  className="w-32 h-32 rounded-lg object-contain"
                />
              )}
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-slate-200">
                <QrCode size={16} className="text-red-400" />
                <span>QR-kódos megnyitás</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Olvasd be a QR-kódot a telefonoddal vagy a TV böngészőjével a TV nézet azonnali betöltéséhez.
              </p>
              <a
                href={tvUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition mt-1"
              >
                <span>Megnyitás új ablakban</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
