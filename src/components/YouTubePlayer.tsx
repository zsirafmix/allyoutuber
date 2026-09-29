'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Volume2, Play, Disc } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string | null;
  currentPosition: number;
  paused: boolean;
  serverTime: number;
  onEnded?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubePlayer({
  videoId,
  currentPosition,
  paused,
  serverTime,
  onEnded,
}: YouTubePlayerProps) {
  const { t } = useLanguage();
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [apiReady, setApiReady] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Load YouTube IFrame API once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setApiReady(true);
    };
  }, []);

  // Initialize or re-create player when videoId changes or API becomes ready
  useEffect(() => {
    if (!apiReady || !videoId || !containerRef.current) return;

    if (playerRef.current) {
      // Check if same video
      const currentUrl = playerRef.current.getVideoUrl?.() || '';
      if (currentUrl.includes(videoId)) {
        // Sync position if drift is noticeable (> 2.5s)
        const localTime = playerRef.current.getCurrentTime?.() || 0;
        if (Math.abs(localTime - currentPosition) > 2.5) {
          playerRef.current.seekTo(currentPosition, true);
        }
        if (paused) {
          playerRef.current.pauseVideo?.();
        } else {
          playerRef.current.playVideo?.();
        }
        return;
      }
      playerRef.current.destroy?.();
    }

    try {
      playerRef.current = new window.YT.Player('yt-player-frame', {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          disablekb: 0,
          enablejsapi: 1,
          fs: 1,
          modestbranding: 1,
          rel: 0,
          start: Math.floor(currentPosition),
        },
        events: {
          onReady: (event: any) => {
            if (!paused) {
              const playPromise = event.target.playVideo();
              if (playPromise !== undefined) {
                playPromise.catch(() => {
                  // Autoplay with sound was blocked by browser
                  setAutoplayBlocked(true);
                  event.target.mute();
                  event.target.playVideo();
                });
              }
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED is 0
            if (event.data === 0 && onEnded) {
              onEnded();
            }
          },
          onError: (err: any) => {
            console.warn('YouTube Player error:', err);
          },
        },
      });
    } catch (e) {
      console.error('Failed to instantiate YouTube player:', e);
    }

    return () => {
      // Cleanup on unmount
    };
  }, [apiReady, videoId]);

  // Synchronize drift periodically
  useEffect(() => {
    if (!playerRef.current || !playerRef.current.getCurrentTime) return;

    const interval = setInterval(() => {
      if (paused) return;
      try {
        const localTime = playerRef.current.getCurrentTime();
        if (typeof localTime === 'number' && Math.abs(localTime - currentPosition) > 3.0) {
          playerRef.current.seekTo(currentPosition, true);
        }
      } catch {}
    }, 4000);

    return () => clearInterval(interval);
  }, [currentPosition, paused]);

  const handleUnlockAudio = () => {
    if (playerRef.current) {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
        playerRef.current.playVideo();
        setAutoplayBlocked(false);
        setIsMuted(false);
      } catch (err) {
        console.error('Error unlocking audio:', err);
      }
    }
  };

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
      {/* Container where YT player is rendered */}
      <div ref={containerRef} className="w-full h-full">
        {videoId ? (
          <div id="yt-player-frame" className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-gradient-to-br from-slate-900 to-slate-950">
            <Disc size={64} className="text-violet-500 animate-spin" style={{ animationDuration: '6s' }} />
            <p className="mt-4 text-lg font-semibold text-slate-300">
              {t('room.emptyQueue')}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Illessz be egy YouTube videót a lejátszási sorhoz, vagy várj a DJ-re!
            </p>
          </div>
        )}
      </div>

      {/* Autoplay unlock overlay */}
      {autoplayBlocked && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-2xl bg-violet-600/30 border border-violet-500/50 text-violet-300 mb-4 animate-bounce">
            <Volume2 size={40} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {t('room.enterSound')}
          </h3>
          <p className="text-xs text-slate-300 max-w-md mb-6">
            A böngésződ biztonsági beállításai miatt a hang engedélyezéséhez kattints az alábbi gombra!
          </p>
          <button
            onClick={handleUnlockAudio}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-xl shadow-violet-600/40 transition transform active:scale-95"
          >
            <Play size={20} />
            <span>{t('room.enterSound')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
