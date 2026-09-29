'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { formatDuration } from '@/lib/youtube';
import { VideoSource, Role } from '@prisma/client';
import {
  Plus,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  ArrowUp,
  ArrowDown,
  PlayCircle,
  Bot,
  User as UserIcon,
  Shield,
  ListMusic,
} from 'lucide-react';

export interface QueueItemData {
  id: string;
  videoId: string;
  title: string;
  duration: number;
  thumbnailUrl: string;
  submittedNick: string;
  submittedById?: string | null;
  source: VideoSource;
  position: number;
  score: number;
  votes?: Array<{ userId: string; value: number }>;
}

interface VideoQueueProps {
  queue: QueueItemData[];
  currentUserId?: string | null;
  currentUserRole?: Role | null;
  onAddVideo: (url: string) => Promise<void>;
  onVote: (queueItemId: string, value: 1 | -1) => void;
  onRemove: (queueItemId: string) => void;
  onReorder: (queueItemId: string, targetPos: number) => void;
}

export default function VideoQueue({
  queue,
  currentUserId,
  currentUserRole,
  onAddVideo,
  onVote,
  onRemove,
  onReorder,
}: VideoQueueProps) {
  const { t } = useLanguage();
  const [urlInput, setUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isModOrAdmin = currentUserRole === Role.MODERATOR || currentUserRole === Role.ADMIN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onAddVideo(urlInput.trim());
      setUrlInput('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Nem sikerült hozzáadni a videót.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSourceBadge = (source: VideoSource) => {
    switch (source) {
      case VideoSource.DJ:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Bot size={12} /> {t('queue.sourceDj')}
          </span>
        );
      case VideoSource.ADMIN:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Shield size={12} /> {t('queue.sourceAdmin')}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            <UserIcon size={12} /> {t('queue.sourceUser')}
          </span>
        );
    }
  };

  const upNextItem = queue.length > 0 ? queue[0] : null;
  const remainingQueue = queue.length > 1 ? queue.slice(1) : [];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 1. Add Video Input Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={t('room.inputPlaceholder')}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !urlInput.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-violet-600/30 transition disabled:opacity-50"
          >
            <Plus size={16} />
            <span>{isSubmitting ? '...' : t('room.addVideo')}</span>
          </button>
        </form>

        {errorMsg && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white font-bold ml-2">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 2. UP NEXT (KÖVETKEZIK) Block */}
      {upNextItem && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/40 to-slate-900 border border-violet-800/50 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
              <PlayCircle size={14} /> {t('room.upNextTitle')}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {formatDuration(upNextItem.duration)}
            </span>
          </div>

          <div className="flex gap-3 items-center">
            <img
              src={upNextItem.thumbnailUrl}
              alt={upNextItem.title}
              className="w-24 h-14 object-cover rounded-lg border border-slate-700 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white truncate" title={upNextItem.title}>
                {upNextItem.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                {getSourceBadge(upNextItem.source)}
                <span className="text-xs text-slate-400 truncate">
                  {upNextItem.submittedNick}
                </span>
              </div>
            </div>

            {/* Voting buttons */}
            <div className="flex items-center gap-1 shrink-0 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700">
              <button
                onClick={() => onVote(upNextItem.id, 1)}
                className="p-1 text-slate-400 hover:text-emerald-400 active:scale-125 transition"
                title="Upvote"
              >
                <ThumbsUp size={14} />
              </button>
              <span className="text-xs font-bold text-white min-w-[20px] text-center">
                {upNextItem.score}
              </span>
              <button
                onClick={() => onVote(upNextItem.id, -1)}
                className="p-1 text-slate-400 hover:text-rose-400 active:scale-125 transition"
                title="Downvote"
              >
                <ThumbsDown size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Full Queue List */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <ListMusic size={16} className="text-cyan-400" />
            <span>{t('queue.title')}</span>
            <span className="text-xs text-slate-500 font-mono">({queue.length})</span>
          </h3>
        </div>

        {queue.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            {t('room.emptyQueue')}
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
            {queue.map((item, idx) => {
              const canDelete = isModOrAdmin || item.submittedById === currentUserId;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition group"
                >
                  <span className="text-xs font-bold text-slate-500 w-5 text-center">
                    #{idx + 1}
                  </span>

                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-16 h-10 object-cover rounded-md border border-slate-700 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate" title={item.title}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDuration(item.duration)}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        • {item.submittedNick}
                      </span>
                      {getSourceBadge(item.source)}
                    </div>
                  </div>

                  {/* Voting */}
                  <div className="flex items-center gap-1 bg-slate-900/60 px-1.5 py-0.5 rounded-lg border border-slate-700/80">
                    <button
                      onClick={() => onVote(item.id, 1)}
                      className="p-1 text-slate-400 hover:text-emerald-400 transition"
                    >
                      <ThumbsUp size={12} />
                    </button>
                    <span className="text-xs font-bold text-white min-w-[16px] text-center">
                      {item.score}
                    </span>
                    <button
                      onClick={() => onVote(item.id, -1)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition"
                    >
                      <ThumbsDown size={12} />
                    </button>
                  </div>

                  {/* Mod Controls / Delete */}
                  <div className="flex items-center gap-0.5">
                    {isModOrAdmin && idx > 0 && (
                      <button
                        onClick={() => onReorder(item.id, idx - 1)}
                        className="p-1 text-slate-400 hover:text-white transition"
                        title={t('queue.moveUp')}
                      >
                        <ArrowUp size={13} />
                      </button>
                    )}
                    {isModOrAdmin && idx < queue.length - 1 && (
                      <button
                        onClick={() => onReorder(item.id, idx + 1)}
                        className="p-1 text-slate-400 hover:text-white transition"
                        title={t('queue.moveDown')}
                      >
                        <ArrowDown size={13} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => onRemove(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                        title={t('queue.remove')}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
