'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Tv, X, Plus, CheckCircle2, AlertCircle, RefreshCw, Trash2, Edit2, Check, ExternalLink } from 'lucide-react';

interface TvManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomId: string;
  currentRoomName: string;
  currentRoomSlug: string;
}

interface ConnectedTvSession {
  id: string;
  deviceName: string;
  status: string;
  pairedAt?: string | null;
  lastSeenAt?: string;
}

export default function TvManagerModal({
  isOpen,
  onClose,
  currentRoomId,
  currentRoomName,
  currentRoomSlug,
}: TvManagerModalProps) {
  const { t } = useLanguage();
  const [pairingCode, setPairingCode] = useState('');
  const [customName, setCustomName] = useState('Nappali TV');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [tvs, setTvs] = useState<ConnectedTvSession[]>([]);
  const [loadingTvs, setLoadingTvs] = useState(false);

  // Edit TV Name state
  const [editingTvId, setEditingTvId] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState('');

  const loadTvs = async () => {
    if (!currentRoomId) return;
    setLoadingTvs(true);
    try {
      const res = await fetch(`/api/tv/sessions?roomId=${currentRoomId}`);
      const data = await res.json();
      if (data.sessions) {
        setTvs(data.sessions);
      }
    } catch (err) {
      console.error('Failed to load TVs:', err);
    } finally {
      setLoadingTvs(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTvs();
      setErrorMsg(null);
      setSuccessMsg(null);
      setPairingCode('');
    }
  }, [isOpen, currentRoomId]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pairingCode.trim().toUpperCase();
    if (!clean) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('allyoutuber_token');
      const res = await fetch('/api/tv/pair/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          pairingCode: clean,
          roomId: currentRoomId,
          deviceName: customName.trim() || 'TV-1',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'A párosítás sikertelen.');

      setSuccessMsg(`"${data.tvSession.deviceName}" sikeresen csatlakoztatva ehhez a szobához!`);
      setPairingCode('');
      loadTvs();
    } catch (err: any) {
      setErrorMsg(err.message || 'Hiba a párosítás során.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('allyoutuber_token');
      const res = await fetch(`/api/tv/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        loadTvs();
      }
    } catch (err) {
      console.error('Failed to disconnect TV:', err);
    }
  };

  const handleSaveName = async (sessionId: string) => {
    if (!editNameText.trim()) return;
    try {
      const res = await fetch(`/api/tv/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: editNameText.trim() }),
      });
      if (res.ok) {
        setEditingTvId(null);
        loadTvs();
      }
    } catch (err) {
      console.error('Failed to update TV name:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-red-500/40 shadow-2xl shadow-red-950/60 p-6 sm:p-7 overflow-hidden">
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30 border border-red-400/40">
              <Tv size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>TV & Kijelzők Csatlakoztatása</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Szoba: <strong className="text-white">{currentRoomName}</strong> (/room/{currentRoomSlug})
              </p>
            </div>
          </div>

          {/* Connect New TV Form */}
          <form onSubmit={handleClaim} className="p-4 rounded-2xl bg-slate-950/80 border border-red-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <Plus size={14} /> Új TV Csatlakoztatása
              </span>
              <a
                href={`/tv/${currentRoomSlug}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-slate-400 hover:text-red-300 flex items-center gap-1 transition"
              >
                <span>/tv/{currentRoomSlug} megnyitása</span>
                <ExternalLink size={10} />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  6-jegyű Párosítási Kód:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                  placeholder="pl. A7K4Q2"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-lg font-black tracking-widest uppercase focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  TV Megnevezése:
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="pl. Nappali TV"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || pairingCode.trim().length !== 6}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
            >
              {submitting ? <RefreshCw className="animate-spin" size={14} /> : <Tv size={14} />}
              <span>TV Csatlakoztatása a Szobához</span>
            </button>
          </form>

          {/* Connected TVs in this Room */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Szobához kapcsolt TV-k ({tvs.length})
              </span>
              <button
                type="button"
                onClick={loadTvs}
                className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
              >
                <RefreshCw size={11} className={loadingTvs ? 'animate-spin' : ''} />
                <span>Frissítés</span>
              </button>
            </div>

            {tvs.length === 0 ? (
              <div className="py-6 text-center rounded-2xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-500">
                Jelenleg nincs csatlakoztatott TV ebben a szobában.
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {tvs.map((tv) => (
                  <div
                    key={tv.id}
                    className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-red-600/15 text-red-400 shrink-0">
                        <Tv size={16} />
                      </div>

                      {editingTvId === tv.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editNameText}
                            onChange={(e) => setEditNameText(e.target.value)}
                            className="px-2 py-1 rounded bg-slate-800 border border-slate-600 text-white text-xs font-bold"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveName(tv.id)}
                            className="p-1 rounded bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600/50"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTvId(null)}
                            className="p-1 rounded bg-slate-800 text-slate-400"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white truncate">{tv.deviceName}</span>
                            <button
                              onClick={() => {
                                setEditingTvId(tv.id);
                                setEditNameText(tv.deviceName);
                              }}
                              className="text-slate-500 hover:text-slate-300 p-0.5"
                              title="Név szerkesztése"
                            >
                              <Edit2 size={11} />
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Státusz: {tv.status} • Utoljára látva: {tv.lastSeenAt ? new Date(tv.lastSeenAt).toLocaleTimeString() : '—'}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDisconnect(tv.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/60 hover:border-red-500/50 border border-slate-700 text-slate-400 hover:text-red-300 text-[11px] font-bold transition shrink-0"
                    >
                      Leválasztás
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
