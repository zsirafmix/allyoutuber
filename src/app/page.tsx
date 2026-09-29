'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import NicknameModal from '@/components/NicknameModal';
import { getSocket } from '@/lib/socketClient';
import {
  Users,
  Plus,
  Play,
  Lock,
  Globe,
  Radio,
  Music,
  Headphones,
  Sparkles,
} from 'lucide-react';

interface RoomCard {
  id: string;
  slug: string;
  name: string;
  type: 'PUBLIC' | 'PRIVATE';
  isLocked: boolean;
  slotCount: number;
  activeCount: number;
  nowPlaying: string | null;
  thumbnail: string | null;
}

export default function HomePage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [rooms, setRooms] = useState<RoomCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNickModal, setShowNickModal] = useState(false);

  // Room creation state
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [slotCount, setSlotCount] = useState(10);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<{ id: string; nickname: string; isGlobalAdmin: boolean } | null>(null);

  const loadUser = async () => {
    const userStr = localStorage.getItem('allyoutuber_user');
    const token = localStorage.getItem('allyoutuber_token');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch {}
    }
    if (token) {
      try {
        const res = await fetch('/api/session', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.session) {
          const u = {
            id: data.session.userId,
            nickname: data.session.nickname,
            isGlobalAdmin: data.session.isGlobalAdmin,
          };
          setCurrentUser(u);
          localStorage.setItem('allyoutuber_user', JSON.stringify(u));
        }
      } catch {}
    }
  };

  useEffect(() => {
    loadUser();
    window.addEventListener('allyoutuber:session_updated', loadUser);
    return () => window.removeEventListener('allyoutuber:session_updated', loadUser);
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.rooms) {
        setRooms(data.rooms);
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);

    const socket = getSocket();
    const handleCountsUpdate = (counts: Record<string, number>) => {
      if (!counts) return;
      setRooms((prev) =>
        prev.map((r) =>
          counts[r.id] !== undefined ? { ...r, activeCount: counts[r.id] } : r
        )
      );
    };

    socket.on('rooms:counts_update', handleCountsUpdate);

    return () => {
      clearInterval(interval);
      socket.off('rooms:counts_update', handleCountsUpdate);
    };
  }, []);

  const handleStartCreateRoom = () => {
    const token = localStorage.getItem('allyoutuber_token');
    if (!token) {
      setShowNickModal(true);
      return;
    }
    setShowCreateModal(true);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    setCreating(true);
    setCreateError(null);

    try {
      const token = localStorage.getItem('allyoutuber_token');
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: roomName.trim(),
          type: roomType,
          slotCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room.');
      }

      setShowCreateModal(false);
      const targetUrl = data.inviteCode
        ? `/room/${data.room.slug}?invite=${data.inviteCode}`
        : `/room/${data.room.slug}`;
      router.push(targetUrl);
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative rounded-3xl p-8 sm:p-12 overflow-hidden bg-gradient-to-br from-violet-950/60 via-slate-900 to-slate-950 border border-violet-900/40 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          {currentUser ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs font-semibold mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Üdvözlünk újra, <strong>{currentUser.nickname}</strong>!</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/50 border border-violet-700/50 text-violet-300 text-xs font-semibold mb-4">
              <Sparkles size={14} />
              <span>Közösségi Zenehallgatás & Videónézés</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Hallgassátok és nézzétek <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">együtt</span>, valós időben!
          </h1>

          <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            {t('app.tagline')} Csatlakozz meglévő publikus szobákhoz, foglalj el egy interaktív helyet a számozott gombokkal, küldj be YouTube linkeket, szavazz és beszélgess a többiekkel!
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={handleStartCreateRoom}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-xl shadow-violet-600/30 transition transform active:scale-95"
            >
              <Plus size={18} />
              <span>{t('app.createRoom')}</span>
            </button>

            {!currentUser && (
              <button
                onClick={() => setShowNickModal(true)}
                className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Nicknév megadása
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Public Rooms Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio size={20} className="text-violet-400" />
            <span>{t('app.publicRooms')}</span>
          </h2>
          <button
            onClick={fetchRooms}
            className="text-xs text-slate-400 hover:text-white transition"
          >
            Frissítés ⟳
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400">
            <Headphones size={40} className="mx-auto text-slate-600 mb-3" />
            <p className="font-medium text-slate-300">{t('app.noRooms')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Link
                key={room.id}
                href={`/room/${room.slug}`}
                className="group relative rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-violet-600/50 p-5 shadow-lg transition duration-200 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-950/80 border border-violet-800/60 text-violet-300">
                      <Globe size={12} /> {room.type}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                      <Users size={12} /> {room.activeCount} / {room.slotCount}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition">
                    {room.name}
                  </h3>

                  <div className="mt-3 flex items-center gap-2.5">
                    {room.thumbnail ? (
                      <img
                        src={room.thumbnail}
                        alt="Now playing"
                        className="w-14 h-9 object-cover rounded-md border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-9 rounded-md bg-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                        <Music size={16} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                        {t('app.nowPlaying')}:
                      </p>
                      <p className="text-xs text-slate-200 font-medium truncate" title={room.nowPlaying || '—'}>
                        {room.nowPlaying || 'Várakozás videóra...'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs font-semibold text-violet-400 group-hover:text-violet-300">
                  <span>Belépés a szobába</span>
                  <Play size={14} className="group-hover:translate-x-1 transition transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Nickname prompt modal */}
      <NicknameModal
        isOpen={showNickModal}
        onClose={() => setShowNickModal(false)}
        onSuccess={() => {
          setShowCreateModal(true);
        }}
      />

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">{t('app.createRoom')}</h2>
            <p className="text-xs text-slate-400 mb-5">
              Állítsd be a szoba nevét, típusát és az elérhető felhasználói helyek számát!
            </p>

            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Szoba neve
                </label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="pl. Rock Night, Party 2026, Chill..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Szoba típusa
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRoomType('PUBLIC')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      roomType === 'PUBLIC'
                        ? 'bg-violet-600/30 border-violet-500 text-violet-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Globe size={14} /> PUBLIC
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomType('PRIVATE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      roomType === 'PRIVATE'
                        ? 'bg-violet-600/30 border-violet-500 text-violet-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Lock size={14} /> PRIVATE (Kódos)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Felhasználói helyek (Slotok) száma
                </label>
                <select
                  value={slotCount}
                  onChange={(e) => setSlotCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value={5}>5 hely</option>
                  <option value={10}>10 hely (Alapértelmezett)</option>
                  <option value={15}>15 hely</option>
                  <option value={20}>20 hely</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={creating || !roomName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition disabled:opacity-50"
                >
                  {creating ? 'Létrehozás...' : 'Szoba indítása'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
