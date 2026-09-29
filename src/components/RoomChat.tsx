'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Role } from '@prisma/client';
import { Send, Trash2, MessageSquare, Lock, X } from 'lucide-react';

export interface ChatMessageData {
  id: string;
  senderNick: string;
  senderRole: Role;
  message: string;
  isSystem: boolean;
  isPrivate?: boolean;
  recipientId?: string | null;
  recipientNick?: string | null;
  userId?: string | null;
  createdAt: string | Date;
  deletedAt?: string | Date | null;
}

interface RoomChatProps {
  messages: ChatMessageData[];
  currentUserRole?: Role | null;
  currentUserId?: string | null;
  members?: Array<{ id: string; userId: string; nickname: string; role: Role }>;
  onSendMessage: (msg: string, recipientUserId?: string) => void;
  onDeleteMessage?: (msgId: string) => void;
}

export default function RoomChat({
  messages,
  currentUserRole,
  currentUserId,
  members = [],
  onSendMessage,
  onDeleteMessage,
}: RoomChatProps) {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isModOrAdmin = currentUserRole === Role.MODERATOR || currentUserRole === Role.ADMIN;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const selectedRecipient = members.find((m) => m.userId === selectedRecipientId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(trimmed, selectedRecipientId || undefined);
    setText('');
  };

  return (
    <div className="flex flex-col h-[480px] rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-violet-400" />
          <h3 className="text-sm font-bold text-slate-200">{t('chat.title')}</h3>
        </div>
        <div className="flex items-center gap-2">
          {selectedRecipient && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
              <Lock size={10} /> Privát mód
            </span>
          )}
          <span className="text-[11px] text-slate-500 font-mono">
            {messages.filter((m) => !m.deletedAt).length} msgs
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {messages.map((msg) => {
          if (msg.deletedAt) return null;

          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className="py-1 px-3 rounded-lg bg-violet-950/30 border border-violet-800/40 text-center text-xs text-violet-300 font-medium"
              >
                {msg.message}
              </div>
            );
          }

          // Private Whisper Message Render
          if (msg.isPrivate) {
            const isSender = msg.userId === currentUserId;
            return (
              <div
                key={msg.id}
                className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/40 text-xs space-y-1 shadow-md shadow-purple-950/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-purple-300 flex-wrap">
                    <Lock size={11} className="text-purple-400" />
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30">
                      PRIVÁT
                    </span>
                    <span className="text-slate-200">{msg.senderNick}</span>
                    <span className="text-purple-400 text-[10px]">➔</span>
                    <span className="text-purple-200 font-semibold">{msg.recipientNick || 'Neked'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* Quick Reply Button */}
                    <button
                      onClick={() => {
                        const targetId = isSender ? msg.recipientId : msg.userId;
                        if (targetId) setSelectedRecipientId(targetId);
                      }}
                      className="text-[10px] font-bold text-purple-400 hover:text-purple-200 underline"
                      title="Privát válasz"
                    >
                      Válasz
                    </button>

                    {isModOrAdmin && onDeleteMessage && (
                      <button
                        onClick={() => onDeleteMessage(msg.id)}
                        className="text-slate-500 hover:text-rose-400 p-0.5"
                        title={t('chat.deleteMessage')}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-slate-100 break-words leading-relaxed pl-3 border-l-2 border-purple-500/50">
                  {msg.message}
                </div>
              </div>
            );
          }

          const isAdmin = msg.senderRole === Role.ADMIN;
          const isMod = msg.senderRole === Role.MODERATOR;

          return (
            <div key={msg.id} className="flex flex-col group text-xs">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-bold ${
                      isAdmin ? 'text-amber-400' : isMod ? 'text-cyan-400' : 'text-slate-300'
                    }`}
                  >
                    {msg.senderNick}
                  </span>
                  {isAdmin && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      ADMIN
                    </span>
                  )}
                  {isMod && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                      MOD
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {/* Private message shortcut for Admin/Mod or when messaging an Admin */}
                  {msg.userId && msg.userId !== currentUserId && (isModOrAdmin || isAdmin || isMod) && (
                    <button
                      onClick={() => setSelectedRecipientId(msg.userId || null)}
                      className="text-purple-400 hover:text-purple-300 p-0.5"
                      title={`Privát csevegés: ${msg.senderNick}`}
                    >
                      <Lock size={11} />
                    </button>
                  )}

                  {isModOrAdmin && onDeleteMessage && (
                    <button
                      onClick={() => onDeleteMessage(msg.id)}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                      title={t('chat.deleteMessage')}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/50 text-slate-200 break-words leading-relaxed">
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Recipient Selector (Admin/Moderator or responding user) */}
      {(isModOrAdmin || selectedRecipientId) && (
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-800 bg-slate-950/70 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Lock size={11} className={selectedRecipientId ? 'text-purple-400' : 'text-slate-500'} />
              Címzett:
            </span>
            <select
              value={selectedRecipientId || ''}
              onChange={(e) => setSelectedRecipientId(e.target.value || null)}
              className="bg-slate-800 text-slate-200 rounded px-2 py-0.5 border border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">🌐 Mindenki (Nyilvános chat)</option>
              {members
                .filter((m) => m.userId !== currentUserId)
                .map((m) => (
                  <option key={m.userId} value={m.userId}>
                    🔒 Privát: {m.nickname} {m.role === 'ADMIN' ? '(Admin)' : m.role === 'MODERATOR' ? '(Mod)' : ''}
                  </option>
                ))}
            </select>
          </div>

          {selectedRecipientId && (
            <button
              onClick={() => setSelectedRecipientId(null)}
              className="text-purple-400 hover:text-white flex items-center gap-0.5 text-[10px]"
            >
              <X size={10} />
              <span>Visszaállítás</span>
            </button>
          )}
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSend} className="p-2.5 border-t border-slate-800 bg-slate-900/90 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            selectedRecipient
              ? `🔒 Privát üzenet ${selectedRecipient.nickname} számára...`
              : t('chat.placeholder')
          }
          maxLength={500}
          className={`flex-1 px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
            selectedRecipient
              ? 'bg-purple-950/30 border-purple-500/50 text-purple-100 placeholder-purple-400/60 focus:ring-1 focus:ring-purple-500'
              : 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:ring-1 focus:ring-violet-500'
          }`}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className={`p-2.5 rounded-xl active:scale-95 text-white transition disabled:opacity-40 ${
            selectedRecipient
              ? 'bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/30'
              : 'bg-violet-600 hover:bg-violet-500'
          }`}
          title={selectedRecipient ? 'Privát üzenet küldése' : t('chat.send')}
        >
          {selectedRecipient ? <Lock size={14} /> : <Send size={14} />}
        </button>
      </form>
    </div>
  );
}
