'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Role } from '@prisma/client';
import { Users, Headphones, Eye, ShieldAlert, ShieldCheck, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

export interface Participant {
  userId: string;
  nickname: string;
  role: Role;
  slotIndex: number | null;
  isOnline: boolean;
}

interface RoomAudienceProps {
  onlineCount: number;
  participants: Participant[];
  currentUserId?: string | null;
  onSelectWhisper?: (userId: string, nickname: string) => void;
}

export default function RoomAudience({
  onlineCount,
  participants,
  currentUserId,
  onSelectWhisper,
}: RoomAudienceProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);

  const djs = participants.filter((p) => p.slotIndex !== null);
  const spectators = participants.filter((p) => p.slotIndex === null);

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return (
          <span className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ShieldAlert size={9} /> ADMIN
          </span>
        );
      case Role.MODERATOR:
        return (
          <span className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <ShieldCheck size={9} /> MOD
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative overflow-hidden w-full rounded-2xl bg-slate-900/85 border border-slate-800 p-3.5 shadow-xl transition">
      <div className="absolute inset-0 bg-[url('/ui-texture.jpg')] bg-cover bg-center opacity-[0.03] mix-blend-screen pointer-events-none" />
      {/* Header with toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-10 w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Users size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-200 group-hover:text-white transition">
                {t('room.whoIsHere')}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t('room.onlineCount', { count: onlineCount })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="hidden sm:inline font-mono">
            {t('room.listenersCount', { djCount: djs.length, spectatorCount: spectators.length })}
          </span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Participants List */}
      {isOpen && (
        <div className="relative z-10 mt-3 pt-3 border-t border-slate-800/80 space-y-2">
          {participants.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-2">
              {t('room.noListenersYet')}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {participants.map((p) => {
                const isMe = p.userId === currentUserId;
                const isDj = p.slotIndex !== null;

                return (
                  <div
                    key={p.userId}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border transition ${
                      isMe
                        ? 'bg-violet-900/30 border-violet-500/40 text-violet-200'
                        : isDj
                        ? 'bg-slate-800/80 border-slate-700/80 text-cyan-200'
                        : 'bg-slate-800/40 border-slate-800 text-slate-300'
                    }`}
                  >
                    {/* Status dot */}
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        p.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                      title={p.isOnline ? t('slots.onlineStatus') : t('slots.offlineStatus')}
                    />

                    {/* DJ or Spectator badge */}
                    {isDj ? (
                      <span className="text-[10px] font-black px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 flex items-center gap-0.5">
                        <Headphones size={9} /> #{p.slotIndex}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <Eye size={9} />
                      </span>
                    )}

                    {/* Nickname */}
                    <span className="font-semibold truncate max-w-[120px]" title={p.nickname}>
                      {p.nickname}
                      {isMe && <span className="text-[10px] text-violet-400 ml-1 font-normal">{t('room.youBadge')}</span>}
                    </span>

                    {/* Role badge */}
                    {getRoleBadge(p.role)}

                    {/* Whisper action button */}
                    {!isMe && onSelectWhisper && (
                      <button
                        type="button"
                        onClick={() => onSelectWhisper(p.userId, p.nickname)}
                        className="p-1 rounded hover:bg-slate-700/70 text-slate-400 hover:text-purple-300 transition"
                        title={t('room.whisperTo', { nick: p.nickname })}
                      >
                        <MessageSquare size={11} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
