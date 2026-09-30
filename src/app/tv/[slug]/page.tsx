'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import TvPlayer, { TvPlaybackData, TvQueuePreviewItem } from '@/components/tv/TvPlayer';
import { getSocket } from '@/lib/socketClient';

function DirectTvRoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const debugMode = searchParams.get('debug') === '1';

  const [roomId, setRoomId] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [roomSlug, setRoomSlug] = useState<string>(slug || '');
  const [playback, setPlayback] = useState<TvPlaybackData | null>(null);
  const [queuePreview, setQueuePreview] = useState<TvQueuePreviewItem[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!slug) return;

    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      setIsConnected(true);
      socket.emit('tv:init', { directSlug: slug });
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('tv:paired', (data: any) => {
      if (data.roomId) setRoomId(data.roomId);
      if (data.roomSlug) setRoomSlug(data.roomSlug);
      if (data.roomName) setRoomName(data.roomName);
    });

    socket.on('tv:queue_preview', (preview: TvQueuePreviewItem[]) => {
      setQueuePreview(preview || []);
    });

    socket.on('room:state_update', (state: any) => {
      if (state.room) {
        setRoomId(state.room.id);
        setRoomSlug(state.room.slug);
        setRoomName(state.room.name);
      }
      if (state.playback) {
        setPlayback(state.playback);
      }
      if (state.onlineCount !== undefined) {
        setOnlineCount(state.onlineCount);
      }
      if (state.queue) {
        const preview = state.queue.slice(0, 3).map((item: any, idx: number) => ({
          id: item.id,
          position: idx + 1,
          title: item.title,
          duration: item.duration,
          submittedNick: item.submittedNick,
          thumbnailUrl: item.thumbnailUrl,
          source: item.source,
        }));
        setQueuePreview(preview);
      }
    });

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('tv:paired');
      socket.off('tv:queue_preview');
      socket.off('room:state_update');
    };
  }, [slug]);

  const handleRequestSync = useCallback(() => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('tv:sync_request', { roomId });
    }
  }, [roomId]);

  return (
    <TvPlayer
      roomId={roomId}
      roomName={roomName || slug}
      roomSlug={roomSlug}
      playback={playback}
      queuePreview={queuePreview}
      onlineCount={onlineCount}
      isConnected={isConnected}
      debugMode={debugMode}
      onRequestSync={handleRequestSync}
    />
  );
}

export default function DirectTvRoomPage() {
  return (
    <React.Suspense
      fallback={
        <div className="w-screen h-screen bg-black flex items-center justify-center text-white text-2xl font-bold font-sans">
          Betöltés...
        </div>
      }
    >
      <DirectTvRoomContent />
    </React.Suspense>
  );
}
