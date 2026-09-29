'use client';

import React, { useState, useEffect } from 'react';
import { User, LogOut, Edit2 } from 'lucide-react';
import NicknameModal from './NicknameModal';

export default function UserHeaderBadge() {
  const [currentUser, setCurrentUser] = useState<{ id: string; nickname: string; isGlobalAdmin: boolean } | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadSession = async () => {
    // 1. Try local storage
    const storedUser = localStorage.getItem('allyoutuber_user');
    const token = localStorage.getItem('allyoutuber_token');

    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {}
    }

    // 2. Fetch fresh session from server API
    try {
      const res = await fetch('/api/session', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.session) {
        const u = {
          id: data.session.userId,
          nickname: data.session.nickname,
          isGlobalAdmin: data.session.isGlobalAdmin,
        };
        setCurrentUser(u);
        localStorage.setItem('allyoutuber_token', data.session.sessionToken);
        localStorage.setItem('allyoutuber_user', JSON.stringify(u));
        localStorage.setItem('allyoutuber_saved_nick', data.session.nickname);
      } else if (!token) {
        setCurrentUser(null);
      }
    } catch {}
  };

  useEffect(() => {
    loadSession();

    const handleUpdate = () => {
      loadSession();
    };

    window.addEventListener('allyoutuber:session_updated', handleUpdate);
    return () => window.removeEventListener('allyoutuber:session_updated', handleUpdate);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/session', { method: 'DELETE' });
    } catch {}

    localStorage.removeItem('allyoutuber_token');
    localStorage.removeItem('allyoutuber_user');
    document.cookie = 'allyoutuber_token=; Max-Age=0; path=/;';
    setCurrentUser(null);
    window.dispatchEvent(new CustomEvent('allyoutuber:session_updated'));
    window.location.reload();
  };

  return (
    <>
      {currentUser ? (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate max-w-[100px] sm:max-w-[140px]">{currentUser.nickname}</span>
          </div>

          {currentUser.isGlobalAdmin && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ADMIN
            </span>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="p-1 rounded text-slate-400 hover:text-white transition"
            title="Nicknév módosítása"
          >
            <Edit2 size={12} />
          </button>

          <button
            onClick={handleLogout}
            className="p-1 rounded text-slate-400 hover:text-rose-400 transition"
            title="Kijelentkezés"
          >
            <LogOut size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-semibold transition"
        >
          <User size={13} />
          <span className="hidden sm:inline">Nicknév</span>
        </button>
      )}

      <NicknameModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(data) => {
          setCurrentUser(data.user);
          localStorage.setItem('allyoutuber_token', data.sessionToken);
          localStorage.setItem('allyoutuber_user', JSON.stringify(data.user));
          localStorage.setItem('allyoutuber_saved_nick', data.user.nickname);
          window.dispatchEvent(new CustomEvent('allyoutuber:session_updated'));
          setShowModal(false);
        }}
      />
    </>
  );
}
