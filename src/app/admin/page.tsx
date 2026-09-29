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
  UserCheck,
  LogOut,
  Sparkles,
  Trash2,
} from 'lucide-react';

export default function AdminPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Form states
  const [nickname, setNickname] = useState('Zsiraf');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingRoomSlug, setDeletingRoomSlug] = useState<string | null>(null);

  // Admin nickname edit state
  const [adminNewNick, setAdminNewNick] = useState('');
  const [renamingAdmin, setRenamingAdmin] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameSuccess, setRenameSuccess] = useState<string | null>(null);

  // Dashboard metrics
  const [stats, setStats] = useState<{
    rooms: any[];
    usersCount: number;
    users?: any[];
    recentLogs: any[];
  } | null>(null);

  const handleDeleteRoom = async (slug: string, name: string) => {
    if (!window.confirm(`Biztosan törölni szeretnéd a(z) "${name}" (/room/${slug}) szobát? A szoba és annak minden adata (várólista, csevegés) törlődik!`)) {
      return;
    }

    setDeletingRoomSlug(slug);
    try {
      const token = localStorage.getItem('allyoutuber_token');
      const res = await fetch(`/api/rooms/${slug}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'A szoba törlése sikertelen.');
      }
      alert('Szoba sikeresen törölve.');
      await loadDashboard();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingRoomSlug(null);
    }
  };

  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const handleToggleGlobalAdmin = async (userId: string, targetNick: string, makeAdmin: boolean) => {
    const actionText = makeAdmin
      ? `főadminisztrátorrá szeretnéd tenni "${targetNick}" felhasználót`
      : `vissza szeretnéd vonni "${targetNick}" főadminisztrátori jogát`;
    if (!window.confirm(`Biztosan ${actionText}?`)) {
      return;
    }

    setUpdatingUserId(userId);
    try {
      const token = localStorage.getItem('allyoutuber_token');
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isGlobalAdmin: makeAdmin }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'A művelet sikertelen.');
      }
      alert(data.message || 'Sikeres módosítás.');
      await loadDashboard();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      setInitialized(data.initialized);
      setAdminUsername(data.username || null);
      setIsAuthenticated(data.isAuthenticated);
      if (data.user) {
        setAdminUser(data.user);
        setAdminNewNick(data.user.nickname);
      } else if (data.username) {
        setAdminNewNick(data.username);
      }

      if (data.isAuthenticated) {
        await loadDashboard();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRename = async (e: React.FormEvent) => {
    e.preventDefault();
    setRenameError(null);
    setRenameSuccess(null);

    const trimmed = adminNewNick.trim();
    if (trimmed.length < 2 || trimmed.length > 24) {
      setRenameError('A nicknévnek 2 és 24 karakter között kell lennie.');
      return;
    }

    setRenamingAdmin(true);
    try {
      const token = localStorage.getItem('allyoutuber_token');
      const res = await fetch('/api/session', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ nickname: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'A nicknév módosítása sikertelen.');
      }

      setAdminUsername(data.user.nickname);
      setAdminUser(data.user);
      localStorage.setItem('allyoutuber_saved_nick', data.user.nickname);
      localStorage.setItem('allyoutuber_user', JSON.stringify(data.user));
      window.dispatchEvent(new CustomEvent('allyoutuber:session_updated', { detail: data }));

      setRenameSuccess(`Admin nickneved sikeresen módosítva: "${data.user.nickname}"!`);
      await loadDashboard();
    } catch (err: any) {
      setRenameError(err.message);
    } finally {
      setRenamingAdmin(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const res = await fetch('/api/admin/overview');
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 1. Initial Setup Handler
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 4) {
      setError('A jelszó legalább 4 karakter hosszú legyen.');
      return;
    }
    if (password !== confirmPassword) {
      setError('A két beírt jelszó nem egyezik meg!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setup',
          nickname: nickname.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Hiba történt az admin beállításakor.');
      }

      setSuccessMsg('Örök admin fiók sikeresen létrehozva!');
      await checkAuthStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginPassword) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Hibás jelszó.');
      }

      setSuccessMsg('Sikeres bejelentkezés!');
      await checkAuthStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    document.cookie = 'allyoutuber_token=; Max-Age=0; path=/;';
    localStorage.removeItem('allyoutuber_token');
    setIsAuthenticated(false);
    setAdminUser(null);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-slate-400">
        Adminisztrációs állapot ellenőrzése...
      </div>
    );
  }

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
              <p className="text-xs text-slate-400">AllYouTuber Örök Rendszergazda Hub</p>
            </div>
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-amber-400 font-bold flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              <UserCheck size={14} /> {adminUser?.nickname || adminUsername} (Admin)
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Kijelentkezés"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Screen 1: FIRST-TIME SETUP (Örök admin jelszó beállítása legelső alkalommal) */}
      {!initialized && (
        <div className="max-w-md mx-auto my-8 p-8 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles size={26} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Örök Admin Beállítása</h2>
              <p className="text-xs text-amber-400/90 font-medium">Első indítás érzékelve</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Még nem létezik rendszergazda fiók. Állítsd be most az <b>örök admin jelszavadat</b> és nicknevedet, amellyel bármikor teljes hozzáférésed lesz az oldalhoz!
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Nicknév
              </label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="pl. Zsiraf"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Jelszó
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Válassz egy biztonságos jelszót..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Jelszó Megerősítése
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Írd be újra a jelszót..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-sm shadow-xl shadow-amber-600/30 transition disabled:opacity-50"
            >
              {submitting ? 'Mentés folyamatban...' : 'Örök Admin Fiók Létrehozása'}
            </button>
          </form>
        </div>
      )}

      {/* Screen 2: LOGIN (Ha már be van állítva a jelszó, de nincs bejelentkezve) */}
      {initialized && !isAuthenticated && (
        <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
              <KeyRound size={28} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Örök Admin Belépés</h2>
              <p className="text-xs text-slate-400">
                Fiók: <strong className="text-amber-400">{adminUsername || 'Admin'}</strong>
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Jelszó
              </label>
              <input
                type="password"
                required
                autoFocus
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !loginPassword}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-sm shadow-xl shadow-amber-600/30 transition disabled:opacity-50"
            >
              {submitting ? 'Ellenőrzés...' : 'Bejelentkezés Rendszergazdaként'}
            </button>
          </form>
        </div>
      )}

      {/* Screen 3: DASHBOARD (Bejelentkezett admin) */}
      {isAuthenticated && (
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

          {/* Admin Profile & Nickname Management */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Shield size={24} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Rendszergazdai Profil & Saját Nicknév Módosítása</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      FŐADMIN
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Jelenlegi bejelentkezett admin: <strong className="text-amber-400">{adminUser?.nickname || adminUsername}</strong>
                  </p>
                </div>
              </div>
            </div>

            {renameError && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs">
                {renameError}
              </div>
            )}

            {renameSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                <span>{renameSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAdminRename} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="flex-1">
                <input
                  type="text"
                  value={adminNewNick}
                  onChange={(e) => setAdminNewNick(e.target.value)}
                  placeholder="Új admin nicknév..."
                  maxLength={24}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
                  disabled={renamingAdmin}
                />
              </div>
              <button
                type="submit"
                disabled={renamingAdmin || !adminNewNick.trim() || adminNewNick.trim() === (adminUser?.nickname || adminUsername)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition disabled:opacity-50 whitespace-nowrap"
              >
                {renamingAdmin ? 'Mentés...' : 'Nicknév Frissítése'}
              </button>
            </form>
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
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/room/${r.slug}`}
                            className="px-2.5 py-1 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 font-semibold"
                          >
                            Belépés
                          </Link>
                          <button
                            onClick={() => handleDeleteRoom(r.slug, r.name)}
                            disabled={deletingRoomSlug === r.slug}
                            className="px-2 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-semibold flex items-center gap-1 transition disabled:opacity-50"
                            title="Szoba törlése"
                          >
                            <Trash2 size={12} />
                            <span>Törlés</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Occupied Nicknames & Users Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-cyan-400" />
                <span>Foglalt Nicknevek és Felhasználók ({stats?.users?.length || 0})</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                Összesen {stats?.usersCount || 0} regisztrált felhasználó a rendszerben
              </span>
            </div>

            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Foglalt Nicknév</th>
                    <th className="py-2.5 px-3">Jogosultság</th>
                    <th className="py-2.5 px-3">Létrehozva</th>
                    <th className="py-2.5 px-3">Utolsó aktivitás</th>
                    <th className="py-2.5 px-3">Felhasználó ID</th>
                    <th className="py-2.5 px-3 text-right">Művelet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats?.users && stats.users.length > 0 ? (
                    stats.users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-bold text-cyan-300 flex items-center gap-2">
                          <span>{u.nickname}</span>
                          {u.isGlobalAdmin && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30">
                              FŐADMIN
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              u.isGlobalAdmin
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {u.isGlobalAdmin ? 'Örök Admin' : 'Felhasználó'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">
                          {new Date(u.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">
                          {new Date(u.updatedAt).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500 text-[10px]">
                          {u.id}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {u.id !== adminUser?.id ? (
                            <button
                              onClick={() => handleToggleGlobalAdmin(u.id, u.nickname, !u.isGlobalAdmin)}
                              disabled={updatingUserId === u.id}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition disabled:opacity-50 ${
                                u.isGlobalAdmin
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                                  : 'bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40'
                              }`}
                              title={u.isGlobalAdmin ? 'Főadmin rang visszavonása' : 'Kinevezés Főadminisztrátornak'}
                            >
                              {u.isGlobalAdmin ? '- Főadmin jog' : '+ Legyen Főadmin'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-amber-400/60 font-semibold italic">Jelenlegi fiók</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-500 italic">
                        Még nincs megjeleníthető felhasználó.
                      </td>
                    </tr>
                  )}
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
