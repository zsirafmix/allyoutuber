'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tv, Radio, ArrowRight, Sparkles } from 'lucide-react';

function TvHomeContent() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        if (data.rooms) setRooms(data.rooms);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = slug.trim().toLowerCase();
    if (clean) {
      router.push(`/tv/${clean}`);
    }
  };

  return (
    <div className="relative min-h-screen w-screen flex flex-col items-center justify-center p-6 sm:p-10 select-none text-white">
      <div className="relative z-10 max-w-xl w-full p-8 rounded-3xl bg-slate-900/90 border border-red-500/40 shadow-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
            <Tv size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              AllYouTuber <span className="text-red-500 font-mono">TV</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Smart TV Megjelenítő & Videólejátszó Kliens
            </p>
          </div>
        </div>

        {/* Enter Room Slug Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Szoba azonosító (slug):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="pl. party-szoba"
              className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-base font-bold focus:outline-none focus:border-red-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={!slug.trim()}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition disabled:opacity-50 flex items-center gap-2"
            >
              <span>Megnyitás</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {/* Public Rooms List */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Elérhető nyilvános szobák:
          </span>

          {loading ? (
            <p className="text-xs text-slate-500">Szobák betöltése...</p>
          ) : rooms.length === 0 ? (
            <p className="text-xs text-slate-500">Nincs elérhető nyilvános szoba.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => router.push(`/tv/${room.slug}`)}
                  className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-red-400">
                      {room.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      /tv/{room.slug}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-slate-500 group-hover:text-red-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TvPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen w-screen bg-slate-950" />}>
      <TvHomeContent />
    </React.Suspense>
  );
}
