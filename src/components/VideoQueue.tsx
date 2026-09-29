'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { formatDuration, parseYouTubeVideoId } from '@/lib/youtube';
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
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
  Headphones,
  X,
  Disc,
} from 'lucide-react';

const YouTubeLogo = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

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
  isSeated?: boolean;
  userSlotIndex?: number | null;
  onAddVideo: (url: string) => Promise<void>;
  onVote: (queueItemId: string, value: 1 | -1) => void;
  onRemove: (queueItemId: string) => void;
  onReorder: (queueItemId: string, targetPos: number) => void;
}

export default function VideoQueue({
  queue,
  currentUserId,
  currentUserRole,
  isSeated,
  userSlotIndex,
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
  const detectedVideoId = parseYouTubeVideoId(urlInput);

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrlInput(text.trim());
          setErrorMsg(null);
        }
      }
    } catch {
      // Clipboard read permission might be denied
    }
  };

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
      {/* 1. Add Video Input Bar - Prominent YouTube Hub */}
      <div className="relative p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-red-950/30 border-2 border-red-500/70 shadow-2xl shadow-red-950/50 ring-1 ring-red-500/40 overflow-hidden transition-all">
        {/* Ambient background glow */}
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header with YouTube logo and DJ seat indicator */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-lg shadow-red-600/40 ring-2 ring-red-400/30 shrink-0">
              <YouTubeLogo className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  YouTube Videó Hozzáadása
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                  🔴 Soron következő
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Másold be a linket, és tedd be a szoba közös lejátszási listájába!
              </p>
            </div>
          </div>

          {/* DJ Status Badge */}
          {isSeated && userSlotIndex ? (
            <div className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold shrink-0">
              <Headphones size={13} className="text-cyan-400" />
              <span>DJ #{userSlotIndex} széked aktív</span>
            </div>
          ) : (
            <div className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold shrink-0">
              <AlertCircle size={13} className="text-amber-400" />
              <span>DJ szék szükséges</span>
            </div>
          )}
        </div>

        {/* Input Form with large high-contrast border and paste button */}
        <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1 flex items-center bg-slate-950/90 border-2 border-red-500/50 hover:border-red-400 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/20 rounded-2xl transition shadow-inner">
            <div className="pl-3.5 pr-1 flex items-center justify-center text-red-500 shrink-0">
              <YouTubeLogo className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Illeszd be ide a YouTube linket (pl. https://youtu.be/... vagy https://youtube.com/watch?v=...)"
              className="w-full py-3.5 px-2 bg-transparent text-white placeholder-slate-400 text-sm sm:text-base font-semibold focus:outline-none"
              disabled={isSubmitting}
            />

            {urlInput && (
              <button
                type="button"
                onClick={() => setUrlInput('')}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition mr-1"
                title="Törlés"
              >
                <X size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={handlePasteClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition shrink-0 active:scale-95 shadow-sm"
              title="Beillesztés a vágólapról"
            >
              <ClipboardPaste size={14} className="text-red-400" />
              <span className="hidden sm:inline">Beillesztés</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !urlInput.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white text-sm sm:text-base font-black shadow-xl shadow-red-600/40 hover:shadow-red-500/60 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isSubmitting ? (
              <>
                <Disc size={18} className="animate-spin" />
                <span>Hozzáadás...</span>
              </>
            ) : (
              <>
                <Plus size={20} strokeWidth={3} />
                <span>Videó Hozzáadása</span>
              </>
            )}
          </button>
        </form>

        {/* Live Detected YouTube Preview */}
        {detectedVideoId && (
          <div className="mt-3 p-3 rounded-2xl bg-slate-950/80 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/20">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={`https://img.youtube.com/vi/${detectedVideoId}/hqdefault.jpg`}
                alt="Előnézet"
                className="w-16 h-10 object-cover rounded-xl border border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span className="truncate">Érvényes YouTube videó felismerve!</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate">Azonosító: {detectedVideoId}</p>
              </div>
            </div>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline shrink-0">
              Nyomd meg a gombot vagy az Entert ⏎
            </span>
          </div>
        )}

        {/* Seat Requirement Warning if user is not in DJ slot */}
        {!isSeated && currentUserRole !== Role.ADMIN && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-400 shrink-0" />
            <span>
              <strong>Figyelem:</strong> Zenét csak DJ széket elfoglaló felhasználók küldhetnek be a várólistára. Foglalj el egy szabad helyet a jobb oldali székek közül a <strong>&quot;Foglalás&quot;</strong> gombbal!
            </span>
          </div>
        )}

        {/* Supported link formats helper */}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
          <span className="font-semibold text-slate-500">Támogatott linkek:</span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono">youtube.com/watch?v=...</span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono">youtu.be/...</span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono">youtube.com/shorts/...</span>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center justify-between shadow-lg shadow-red-950/30">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-red-300 hover:text-white font-bold p-1 rounded-lg hover:bg-red-500/30 transition"
            >
              <X size={14} />
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
