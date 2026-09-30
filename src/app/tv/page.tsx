'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import TvPairingScreen from '@/components/tv/TvPairingScreen';
import TvPlayer, { TvPlaybackData, TvQueuePreviewItem } from '@/components/tv/TvPlayer';
import { getSocket } from '@/lib/socketClient';

function TvPageContent() {
  const searchParams = useSearchParams();
  const debugMode = searchParams.get('debug') === '1';

  const [loading, setLoading] = useState(true);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string>('TV-1');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isPaired, setIsPaired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Room & Playback State
  const [roomId, setRoomId] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [roomSlug, setRoomSlug] = useState<string>('');
  const [playback, setPlayback] = useState<TvPlaybackData | null>(null);
  const [queuePreview, setQueuePreview] = useState<TvQueuePreviewItem[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<any>(null);

  // 1. Fetch or Refresh Pairing Code
  const fetchPairingCode = useCallback(async (forceNew = false) => {
    setLoading(true);
    setError(null);
    try {
      const storedToken = forceNew ? null : localStorage.getItem('allyoutuber_tv_token');
      const res = await fetch('/api/tv/pair/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: storedToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get TV code');

      if (data.session?.token) {
        localStorage.setItem('allyoutuber_tv_token', data.session.token);
        setSessionToken(data.session.token);
      }
      if (data.session?.deviceName) {
        setDeviceName(data.session.deviceName);
      }

      if (data.isPaired && data.session?.roomId) {
        setIsPaired(true);
        setRoomId(data.session.roomId);
        setRoomSlug(data.session.roomSlug || '');
        setRoomName(data.session.roomName || 'Room');
      } else {
        setIsPaired(false);
        setPairingCode(data.pairingCode);
        setExpiresAt(data.expiresAt);
      }
    } catch (err: any) {
      console.error('Pairing fetch error:', err);
      setError(err.message || 'Hiba a párosítási kód lekérésekor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPairingCode();
  }, [fetchPairingCode]);

  // 2. Setup Socket.IO for TV
  useEffect(() => {
    if (!sessionToken) return;

    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      setIsConnected(true);
      socket.emit('tv:init', { token: sessionToken });
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // TV Pairing Signal
    socket.on('tv:paired', (data: any) => {
      setIsPaired(true);
      if (data.roomId) setRoomId(data.roomId);
      if (data.roomSlug) setRoomSlug(data.roomSlug);
      if (data.roomName) setRoomName(data.roomName);
      if (data.deviceName) setDeviceName(data.deviceName);
    });

    socket.on('tv:waiting', (data: any) => {
      setIsPaired(false);
      if (data.deviceName) setDeviceName(data.deviceName);
    });

    // TV Queue Preview update
    socket.on('tv:queue_preview', (preview: TvQueuePreviewItem[]) => {
      setQueuePreview(preview || []);
    });

    // Room State Update
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

    // TV Disconnected signal from phone/desktop
    socket.on('tv:disconnected', () => {
      setIsPaired(false);
      fetchPairingCode(true);
    });

    if (socket.connected) {
      onConnect();
    }

    // 30s Heartbeat
    const heartbeatTimer = setInterval(() => {
      if (socket.connected) {
        socket.emit('tv:heartbeat', { token: sessionToken });
      }
    }, 30000);

    return () => {
      clearInterval(heartbeatTimer);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('tv:paired');
      socket.off('tv:waiting');
      socket.off('tv:queue_preview');
      socket.off('room:state_update');
      socket.off('tv:disconnected');
    };
  }, [sessionToken, fetchPairingCode]);

  // Request sync helper
  const handleRequestSync = useCallback(() => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('tv:sync_request', { roomId });
    }
  }, [roomId]);

  if (!isPaired) {
    return (
      <TvPairingScreen
        pairingCode={pairingCode}
        expiresAt={expiresAt}
        deviceName={deviceName}
        loading={loading}
        error={error}
        onRefreshCode={() => fetchPairingCode(true)}
      />
    );
  }

  return (
    <TvPlayer
      roomId={roomId}
      roomName={roomName}
      roomSlug={roomSlug}
      playback={playback}
      queuePreview={queuePreview}
      onlineCount={onlineCount}
      isConnected={isConnected}
      debugMode={debugMode}
      onRequestSync={handleRequestSync}
      onDisconnect={() => {
        setIsPaired(false);
        fetchPairingCode(true);
      }}
    />
  );
}

export default function TvPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen w-screen bg-black" />}>
      <TvPageContent />
    </React.Suspense>
  );
}
