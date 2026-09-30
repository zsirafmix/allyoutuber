'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, AlertCircle, RefreshCw, Music, Radio, Disc, WifiOff, Users, Clock, User as UserIcon } from 'lucide-react';
import { formatDuration } from '@/lib/youtube';

export interface TvQueuePreviewItem {
  id: string;
  position: number;
  title: string;
  duration: number;
  submittedNick: string;
  thumbnailUrl: string;
  source: string;
}

export interface TvPlaybackData {
  videoId: string | null;
  title: string | null;
  duration: number;
  thumbnailUrl: string | null;
  submittedBy: string | null;
  source: string;
  startedAt: string | Date | null;
  paused: boolean;
  currentPosition: number;
  serverTime: number;
}

interface TvPlayerProps {
  roomId: string;
  roomName: string;
  roomSlug: string;
  playback: TvPlaybackData | null;
  queuePreview: TvQueuePreviewItem[];
  onlineCount?: number;
  isConnected: boolean;
  debugMode?: boolean;
  onDisconnect?: () => void;
  onRequestSync?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function TvPlayer({
  roomId,
  roomName,
  roomSlug,
  playback,
  queuePreview,
  onlineCount = 1,
  isConnected,
  debugMode = false,
  onDisconnect,
  onRequestSync,
}: TvPlayerProps) {
  const [playerReady, setPlayerReady] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [currentPlayedVideoId, setCurrentPlayedVideoId] = useState<string | null>(null);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [actualPlayerTime, setActualPlayerTime] = useState<number>(0);
  const [driftSec, setDriftSec] = useState<number>(0);
  const [lastSocketEventTime, setLastSocketEventTime] = useState<string>(new Date().toLocaleTimeString());

  // OLED screen-burn protection: subtle subpixel shifting (1-3px every 45s)
  const [oledShift, setOledShift] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, []);

  const initPlayer = () => {
    if (playerRef.current) return;
    try {
      playerRef.current = new window.YT.Player('tv-youtube-iframe-player', {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setPlayerReady(true);
            event.target.playVideo();
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
            if (event.data === 1) {
              setAutoplayBlocked(false);
            }
          },
          onError: (err: any) => {
            console.error('TV YouTube Player Error:', err);
          },
        },
      });
    } catch (err) {
      console.error('Failed to init YT player:', err);
    }
  };

  // OLED Screen burn prevention periodic shifter (runs every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const randomX = (Math.random() * 4 - 2); // -2px to +2px
      const randomY = (Math.random() * 4 - 2);
      setOledShift({ x: randomX, y: randomY });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // TV Remote Navigation: Enter key dismisses autoplay block & starts playback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space') {
        if (autoplayBlocked && playerRef.current) {
          try {
            playerRef.current.playVideo();
            setAutoplayBlocked(false);
          } catch {}
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [autoplayBlocked]);

  // Video Change & Playback Synchronization
  useEffect(() => {
    if (!playback || !playerReady || !playerRef.current) return;

    const targetVideoId = playback.videoId;
    setLastSocketEventTime(new Date().toLocaleTimeString());

    // 1. New Video Loaded
    if (targetVideoId && targetVideoId !== currentPlayedVideoId) {
      setCurrentPlayedVideoId(targetVideoId);

      // Compute starting position
      let startSeconds = 0;
      if (playback.startedAt && !playback.paused) {
        startSeconds = Math.max(0, (Date.now() - new Date(playback.startedAt).getTime()) / 1000);
      }

      try {
        if (typeof playerRef.current.loadVideoById === 'function') {
          playerRef.current.loadVideoById({
            videoId: targetVideoId,
            startSeconds,
          });
          playerRef.current.playVideo();
        }
      } catch (err) {
        console.error('Failed to load video on TV:', err);
      }
    }

    // 2. Pause / Resume state
    if (playback.paused) {
      try {
        if (typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo();
        }
      } catch {}
    } else if (currentPlayedVideoId === targetVideoId) {
      try {
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      } catch {}
    }
  }, [playback, playerReady, currentPlayedVideoId]);

  // Periodic Local Time Tick & Best-Effort Sync Correction (every 1s)
  useEffect(() => {
    if (!playback || !playback.videoId || playback.paused) {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      return;
    }

    syncIntervalRef.current = setInterval(() => {
      // 1. Calculate expected server position
      let expectedPos = 0;
      if (playback.startedAt) {
        expectedPos = Math.max(0, (Date.now() - new Date(playback.startedAt).getTime()) / 1000);
      }
      setCurrentTimeSec(expectedPos);

      // 2. Query actual player position
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const actualTime = playerRef.current.getCurrentTime() || 0;
          setActualPlayerTime(actualTime);
          const drift = Math.abs(expectedPos - actualTime);
          setDriftSec(drift);

          // If drift exceeds 2.5 seconds and playback is active, gently seek to expected position
          if (drift > 2.5 && expectedPos < (playback.duration || 99999)) {
            playerRef.current.seekTo(expectedPos, true);
          }
        } catch {}
      }
    }, 1000);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [playback]);

  const durationSec = playback?.duration || 0;
  const progressPercent = durationSec > 0 ? Math.min(100, (currentTimeSec / durationSec) * 100) : 0;

  return (
    <div className="relative min-h-screen w-screen bg-black text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Background UI Texture and Ambient Neon Glow */}
      <div className="absolute inset-0 bg-[url('/ui-texture.jpg')] bg-cover bg-center opacity-[0.06] mix-blend-screen pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Connection Lost Alert Banner */}
      {!isConnected && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-2xl bg-red-600/90 text-white font-bold text-base shadow-2xl border border-red-400 animate-pulse">
          <WifiOff size={22} />
          <span>Kapcsolat megszakadt. Helyreállítás folyamatban...</span>
        </div>
      )}

      {/* TV Debug Overlay (Active only when ?debug=1) */}
      {debugMode && (
        <div className="absolute top-4 right-4 z-50 p-4 rounded-2xl bg-black/90 border border-emerald-500/50 text-[11px] font-mono text-emerald-300 space-y-1 shadow-2xl backdrop-blur-md max-w-xs pointer-events-none">
          <div className="flex items-center justify-between font-bold border-b border-emerald-500/30 pb-1">
            <span>📺 TV DEBUG MODE</span>
            <span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <p>Room: {roomSlug} ({roomId})</p>
          <p>Video ID: {playback?.videoId || '—'}</p>
          <p>Expected Pos: {currentTimeSec.toFixed(1)}s</p>
          <p>Actual Pos: {actualPlayerTime.toFixed(1)}s</p>
          <p>Sync Drift: {driftSec.toFixed(2)}s</p>
          <p>Last Event: {lastSocketEventTime}</p>
        </div>
      )}

      {/* Main 16:9 Video & Info Stage */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 flex-1 items-stretch">
        {/* Left Side: Massive 16:9 YouTube Player Frame */}
        <div className="lg:col-span-8 flex flex-col justify-center">
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-950 border-2 border-red-500/50 shadow-2xl shadow-red-950/60 ring-2 ring-red-500/20">
            {/* YouTube Iframe Container */}
            <div id="tv-youtube-iframe-player" className="w-full h-full" />

            {/* Waiting for video placeholder */}
            {(!playback?.videoId) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/90 text-center p-6">
                <div className="p-5 rounded-3xl bg-red-600/20 text-red-400 border border-red-500/30 animate-pulse">
                  <Disc size={56} className="animate-spin" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Várakozás a következő videóra...
                </h3>
                <p className="text-sm text-slate-400 max-w-md">
                  A szoba lejátszási listája jelenleg üres. Küldj be egy dalt a telefonodról!
                </p>
              </div>
            )}

            {/* Autoplay Blocked Big Overlay Button */}
            {autoplayBlocked && (
              <div className="absolute inset-0 z-40 bg-black/85 flex flex-col items-center justify-center gap-5 p-6 backdrop-blur-sm">
                <button
                  onClick={() => {
                    try {
                      playerRef.current?.playVideo();
                      setAutoplayBlocked(false);
                    } catch {}
                  }}
                  className="flex items-center gap-4 px-10 py-5 rounded-3xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-2xl shadow-2xl shadow-red-600/60 border-2 border-red-400 transform transition active:scale-95 animate-bounce"
                >
                  <Play size={32} />
                  <span>LEJÁTSZÁS INDÍTÁSA (Enter)</span>
                </button>
                <p className="text-xs text-slate-300">
                  Nyomd meg az Enter vagy OK gombot a TV távirányítón a videó elindításához.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: MOST JÁTSZIK & KÖVETKEZIK Panels */}
        <div
          className="lg:col-span-4 flex flex-col justify-between gap-4"
          style={{
            transform: `translate(${oledShift.x}px, ${oledShift.y}px)`,
            transition: 'transform 10s ease-in-out',
          }}
        >
          {/* 1. MOST JÁTSZIK (Now Playing) Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border-2 border-red-500/60 shadow-2xl shadow-red-950/50 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  MOST JÁTSZIK
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold font-mono">
                  {roomName}
                </span>
              </div>

              {/* Large, high-visibility title (32-40px on large displays) */}
              <h2 className="text-2xl sm:text-3xl lg:text-3xl font-black text-white leading-tight tracking-tight line-clamp-3" title={playback?.title || ''}>
                {playback?.title || 'Nincs aktív lejátszás'}
              </h2>

              <div className="mt-4 flex items-center gap-2 text-slate-300 text-base font-semibold">
                <UserIcon size={18} className="text-red-400" />
                <span>Beküldte: <strong className="text-white font-bold">{playback?.submittedBy || '🤖 Auto-DJ'}</strong></span>
              </div>
            </div>

            {/* Progress Bar & Durations */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 font-bold">
                <span>{formatDuration(Math.floor(currentTimeSec))}</span>
                <span>{formatDuration(durationSec)}</span>
              </div>
            </div>
          </div>

          {/* 2. KÖVETKEZIK (Up Next max 3) Card */}
          <div className="p-6 rounded-3xl bg-slate-900/85 border border-slate-800 shadow-2xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Clock size={16} className="text-red-400" />
                  <span>KÖVETKEZIK ({queuePreview.length})</span>
                </h3>
              </div>

              {queuePreview.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-sm font-medium">
                  Nincs további videó a sorban.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {queuePreview.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex items-center gap-3.5 shadow-md"
                    >
                      <span className="font-mono text-lg font-black text-red-500/80 w-6 text-center">
                        {idx + 1}.
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-bold text-slate-100 truncate leading-snug" title={item.title}>
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-medium">
                          <span className="font-mono text-slate-300 font-semibold">{formatDuration(item.duration)}</span>
                          <span>•</span>
                          <span className="truncate text-slate-300">{item.submittedNick}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Room Info */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Users size={14} className="text-emerald-400" />
                <span>{onlineCount} jelenlévő a szobában</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                /tv/{roomSlug}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
