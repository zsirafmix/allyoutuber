'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { Role } from '@prisma/client';
import { User, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';

interface Member {
  id: string;
  userId: string;
  nickname: string;
  role: Role;
  slotIndex: number | null;
  lastActiveAt: string | Date;
  isOnline?: boolean;
}

interface SlotsGridProps {
  slotCount: number;
  members: Member[];
  currentUserId?: string | null;
  onClaimSlot: (slot: number) => void;
}

export default function SlotsGrid({
  slotCount,
  members,
  currentUserId,
  onClaimSlot,
}: SlotsGridProps) {
  const { t } = useLanguage();

  const slotsArray = Array.from({ length: slotCount }, (_, i) => i + 1);

  // Map occupied slots
  const slotMap = new Map<number, Member>();
  for (const m of members) {
    if (m.slotIndex !== null) {
      slotMap.set(m.slotIndex, m);
    }
  }

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ShieldAlert size={10} /> ADMIN
          </span>
        );
      case Role.MODERATOR:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <ShieldCheck size={10} /> MOD
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
            USER
          </span>
        );
    }
  };

  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <Sparkles size={16} className="text-violet-400" />
          <span>{t('room.slotsTitle')}</span>
          <span className="text-xs font-normal text-slate-500">
            ({slotMap.size}/{slotCount})
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {slotsArray.map((slotNum) => {
          const occupant = slotMap.get(slotNum);
          const isCurrentUser = occupant && occupant.userId === currentUserId;

          if (occupant) {
            return (
              <div
                key={slotNum}
                className={`p-2.5 rounded-xl border flex flex-col justify-between transition ${
                  isCurrentUser
                    ? 'bg-violet-950/40 border-violet-500/60 shadow-lg shadow-violet-900/20'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-500">#{slotNum}</span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      occupant.isOnline !== false
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-amber-400'
                    }`}
                    title={occupant.isOnline !== false ? 'Online a szobában' : 'Lekapcsolódott (hely fenntartva)'}
                  />
                </div>
                <div className="truncate font-bold text-xs sm:text-sm text-cyan-200" title={occupant.nickname}>
                  {occupant.nickname}
                </div>
                <div className="mt-1.5 flex justify-start">{getRoleBadge(occupant.role)}</div>
              </div>
            );
          }

          return (
            <button
              key={slotNum}
              onClick={() => onClaimSlot(slotNum)}
              className="p-2.5 rounded-xl border border-dashed border-slate-700/80 bg-slate-900/40 hover:bg-violet-900/20 hover:border-violet-500/60 text-slate-500 hover:text-violet-300 flex flex-col items-center justify-center gap-1 transition group"
              title={`Hely #${slotNum} elfoglalása`}
            >
              <span className="text-xs font-bold text-slate-500 group-hover:text-violet-400">
                #{slotNum}
              </span>
              <span className="text-[11px] font-medium flex items-center gap-1 text-slate-400 group-hover:text-white">
                <User size={12} /> {t('room.occupySlot')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Foglalt Nicknevek és Jelenlévők Szekció */}
      {members.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">
              👥 Foglalt nicknevek a szobában ({members.length}):
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {members.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <strong className="text-white font-bold">{m.nickname}</strong>
                <span className="text-[10px] text-slate-400 font-mono">
                  {m.slotIndex ? `#${m.slotIndex}` : 'Néző'}
                </span>
                {m.role === Role.ADMIN && (
                  <span className="text-[9px] font-black px-1 rounded bg-amber-500/20 text-amber-300">ADMIN</span>
                )}
                {m.role === Role.MODERATOR && (
                  <span className="text-[9px] font-black px-1 rounded bg-cyan-500/20 text-cyan-300">MOD</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
