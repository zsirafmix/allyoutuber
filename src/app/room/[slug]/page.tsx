'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import { getSocket } from '@/lib/socketClient';
import { formatDuration } from '@/lib/youtube';
import YouTubePlayer from '@/components/YouTubePlayer';
import FloatingReactions from '@/components/FloatingReactions';
import SlotsGrid from '@/components/SlotsGrid';
import VideoQueue, { QueueItemData } from '@/components/VideoQueue';
import RoomChat, { ChatMessageData } from '@/components/RoomChat';
import RoomAudience, { Participant } from '@/components/RoomAudience';
import ModeratorDrawer from '@/components/ModeratorDrawer';
import NicknameModal from '@/components/NicknameModal';
import { getDJStyle } from '@/lib/djStyles';
import { Role, RoomType, VideoSource, DJMode, QueueMode } from '@prisma/client';
import {
  ShieldAlert,
  Globe,
  Lock,
  Music,
  Users,
  Copy,
  Check,
  Disc,
  ArrowLeft,
  Volume2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function RoomPage() {
  const { t } = useLanguage();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const slug = params?.slug as string;
  const inviteParam = searchParams?.get('invite') || undefined;

  // Session & User
  const [currentUser, setCurrentUser] = useState<{ id: string; nickname: string; isGlobalAdmin: boolean } | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Room state from server
  const [roomData, setRoomData] = useState<{
    id: string;
    slug: string;
    name: string;
    type: RoomType;
    isLocked: boolean;
  } | null>(null);

  const [settings, setSettings] = useState<{
    slotCount: number;
    djMode: DJMode;
    queueMode: QueueMode;
    maxConsecutiveVideosPerUser: number;
    maxQueuedVideosPerUser: number;
    maxVideoDurationMinutes: number;
    djStyle?: string;
  }>({
    slotCount: 10,
    djMode: DJMode.AUTO,
    queueMode: QueueMode.FIFO,
    maxConsecutiveVideosPerUser: 2,
    maxQueuedVideosPerUser: 5,
    maxVideoDurationMinutes: 15,
    djStyle: 'MIXED_PARTY',
  });

  const [playback, setPlayback] = useState<{
    videoId: string | null;
    title: string | null;
    duration: number;
    thumbnailUrl: string | null;
    submittedBy: string | null;
    source: VideoSource;
    startedAt: string | null;
    paused: boolean;
    currentPosition: number;
    serverTime: number;
  }>({
    videoId: null,
    title: null,
    duration: 0,
    thumbnailUrl: null,
    submittedBy: null,
    source: VideoSource.USER,
    startedAt: null,
    paused: false,
    currentPosition: 0,
    serverTime: Date.now(),
  });

  const [queue, setQueue] = useState<QueueItemData[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageData[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [onlineUsers, setOnlineUsers] = useState<Participant[]>([]);
  const [whisperRecipientId, setWhisperRecipientId] = useState<string | null>(null);

  // Modals & UI states
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [showModDrawer, setShowModDrawer] = useState(false);
  const [showNickModal, setShowNickModal] = useState(false);
  const [targetClaimSlot, setTargetClaimSlot] = useState<number | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Load and verify persistent session
  const loadSession = useCallback(async () => {
    let token = localStorage.getItem('allyoutuber_token');
    const userStr = localStorage.getItem('allyoutuber_user');
    if (token && userStr) {
      try {
        setSessionToken(token);
        setCurrentUser(JSON.parse(userStr));
      } catch {}
    }

    try {
      const res = await fetch('/api/session', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.session) {
        setSessionToken(data.session.sessionToken);
        const u = {
          id: data.session.userId,
          nickname: data.session.nickname,
          isGlobalAdmin: data.session.isGlobalAdmin,
        };
        setCurrentUser(u);
        localStorage.setItem('allyoutuber_token', data.session.sessionToken);
        localStorage.setItem('allyoutuber_user', JSON.stringify(u));
        localStorage.setItem('allyoutuber_saved_nick', data.session.nickname);
      }
    } catch (e) {
      console.error('Session sync error:', e);
    }
  }, []);

  useEffect(() => {
    loadSession();
    const handleSessionUpdated = () => {
      loadSession();
      if (roomData?.id) {
        const token = localStorage.getItem('allyoutuber_token');
        const socket = getSocket();
        socket.emit('room:join', {
          roomId: roomData.id,
          sessionToken: token || undefined,
          inviteCode: inviteParam,
        });
      }
    };
    window.addEventListener('allyoutuber:session_updated', handleSessionUpdated);
    return () => window.removeEventListener('allyoutuber:session_updated', handleSessionUpdated);
  }, [loadSession, roomData?.id, inviteParam]);

  // Fetch initial room data from API
  useEffect(() => {
    async function loadRoom() {
      try {
        const url = `/api/rooms/${slug}${inviteParam ? `?invite=${inviteParam}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to enter room.');
        }

        setRoomData(data.room);
        if (data.room.settings) setSettings(data.room.settings);
        if (data.room.playbackState) {
          setPlayback((prev) => ({
            ...prev,
            videoId: data.room.playbackState.currentVideoId,
            title: data.room.playbackState.currentTitle,
            duration: data.room.playbackState.currentDuration || 0,
            thumbnailUrl: data.room.playbackState.currentThumbnail,
            submittedBy: data.room.playbackState.currentSubmittedBy,
            source: data.room.playbackState.currentSource || VideoSource.USER,
            paused: data.room.playbackState.paused || false,
          }));
        }
      } catch (err: any) {
        setAccessError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadRoom();
  }, [slug, inviteParam]);

  // Socket.IO event setup
  useEffect(() => {
    if (!roomData?.id) return;

    const socket = getSocket();

    // 1. Join room event
    socket.emit('room:join', {
      roomId: roomData.id,
      sessionToken: sessionToken || undefined,
      inviteCode: inviteParam,
    });

    // 2. Room State Updates
    const handleStateUpdate = (data: any) => {
      if (data.room) setRoomData((prev) => ({ ...prev, ...data.room }));
      if (data.settings) setSettings(data.settings);
      if (data.playback) setPlayback(data.playback);
      if (data.queue) setQueue(data.queue);
      if (data.members) setMembers(data.members);
      if (data.onlineCount !== undefined) setOnlineCount(data.onlineCount);
      if (data.onlineUsers !== undefined) setOnlineUsers(data.onlineUsers);
    };

    const handleCountChanged = ({ onlineCount: count }: { onlineCount: number }) => {
      if (typeof count === 'number') {
        setOnlineCount(count);
      }
    };

    // 3. Chat History & Messages
    const handleChatHistory = (history: ChatMessageData[]) => {
      setChatMessages(history);
    };

    const handleChatMessage = (msg: ChatMessageData) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    const handleChatDeleted = ({ messageId }: { messageId: string }) => {
      setChatMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deletedAt: new Date() } : m))
      );
    };

    const handleAccessDenied = ({ reason }: { reason: string }) => {
      setAccessError(reason);
    };

    socket.on('room:state_update', handleStateUpdate);
    socket.on('room:user_count_changed', handleCountChanged);
    socket.on('chat:history', handleChatHistory);
    socket.on('chat:message', handleChatMessage);
    socket.on('chat:deleted', handleChatDeleted);
    socket.on('room:access_denied', handleAccessDenied);

    return () => {
      socket.emit('room:leave', { roomId: roomData.id });
      socket.off('room:state_update', handleStateUpdate);
      socket.off('room:user_count_changed', handleCountChanged);
      socket.off('chat:history', handleChatHistory);
      socket.off('chat:message', handleChatMessage);
      socket.off('chat:deleted', handleChatDeleted);
      socket.off('room:access_denied', handleAccessDenied);
    };
  }, [roomData?.id, sessionToken, inviteParam]);

  // Determine current user's membership and role in this room
  const currentMember = members.find((m) => m.userId === currentUser?.id);
  const currentUserRole = currentMember?.role || (currentUser?.isGlobalAdmin ? Role.ADMIN : null);

  // Claim Seat / Slot
  const handleClaimSlot = (slotNum: number) => {
    if (!sessionToken || !currentUser) {
      setTargetClaimSlot(slotNum);
      setShowNickModal(true);
      return;
    }

    if (!roomData?.id) return;
    const socket = getSocket();
    socket.emit('room:claim_slot', {
      roomId: roomData.id,
      slotIndex: slotNum,
      sessionToken,
    });
  };

  const handleNicknameSuccess = (session: { sessionToken: string; user: any }) => {
    setSessionToken(session.sessionToken);
    setCurrentUser(session.user);
    if (targetClaimSlot && roomData?.id) {
      const socket = getSocket();
      socket.emit('room:claim_slot', {
        roomId: roomData.id,
        slotIndex: targetClaimSlot,
        sessionToken: session.sessionToken,
      });
      setTargetClaimSlot(null);
    }
  };

  // Add Video
  const handleAddVideo = async (url: string) => {
    if (!roomData?.id) return;
    if (!sessionToken) {
      throw new Error(t('errors.notInSlot'));
    }

    const socket = getSocket();
    socket.emit('queue:add', {
      roomId: roomData.id,
      videoUrl: url,
      sessionToken,
    });
  };

  // Vote on queue item
  const handleVote = (queueItemId: string, value: 1 | -1) => {
    if (!roomData?.id || !sessionToken) return;
    const socket = getSocket();
    socket.emit('queue:vote', {
      roomId: roomData.id,
      queueItemId,
      value,
      sessionToken,
    });
  };

  // Remove queue item
  const handleRemoveQueueItem = (queueItemId: string) => {
    if (!roomData?.id || !sessionToken) return;
    const socket = getSocket();
    socket.emit('queue:remove', {
      roomId: roomData.id,
      queueItemId,
      sessionToken,
    });
  };

  // Reorder queue item
  const handleReorderQueue = (queueItemId: string, targetPos: number) => {
    if (!roomData?.id || !sessionToken) return;
    const socket = getSocket();
    socket.emit('queue:reorder', {
      roomId: roomData.id,
      queueItemId,
      targetPosition: targetPos,
      sessionToken,
    });
  };

  // Send Chat message (Public or Private Whisper)
  const handleSendMessage = (msg: string, recipientUserId?: string) => {
    if (!roomData?.id) return;
    if (!sessionToken) {
      setTargetClaimSlot(null);
      setShowNickModal(true);
      return;
    }
    const socket = getSocket();
    socket.emit('chat:send', {
      roomId: roomData.id,
      message: msg,
      sessionToken,
      recipientUserId,
    });
  };

  // Delete Chat message (mod)
  const handleDeleteMessage = (messageId: string) => {
    if (!roomData?.id || !sessionToken) return;
    const socket = getSocket();
    socket.emit('chat:delete', {
      roomId: roomData.id,
      messageId,
      sessionToken,
    });
  };

  // Mod Skip
  const handleSkipVideo = () => {
    if (!roomData?.id || !sessionToken) return;
    const socket = getSocket();
    socket.emit('mod:skip', {
      roomId: roomData.id,
      sessionToken,
    });
  };

  // Mod Set Role (Admin only)
  const handleSetRole = (targetUserId: string, newRole: Role) => {
    if (!roomData?.id || !sessionToken) return;
    const socket = getSocket();
    socket.emit('mod:set_role', {
      roomId: roomData.id,
      targetUserId,
      newRole,
      sessionToken,
    });
  };

  // Mod Kick Member from Slot
  const handleKickMember = (targetUserId: string) => {
    if (!roomData?.id || !sessionToken) return;
    const socket = getSocket();
    socket.emit('mod:kick', {
      roomId: roomData.id,
      targetUserId,
      sessionToken,
    });
  };

  // Mod Mute / Unmute Member
  const handleMuteMember = (targetUserId: string, isMuted: boolean) => {
    if (!roomData?.id || !sessionToken) return;
    const socket = getSocket();
    socket.emit('mod:mute', {
      roomId: roomData.id,
      targetUserId,
      isMuted,
      sessionToken,
    });
  };

  // Mod / Admin Change DJ Style
  const handleSetDJStyle = (djStyle: string) => {
    if (!roomData?.id || !sessionToken) return;
    const socket = getSocket();
    socket.emit('mod:set_dj_style', {
      roomId: roomData.id,
      djStyle,
      sessionToken,
    });
  };

  // Admin Delete Room
  const handleDeleteRoom = async () => {
    if (!roomData?.slug) return;
    try {
      const res = await fetch(`/api/rooms/${roomData.slug}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete room.');
      router.push('/');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Mod Regenerate Invite
  const handleRegenerateInvite = async (): Promise<string> => {
    const res = await fetch(`/api/rooms/${slug}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to regenerate invite.');
    return data.inviteCode;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Disc size={48} className="text-violet-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-400">{t('room.entering')}</p>
      </div>
    );
  }

  if (accessError || !roomData) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
        <div className="p-4 rounded-full bg-rose-500/20 text-rose-400 w-16 h-16 mx-auto flex items-center justify-center mb-4">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{t('room.accessDenied')}</h2>
        <p className="text-sm text-slate-400 mb-6">{accessError || t('room.accessDenied')}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition"
        >
          <ArrowLeft size={16} /> {t('room.backToRooms')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Room Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-xl">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white">{roomData.name}</h1>
              {roomData.type === RoomType.PRIVATE ? (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Lock size={10} /> {t('room.privateBadge')}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Globe size={10} /> {t('room.publicBadge')}
                </span>
              )}
              {settings?.djStyle && (() => {
                const style = getDJStyle(settings.djStyle);
                const translatedName = t(`djStyles.${style.id}.name`);
                const translatedDesc = t(`djStyles.${style.id}.desc`);
                const name = translatedName.startsWith('djStyles.') ? style.name : translatedName;
                const desc = translatedDesc.startsWith('djStyles.') ? style.description : translatedDesc;
                return (
                  <span
                    className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${style.badgeBg} ${style.badgeText} border ${style.badgeBorder}`}
                    title={`${t('djStyles.title')}: ${name} (${desc})`}
                  >
                    <span>{style.emoji}</span>
                    <span>{name}</span>
                  </span>
                );
              })()}
              <span
                className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-950/20"
                title={t('room.onlineUsersTooltip')}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Users size={11} className="text-emerald-400" />
                <span>{t('room.onlineCount', { count: onlineCount })}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">/room/{roomData.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Share / Copy link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
            title={t('room.copyInvite')}
          >
            {inviteCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span className="hidden sm:inline">{inviteCopied ? t('room.copied') : t('room.copyInvite')}</span>
          </button>

          {/* Moderation Controls Drawer Toggle */}
          {(currentUserRole === Role.MODERATOR || currentUserRole === Role.ADMIN) && (
            <button
              onClick={() => setShowModDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/50 text-xs font-bold text-violet-200 transition"
            >
              <ShieldAlert size={15} />
              <span>{t('mod.title')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Desktop 7 cols / Mobile Full) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* 2. YouTube Video Player (16:9) */}
          <div className="relative">
            <YouTubePlayer
              videoId={playback.videoId}
              currentPosition={playback.currentPosition}
              paused={playback.paused}
              serverTime={playback.serverTime}
              onEnded={() => {
                // Video ended natively, server clock will handle pop or client can ping
              }}
            />
          </div>

          {/* 3. NOW PLAYING (MOST JÁTSZIK) Info Card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Music size={14} /> {t('room.nowPlayingTitle')}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {formatDuration(playback.duration)}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white truncate" title={playback.title || '—'}>
              {playback.title || t('room.emptyQueue')}
            </h3>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-400 font-medium">
                {t('queue.submittedBy')}: <strong className="text-slate-200">{playback.submittedBy || 'System'}</strong>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  playback.source === VideoSource.DJ
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : playback.source === VideoSource.ADMIN
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {playback.source === VideoSource.DJ ? '🤖 DJ' : playback.source}
              </span>
            </div>
          </div>

          {/* 4. Floating Emoji Reactions Toolbar */}
          <FloatingReactions roomId={roomData.id} />

          {/* 5. Add Video to Queue & Queue List */}
          <VideoQueue
            queue={queue}
            currentUserId={currentUser?.id}
            currentUserRole={currentUserRole}
            isSeated={Boolean(currentMember?.slotIndex !== null && currentMember?.slotIndex !== undefined)}
            userSlotIndex={currentMember?.slotIndex ?? null}
            onAddVideo={handleAddVideo}
            onVote={handleVote}
            onRemove={handleRemoveQueueItem}
            onReorder={handleReorderQueue}
          />
        </div>

        {/* Right Column (Desktop 5 cols / Mobile Below) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* 6. Numbered User Seats (1..10) */}
          <SlotsGrid
            slotCount={settings.slotCount || 10}
            members={members}
            currentUserId={currentUser?.id}
            onClaimSlot={handleClaimSlot}
          />

          {/* 6b. Room Audience & Active Participants List */}
          <RoomAudience
            onlineCount={onlineCount}
            participants={
              onlineUsers.length > 0
                ? onlineUsers
                : members.map((m) => ({
                    userId: m.userId,
                    nickname: m.nickname,
                    role: m.role,
                    slotIndex: m.slotIndex,
                    isOnline: m.isOnline !== false,
                  }))
            }
            currentUserId={currentUser?.id}
            onSelectWhisper={(userId) => setWhisperRecipientId(userId)}
          />

          {/* 7. Live Room Chat */}
          <RoomChat
            messages={chatMessages}
            currentUserRole={currentUserRole}
            currentUserId={currentUser?.id}
            members={onlineUsers.length > 0 ? onlineUsers : members}
            selectedRecipientId={whisperRecipientId}
            onSelectRecipient={setWhisperRecipientId}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
          />
        </div>
      </div>

      {/* Nickname selection modal */}
      <NicknameModal
        isOpen={showNickModal}
        targetSlot={targetClaimSlot}
        occupiedNicks={members.map((m) => m.nickname)}
        onClose={() => {
          setShowNickModal(false);
          setTargetClaimSlot(null);
        }}
        onSuccess={handleNicknameSuccess}
      />

      {/* Moderator Drawer */}
      <ModeratorDrawer
        isOpen={showModDrawer}
        onClose={() => setShowModDrawer(false)}
        room={roomData}
        settings={settings}
        members={members}
        currentUserId={currentUser?.id}
        currentUserRole={currentUserRole}
        onSkipVideo={handleSkipVideo}
        onRegenerateInvite={handleRegenerateInvite}
        onSetDJStyle={handleSetDJStyle}
        onSetRole={handleSetRole}
        onKickMember={handleKickMember}
        onMuteMember={handleMuteMember}
        onDeleteRoom={handleDeleteRoom}
      />
    </div>
  );
}
