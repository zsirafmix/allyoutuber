'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import Link from 'next/link';
import {
  Shield,
  KeyRound,
  Radio,
  Users,
  ScrollText,
  Lock,
  Globe,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function AdminPage() {
  const { t } = useLanguage();
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<{
    rooms: any[];
    usersCount: number;
    recentLogs: any[];
  } | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('allyoutuber_token');
    const userStr = localStorage.getItem('allyoutuber_user');
    if (token) setSessionToken(token);
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setCurrentUser(u);
        if (u.isGlobalAdmin) setIsAdmin(true);
      } catch {}
    }
  }, []);

  const loadAdminData = async () => {
    try {
      const token = localStorage.getItem('allyoutuber_token');
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [sessionToken]);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bootstrapToken.trim() || !sessionToken) return;

    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bootstrapToken: bootstrapToken.trim(),
          sessionToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Hibás admin kulcs.');
      }

      setMessage(data.message || 'Sikeres globális admin azonosítás!');
      setIsAdmin(true);
      loadAdminData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t('admin.panelTitle')}</h1>
              <p className="text-xs text-slate-400">AllYouTuber Global Administration & Audit Hub</p>
            </div>
          </div>
        </div>
      </div>

      {!isAdmin ? (
        /* Bootstrap Unlock Form */
        <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
              <KeyRound size={28} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Admin Azonosítás</h2>
              <p className="text-xs text-slate-400">Add meg a szerver ADMIN_BOOTSTRAP_TOKEN kulcsát!</p>
            </div>
          </div>

          {!sessionToken && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>Kérlek, először a főoldalon válassz egy nicknevet a szoba belépésnél!</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleBootstrap} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Bootstrap Token
              </label>
              <input
                type="password"
                required
                value={bootstrapToken}
                onChange={(e) => setBootstrapToken(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={!sessionToken || !bootstrapToken.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-sm shadow-xl shadow-amber-600/30 transition disabled:opacity-40"
            >
              Belépés Rendszergazdaként
            </button>
          </form>
        </div>
      ) : (
        /* Full Admin Dashboard */
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold">{t('admin.roomsCount')}</p>
                <h3 className="text-2xl font-black text-white mt-1">{stats?.rooms?.length || 0}</h3>
              </div>
              <div className="p-3 rounded-xl bg-violet-600/20 text-violet-400">
                <Radio size={24} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold">{t('admin.activeUsers')}</p>
                <h3 className="text-2xl font-black text-white mt-1">{stats?.usersCount || 0}</h3>
              </div>
              <div className="p-3 rounded-xl bg-cyan-600/20 text-cyan-400">
                <Users size={24} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold">Audit Események</p>
                <h3 className="text-2xl font-black text-white mt-1">{stats?.recentLogs?.length || 0}</h3>
              </div>
              <div className="p-3 rounded-xl bg-amber-600/20 text-amber-400">
                <ScrollText size={24} />
              </div>
            </div>
          </div>

          {/* Rooms Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Radio size={18} className="text-violet-400" />
              <span>Kezelt Szobák</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Szoba név</th>
                    <th className="py-2.5 px-3">Slug</th>
                    <th className="py-2.5 px-3">Típus</th>
                    <th className="py-2.5 px-3">Helyek</th>
                    <th className="py-2.5 px-3">DJ Mód</th>
                    <th className="py-2.5 px-3">Queue Mód</th>
                    <th className="py-2.5 px-3 text-right">Művelet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats?.rooms?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-white">{r.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">/room/{r.slug}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-semibold">
                          {r.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{r.settings?.slotCount || 10}</td>
                      <td className="py-2.5 px-3 font-semibold text-cyan-400">{r.settings?.djMode || 'AUTO'}</td>
                      <td className="py-2.5 px-3 font-semibold text-violet-400">{r.settings?.queueMode || 'FIFO'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          href={`/room/${r.slug}`}
                          className="px-2.5 py-1 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 font-semibold"
                        >
                          Belépés
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ScrollText size={18} className="text-amber-400" />
              <span>{t('admin.auditLog')}</span>
            </h2>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">{t('admin.timestamp')}</th>
                    <th className="py-2.5 px-3">Felhasználó</th>
                    <th className="py-2.5 px-3">{t('admin.action')}</th>
                    <th className="py-2.5 px-3">{t('admin.details')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats?.recentLogs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 font-bold text-white">
                        {log.userNick || log.userId || 'System'}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-400 truncate max-w-xs" title={log.details}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
