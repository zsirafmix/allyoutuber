'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Role } from '@prisma/client';
import { Send, Trash2, MessageSquare, AlertCircle } from 'lucide-react';

export interface ChatMessageData {
  id: string;
  senderNick: string;
  senderRole: Role;
  message: string;
  isSystem: boolean;
  createdAt: string | Date;
  deletedAt?: string | Date | null;
}

interface RoomChatProps {
  messages: ChatMessageData[];
  currentUserRole?: Role | null;
  onSendMessage: (msg: string) => void;
  onDeleteMessage?: (msgId: string) => void;
}

export default function RoomChat({
  messages,
  currentUserRole,
  onSendMessage,
  onDeleteMessage,
}: RoomChatProps) {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isModOrAdmin = currentUserRole === Role.MODERATOR || currentUserRole === Role.ADMIN;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
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
        <span className="text-[11px] text-slate-500 font-mono">
          {messages.filter((m) => !m.deletedAt).length} msgs
        </span>
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

      {/* Input bar */}
      <form onSubmit={handleSend} className="p-2.5 border-t border-slate-800 bg-slate-900/90 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('chat.placeholder')}
          maxLength={500}
          className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white transition disabled:opacity-40"
          title={t('chat.send')}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
