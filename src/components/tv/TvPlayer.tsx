'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { Play, WifiOff, Music, ListMusic } from 'lucide-react';
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

// Ultra-lightweight memoized Next 3 Tracks panel
const TvNextTracks = memo(function TvNextTracks({
  queue,
}: {
  queue: TvQueuePreviewItem[];
}) {
  const top3 = queue.slice(0, 3);

  return (
    <div className="w-full lg:w-80 xl:w-96 flex flex-col justify-center shrink-0">
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl">
        <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-slate-800">
          <ListMusic size={18} className="text-red-500" />
          <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-200">
            Következő dalok ({top3.length})
          </h2>
        </div>

        {top3.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs sm:text-sm font-medium">
            Nincs több dal a lejátszási sorban.
          </div>
        ) : (
          <div className="space-y-2.5">
            {top3.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3"
              >
                <span className="font-mono text-base sm:text-lg font-black text-red-500 w-5 text-center shrink-0">
                  {idx + 1}.
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-white truncate leading-snug">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
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
    </div>
  );
});

export default function TvPlayer({
  roomId,
  roomName,
  roomSlug,
  playback,
  queuePreview,
  isConnected,
  debugMode = false,
}: TvPlayerProps) {
  const [playerReady, setPlayerReady] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const playerRef = useRef<any>(null);
  const currentVideoIdRef = useRef<string | null>(null);
  const playbackRef = useRef<TvPlaybackData | null>(playback);
  playbackRef.current = playback;

  // Initialize YouTube Iframe API (Lightweight, hardware-accelerated)
  useEffect(() => {
    let isMounted = true;

    const createPlayer = () => {
      if (playerRef.current || !isMounted) return;
      try {
        playerRef.current = new window.YT.Player('tv-youtube-player-iframe', {
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
            onReady: (e: any) => {
              if (!isMounted) return;
              setPlayerReady(true);
              try {
                e.target.playVideo();
              } catch {}
            },
            onStateChange: (e: any) => {
              // 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING
              if (e.data === 1) {
                setAutoplayBlocked(false);
              }
            },
            onError: (err: any) => {
              console.warn('TV YouTube Player Error:', err?.data);
            },
          },
        });
      } catch (err) {
        console.error('Failed to create TV YT Player:', err);
      }
    };

    if (!window.YT || !window.YT.Player) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
    } else {
      createPlayer();
    }

    return () => {
      isMounted = false;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
    };
  }, []);

  // TV Remote Enter/Space Key handler to unlock autoplay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space' || e.key === 'MediaPlayPause') {
        if (playerRef.current) {
          try {
            playerRef.current.playVideo();
            setAutoplayBlocked(false);
          } catch {}
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Video switching & Play/Pause (Triggered ONLY when videoId or paused state changes)
  useEffect(() => {
    if (!playerReady || !playerRef.current || !playback) return;

    const targetVideoId = playback.videoId;

    if (targetVideoId && targetVideoId !== currentVideoIdRef.current) {
      currentVideoIdRef.current = targetVideoId;

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
        console.error('TV Error loading video:', err);
      }
    } else if (playback.paused) {
      try {
        if (typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo();
        }
      } catch {}
    } else if (currentVideoIdRef.current === targetVideoId) {
      try {
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      } catch {}
    }
  }, [playback?.videoId, playback?.paused, playerReady]);

  // Gentle background drift correction (Runs passively every 8s WITHOUT React setState to prevent UI lag!)
  useEffect(() => {
    const driftCheckInterval = setInterval(() => {
      const current = playbackRef.current;
      if (!current || !current.videoId || current.paused || !playerRef.current) return;

      try {
        if (typeof playerRef.current.getCurrentTime === 'function' && current.startedAt) {
          const expectedPos = Math.max(0, (Date.now() - new Date(current.startedAt).getTime()) / 1000);
          const actualPos = playerRef.current.getCurrentTime() || 0;
          const drift = Math.abs(expectedPos - actualPos);

          // Only seek if drift is significant (> 4.0s) and not past song duration
          if (drift > 4.0 && expectedPos < (current.duration || 99999)) {
            playerRef.current.seekTo(expectedPos, true);
          }
        }
      } catch {}
    }, 8000);

    return () => clearInterval(driftCheckInterval);
  }, []);

  return (
    <div className="relative min-h-screen w-screen flex flex-col justify-center p-4 sm:p-6 lg:p-8 select-none overflow-hidden">
      {/* Disconnect Alert */}
      {!isConnected && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600/90 text-white font-bold text-sm shadow-xl animate-pulse">
          <WifiOff size={18} />
          <span>Kapcsolat megszakadt...</span>
        </div>
      )}

      {/* Main Layout: 16:9 Video + Next 3 Songs */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-6 max-w-[1920px] mx-auto w-full flex-1">
        {/* Dominant 16:9 Video Player */}
        <div className="w-full flex-1 flex items-center justify-center">
          <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
            <div id="tv-youtube-player-iframe" className="w-full h-full" />

            {/* Waiting placeholder when queue is empty */}
            {!playback?.videoId && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90 text-center p-6">
                <div className="p-4 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30">
                  <Music size={40} className="animate-pulse" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Várakozás a következő videóra...
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  A szoba lejátszási sora üres. Küldj be dalt a szobából!
                </p>
              </div>
            )}

            {/* Autoplay blocked banner (Enter/OK unlocks) */}
            {autoplayBlocked && (
              <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center gap-4 p-6">
                <button
                  onClick={() => {
                    try {
                      playerRef.current?.playVideo();
                      setAutoplayBlocked(false);
                    } catch {}
                  }}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xl shadow-xl transition active:scale-95 animate-bounce"
                >
                  <Play size={24} />
                  <span>LEJÁTSZÁS INDÍTÁSA (Enter)</span>
                </button>
                <p className="text-xs text-slate-300">
                  Nyomd meg az OK / Enter gombot a távirányítón a videó elindításához.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Next 3 Songs */}
        <TvNextTracks queue={queuePreview} />
      </div>
    </div>
  );
}
