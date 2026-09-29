'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { User, X, Check } from 'lucide-react';

interface NicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: { sessionToken: string; user: { id: string; nickname: string; isGlobalAdmin: boolean } }) => void;
  targetSlot?: number | null;
  occupiedNicks?: string[];
}

export default function NicknameModal({ isOpen, onClose, onSuccess, targetSlot, occupiedNicks = [] }: NicknameModalProps) {
  const { t } = useLanguage();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 24) {
      setError('A nicknévnek 2 és 24 karakter között kell lennie.');
      return;
    }

    // Check if nickname is already occupied in this room
    if (occupiedNicks.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setError(`A(z) "${trimmed}" nicknév már foglalt ebben a szobában! Kérlek, válassz másikat.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Hiba történt a session létrehozásakor.');
      }

      localStorage.setItem('allyoutuber_token', data.sessionToken);
      localStorage.setItem('allyoutuber_user', JSON.stringify(data.user));

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-violet-600/20 text-violet-400">
            <User size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {targetSlot ? t('room.claimSlotPrompt', { slot: targetSlot }) : t('room.occupySlot')}
            </h2>
            <p className="text-xs text-slate-400">
              Válassz egyedi nicknevet a szobabeli részvételhez!
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              autoFocus
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t('room.nicknamePlaceholder')}
              maxLength={24}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-base"
              disabled={loading}
            />
            {occupiedNicks.length > 0 && (
              <div className="mt-2">
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Már foglalt nicknevek ebben a szobában:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {occupiedNicks.map((nick) => (
                    <span
                      key={nick}
                      className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300"
                    >
                      {nick}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
              disabled={loading}
            >
              {t('room.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || nickname.trim().length < 2}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/30 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Mentés...</span>
              ) : (
                <>
                  <Check size={16} />
                  <span>{t('room.confirm')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
