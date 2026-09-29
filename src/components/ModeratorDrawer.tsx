'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { DJMode, QueueMode, Role, RoomType } from '@prisma/client';
import {
  ShieldAlert,
  FastForward,
  Bot,
  Lock,
  Unlock,
  RefreshCw,
  Copy,
  Check,
  X,
  Sliders,
  Users,
  UserCheck,
  UserX,
  VolumeX,
  Volume2,
  Trash2,
} from 'lucide-react';

interface ModeratorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  room: {
    id: string;
    slug: string;
    type: RoomType;
    isLocked: boolean;
  };
  settings: {
    slotCount: number;
    djMode: DJMode;
    queueMode: QueueMode;
    maxConsecutiveVideosPerUser: number;
    maxQueuedVideosPerUser: number;
    maxVideoDurationMinutes: number;
  };
  members: Array<{
    id: string;
    userId: string;
    nickname: string;
    role: Role;
    slotIndex: number | null;
    isMuted: boolean;
  }>;
  currentUserId?: string | null;
  currentUserRole?: Role | null;
  onSkipVideo: () => void;
  onRegenerateInvite: () => Promise<string>;
  onUpdateSettings?: (newSettings: any) => void;
  onSetRole?: (targetUserId: string, newRole: Role) => void;
  onKickMember?: (targetUserId: string) => void;
  onMuteMember?: (targetUserId: string, isMuted: boolean) => void;
  onDeleteRoom?: () => void;
}

export default function ModeratorDrawer({
  isOpen,
  onClose,
  room,
  settings,
  members,
  currentUserId,
  currentUserRole,
  onSkipVideo,
  onRegenerateInvite,
  onSetRole,
  onKickMember,
  onMuteMember,
  onDeleteRoom,
}: ModeratorDrawerProps) {
  const { t } = useLanguage();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const isAdmin = currentUserRole === Role.ADMIN;

  if (!isOpen) return null;

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const code = await onRegenerateInvite();
      setInviteCode(code);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyInvite = () => {
    if (!inviteCode) return;
    const url = `${window.location.origin}/room/${room.slug}?invite=${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2 text-violet-400">
              <ShieldAlert size={20} />
              <h2 className="text-lg font-bold text-white">{t('mod.title')}</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X size={20} />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4 mb-6">
            <button
              onClick={onSkipVideo}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/50 text-violet-200 font-bold transition text-sm"
            >
              <FastForward size={18} />
              <span>{t('mod.skipVideo')}</span>
            </button>

            {/* Private Room Invite Generator */}
            {room.type === RoomType.PRIVATE && isAdmin && (
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    {t('room.inviteLink')}
                  </span>
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium"
                  >
                    <RefreshCw size={12} className={isRegenerating ? 'animate-spin' : ''} />
                    <span>{t('mod.regenerateInvite')}</span>
                  </button>
                </div>

                {inviteCode && (
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={`${window.location.origin}/room/${room.slug}?invite=${inviteCode}`}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300"
                    />
                    <button
                      onClick={handleCopyInvite}
                      className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition"
                      title={t('room.copyInvite')}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
                {copied && (
                  <p className="text-[11px] text-emerald-400 font-medium">{t('room.inviteCopied')}</p>
                )}
              </div>
            )}
          </div>

          {/* Current Settings Overview */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <Sliders size={13} /> Szoba Konfiguráció
            </h3>
            <div className="flex justify-between text-xs text-slate-300">
              <span className="text-slate-400">{t('mod.djMode')}:</span>
              <span className="font-semibold text-cyan-400">{settings.djMode}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-300">
              <span className="text-slate-400">{t('queue.mode')}:</span>
              <span className="font-semibold text-violet-400">{settings.queueMode}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-300">
              <span className="text-slate-400">{t('mod.consecutiveLimit')}:</span>
              <span className="font-semibold text-white">{settings.maxConsecutiveVideosPerUser}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-300">
              <span className="text-slate-400">{t('mod.maxQueued')}:</span>
              <span className="font-semibold text-white">{settings.maxQueuedVideosPerUser}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-300">
              <span className="text-slate-400">{t('mod.durationLimit')}:</span>
              <span className="font-semibold text-white">{settings.maxVideoDurationMinutes} perc</span>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <Users size={13} /> {t('app.online')} ({members.length})
            </h3>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {members.map((m) => {
                const isSelf = m.userId === currentUserId;
                const canManageUser = isAdmin && !isSelf;
                const canModAction = (isAdmin || currentUserRole === Role.MODERATOR) && !isSelf && m.role !== Role.ADMIN;

                return (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs gap-2"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-300">{m.nickname}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {m.slotIndex ? `(Slot #${m.slotIndex})` : '(Néző)'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          m.role === Role.ADMIN
                            ? 'bg-amber-500/20 text-amber-300'
                            : m.role === Role.MODERATOR
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {m.role}
                      </span>
                      {m.isMuted && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          Némítva
                        </span>
                      )}
                    </div>

                    {/* Moderation Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {/* Promote/Demote Moderator (Admin only) */}
                      {canManageUser && (
                        m.role === Role.MODERATOR ? (
                          <button
                            onClick={() => onSetRole?.(m.userId, Role.USER)}
                            className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold transition"
                            title="Moderátori jog visszavonása"
                          >
                            -MOD
                          </button>
                        ) : m.role === Role.USER ? (
                          <button
                            onClick={() => onSetRole?.(m.userId, Role.MODERATOR)}
                            className="px-2 py-0.5 rounded bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-[10px] font-bold transition"
                            title="Kinevezés moderátornak"
                          >
                            +MOD
                          </button>
                        ) : null
                      )}

                      {/* Mute/Unmute */}
                      {canModAction && (
                        <button
                          onClick={() => onMuteMember?.(m.userId, !m.isMuted)}
                          className={`p-1 rounded text-[10px] font-bold transition ${
                            m.isMuted
                              ? 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                          }`}
                          title={m.isMuted ? 'Némítás feloldása' : 'Némítás'}
                        >
                          {m.isMuted ? <Volume2 size={12} /> : <VolumeX size={12} />}
                        </button>
                      )}

                      {/* Kick from slot */}
                      {canModAction && m.slotIndex !== null && (
                        <button
                          onClick={() => onKickMember?.(m.userId)}
                          className="p-1 rounded bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 text-rose-300 text-[10px] font-bold transition"
                          title="Felállítás a helyről"
                        >
                          <UserX size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Admin Danger Zone: Room Deletion */}
          {isAdmin && (
            <div className="pt-4 border-t border-rose-900/40 mt-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Trash2 size={13} /> Veszélyzóna (Admin)
              </span>
              <button
                onClick={() => {
                  if (window.confirm(`Biztosan véglegesen törölni szeretnéd a(z) "${room.slug}" szobát? Ez nem vonható vissza!`)) {
                    onDeleteRoom?.();
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Trash2 size={14} />
                <span>Szoba Végleges Törlése</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition mt-6"
        >
          {t('room.cancel')}
        </button>
      </div>
    </div>
  );
}
