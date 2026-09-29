'use client';

import React, { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socketClient';

interface Particle {
  id: string;
  emoji: string;
  leftPercent: number;
}

const EMOJIS = ['❤️', '🔥', '😂', '👏', '😍', '😮', '👎'];

export default function FloatingReactions({ roomId }: { roomId: string }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleReaction = (data: { emoji: string; userNick: string; timestamp: number }) => {
      const newParticle: Particle = {
        id: `${Date.now()}-${Math.random()}`,
        emoji: data.emoji,
        leftPercent: 15 + Math.random() * 70, // random spread across player bottom
      };

      setParticles((prev) => [...prev.slice(-30), newParticle]);

      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
      }, 2300);
    };

    socket.on('reaction:broadcast', handleReaction);

    return () => {
      socket.off('reaction:broadcast', handleReaction);
    };
  }, [roomId]);

  const sendReaction = (emoji: string) => {
    if (rateLimited) return;

    const socket = getSocket();
    const token = localStorage.getItem('allyoutuber_token') || undefined;

    socket.emit('reaction:send', { roomId, emoji, sessionToken: token });

    // Local throttle indicator
    setRateLimited(true);
    setTimeout(() => setRateLimited(false), 500);
  };

  return (
    <div className="relative w-full">
      {/* Floating particles container overlay */}
      <div className="absolute inset-x-0 bottom-12 pointer-events-none h-48 overflow-hidden z-20">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute bottom-0 text-3xl select-none floating-particle filter drop-shadow-lg"
            style={{ left: `${p.leftPercent}%` }}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      {/* Emoji Reaction Bar */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 p-2 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-lg overflow-x-auto">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            className="flex-1 min-w-[36px] max-w-[48px] py-1.5 px-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-125 hover:scale-110 text-xl sm:text-2xl transition duration-150 transform flex items-center justify-center shadow"
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
