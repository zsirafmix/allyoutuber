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
  MapPin,
  Laptop,
  Smartphone,
  Tablet,
  Search,
  Copy,
  ExternalLink,
  Info,
  Eye,
  Check,
  X,
  Activity,
  Cpu,
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

  // User search & IP filter
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);

  // Quick IP Lookup tool
  const [manualIpQuery, setManualIpQuery] = useState('');
  const [manualIpResult, setManualIpResult] = useState<any | null>(null);
  const [manualIpLoading, setManualIpLoading] = useState(false);
  const [manualIpError, setManualIpError] = useState<string | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handleManualIpLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIpQuery.trim()) return;
    setManualIpLoading(true);
    setManualIpError(null);
    setManualIpResult(null);
    try {
      const token = localStorage.getItem('allyoutuber_token');
      const res = await fetch(`/api/admin/ip-lookup?ip=${encodeURIComponent(manualIpQuery.trim())}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hiba az IP lekérdezésekor.');
      setManualIpResult(data);
    } catch (err: any) {
      setManualIpError(err.message);
    } finally {
      setManualIpLoading(false);
    }
  };

  const filteredUsers = React.useMemo(() => {
    if (!stats?.users) return [];
    if (!userSearchTerm.trim()) return stats.users;
    const term = userSearchTerm.toLowerCase().trim();
    return stats.users.filter((u: any) => {
      const matchNick = u.nickname?.toLowerCase().includes(term);
      const matchId = u.id?.toLowerCase().includes(term);
      const matchIp = u.latestIp?.toLowerCase().includes(term) || u.allIps?.some((ip: string) => ip.toLowerCase().includes(term));
      const matchCity = u.geo?.city?.toLowerCase().includes(term);
      const matchCountry = u.geo?.country?.toLowerCase().includes(term);
      const matchIsp = u.geo?.isp?.toLowerCase().includes(term) || u.geo?.org?.toLowerCase().includes(term);
      const matchDevice = u.device?.os?.toLowerCase().includes(term) || u.device?.browser?.toLowerCase().includes(term);
      return matchNick || matchId || matchIp || matchCity || matchCountry || matchIsp || matchDevice;
    });
  }, [stats?.users, userSearchTerm]);

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
                    <th className="py-2.5 px-3">Jelenlévők</th>
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
                      <td className="py-2.5 px-3">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <span className={`w-1.5 h-1.5 rounded-full ${r.onlineCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                          {r.onlineCount || 0} online
                        </span>
                      </td>
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

          {/* Quick IP Address Lookup Tool */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Globe size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Gyors IP Cím Elemző & Hálózatvizsgáló</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Bármilyen IP cím azonnali geolokációs (GeoIP), internetszolgáltatói (ISP) és hálózati (ASN) lekérdezése
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleManualIpLookup} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  value={manualIpQuery}
                  onChange={(e) => setManualIpQuery(e.target.value)}
                  placeholder="Írj be egy IP címet elemzéshez (pl. 195.228.12.34, 8.8.8.8, vagy belső IP)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={manualIpLoading || !manualIpQuery.trim()}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-1.5"
              >
                {manualIpLoading ? 'Lekérdezés...' : 'IP Elemzése'}
              </button>
            </form>

            {manualIpError && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs">
                {manualIpError}
              </div>
            )}

            {manualIpResult && (
              <div className="p-5 rounded-2xl bg-slate-800/90 border border-emerald-500/40 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{manualIpResult.geo?.flag || '🌐'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white font-mono">{manualIpResult.geo?.ip}</span>
                        <button
                          onClick={() => copyToClipboard(manualIpResult.geo?.ip)}
                          className="text-slate-400 hover:text-white p-1 rounded transition"
                          title="IP cím másolása"
                        >
                          {copiedIp === manualIpResult.geo?.ip ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <p className="text-xs text-emerald-400 font-semibold">
                        {manualIpResult.geo?.city}, {manualIpResult.geo?.region}, {manualIpResult.geo?.country} ({manualIpResult.geo?.countryCode})
                      </p>
                    </div>
                  </div>

                  {manualIpResult.geo?.mapUrl && (
                    <a
                      href={manualIpResult.geo.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
                    >
                      <MapPin size={14} />
                      <span>Google Térkép</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Szolgáltató (ISP)</span>
                    <span className="font-semibold text-slate-200 truncate block" title={manualIpResult.geo?.isp}>
                      {manualIpResult.geo?.isp || '—'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Szervezet (Org / ASN)</span>
                    <span className="font-semibold text-slate-200 truncate block" title={`${manualIpResult.geo?.org} (${manualIpResult.geo?.asn})`}>
                      {manualIpResult.geo?.org || manualIpResult.geo?.asn || '—'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Időzóna</span>
                    <span className="font-semibold text-slate-200 truncate block">
                      {manualIpResult.geo?.timezone || '—'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Irányítószám</span>
                    <span className="font-semibold text-slate-200 truncate block">
                      {manualIpResult.geo?.postal || '—'}
                    </span>
                  </div>
                </div>

                {manualIpResult.matchingUsers && manualIpResult.matchingUsers.length > 0 && (
                  <div className="pt-2 border-t border-slate-700">
                    <span className="text-xs text-slate-400 font-semibold block mb-2">
                      👥 Erről az IP címről eddig bejelentkezett felhasználók ({manualIpResult.matchingUsers.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {manualIpResult.matchingUsers.map((mu: any) => (
                        <span
                          key={mu.id}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5"
                        >
                          <span>{mu.nickname}</span>
                          {mu.isGlobalAdmin && (
                            <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1 rounded font-extrabold">ADMIN</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Occupied Nicknames & Detailed Users Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users size={18} className="text-cyan-400" />
                  <span>Foglalt Nicknevek és Részletes Felhasználói IP Adatok ({filteredUsers.length})</span>
                </h2>
                <span className="text-xs text-slate-400 font-medium">
                  Összesen {stats?.usersCount || 0} regisztrált felhasználó a rendszerben
                </span>
              </div>

              {/* Search Filter */}
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="Keresés név, IP, város, ország, ISP..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[32rem]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] z-10">
                  <tr>
                    <th className="py-2.5 px-3">Felhasználó & Státusz</th>
                    <th className="py-2.5 px-3">🌍 IP Cím & ISP</th>
                    <th className="py-2.5 px-3">📍 Helyadatok (GeoIP)</th>
                    <th className="py-2.5 px-3">💻 Eszköz & Rendszer</th>
                    <th className="py-2.5 px-3">⏱️ Aktivitás</th>
                    <th className="py-2.5 px-3 text-right">Művelet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        {/* 1. Felhasználó */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                u.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                              }`}
                              title={u.isOnline ? 'Jelenleg Online' : 'Offline'}
                            />
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                                <span>{u.nickname}</span>
                                {u.isGlobalAdmin && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30">
                                    FŐADMIN
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                Regisztrálva: {new Date(u.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. IP Cím & ISP */}
                        <td className="py-2.5 px-3">
                          {u.latestIp ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-base" title={u.geo?.country || 'Ország'}>
                                  {u.geo?.flag || '🌐'}
                                </span>
                                <span className="font-mono font-bold text-cyan-300 text-xs">
                                  {u.latestIp}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(u.latestIp)}
                                  className="text-slate-400 hover:text-white p-0.5 rounded transition"
                                  title="IP másolása"
                                >
                                  {copiedIp === u.latestIp ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                </button>
                              </div>
                              <span className="text-[11px] text-slate-400 truncate block max-w-[170px]" title={u.geo?.isp || u.geo?.org}>
                                {u.geo?.isp || u.geo?.org || (u.geo?.isLocal ? 'Helyi hálózat' : '—')}
                              </span>
                              {u.allIps && u.allIps.length > 1 && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-800 text-[9px] text-slate-400 font-mono">
                                  +{u.allIps.length - 1} egyéb IP
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">Nincs rögzített IP</span>
                          )}
                        </td>

                        {/* 3. Helyadatok */}
                        <td className="py-2.5 px-3">
                          {u.geo ? (
                            <div>
                              <span className="font-semibold text-slate-200 block text-xs">
                                {u.geo.city || '—'}, {u.geo.region || ''}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                <span>{u.geo.country}</span>
                                {u.geo.mapUrl && (
                                  <a
                                    href={u.geo.mapUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-400 hover:underline flex items-center gap-0.5 text-[10px]"
                                    title="Térkép megnyitása"
                                  >
                                    <MapPin size={10} />
                                    <span>Térkép</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">Ismeretlen lokáció</span>
                          )}
                        </td>

                        {/* 4. Eszköz & Rendszer */}
                        <td className="py-2.5 px-3">
                          {u.device ? (
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
                                {u.device.device === 'Mobil' ? (
                                  <Smartphone size={14} />
                                ) : u.device.device === 'Tablet' ? (
                                  <Tablet size={14} />
                                ) : (
                                  <Laptop size={14} />
                                )}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-200 block text-xs">
                                  {u.device.os}
                                </span>
                                <span className="text-[11px] text-slate-400 block">
                                  {u.device.browser}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">—</span>
                          )}
                        </td>

                        {/* 5. Aktivitás */}
                        <td className="py-2.5 px-3">
                          {u.isOnline ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                              Épp most aktív
                            </span>
                          ) : (
                            <span className="font-mono text-slate-400 text-[11px] block">
                              {new Date(u.lastSeenAt).toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* 6. Művelet */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedUserDetail(u)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 font-semibold text-[10px] flex items-center gap-1 transition border border-cyan-500/30"
                              title="Részletes IP és Eszköz Adatlap"
                            >
                              <Eye size={12} />
                              <span>IP Adatlap</span>
                            </button>

                            {u.id !== adminUser?.id && (
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
                                {u.isGlobalAdmin ? '- Főadmin' : '+ Főadmin'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                        {userSearchTerm ? 'Nincs a keresési feltételeknek megfelelő felhasználó.' : 'Még nincs megjeleníthető felhasználó.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Details Modal (Részletes IP és Eszköz Adatlap) */}
          {selectedUserDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto space-y-6">
                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
                >
                  <X size={20} />
                </button>

                {/* Modal Header */}
                <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800">
                  <div className="p-3 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
                    <Users size={26} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white">{selectedUserDetail.nickname}</h2>
                      {selectedUserDetail.isGlobalAdmin && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-extrabold border border-amber-500/30">
                          FŐADMIN
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedUserDetail.isOnline
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {selectedUserDetail.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      User ID: {selectedUserDetail.id}
                    </p>
                  </div>
                </div>

                {/* Section 1: IP & Geolocation Details */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Globe size={14} className="text-cyan-400" />
                    <span>Hálózati és Földrajzi Adatok (GeoIP)</span>
                  </h3>

                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-700/60">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{selectedUserDetail.geo?.flag || '🌐'}</span>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Elsődleges IP Cím</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-sm font-bold text-cyan-300">
                              {selectedUserDetail.latestIp || 'Nincs rögzítve'}
                            </span>
                            {selectedUserDetail.latestIp && (
                              <button
                                onClick={() => copyToClipboard(selectedUserDetail.latestIp)}
                                className="text-slate-400 hover:text-white p-0.5 transition"
                                title="Másolás vágólapra"
                              >
                                {copiedIp === selectedUserDetail.latestIp ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {selectedUserDetail.geo?.mapUrl && (
                        <a
                          href={selectedUserDetail.geo.mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold transition"
                        >
                          <MapPin size={14} />
                          <span>Megnyitás Google Térképen</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Ország</span>
                        <span className="font-semibold text-slate-200">
                          {selectedUserDetail.geo?.country || '—'} ({selectedUserDetail.geo?.countryCode || '—'})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Város / Régió</span>
                        <span className="font-semibold text-slate-200">
                          {selectedUserDetail.geo?.city || '—'}, {selectedUserDetail.geo?.region || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Irányítószám</span>
                        <span className="font-semibold text-slate-200 font-mono">
                          {selectedUserDetail.geo?.postal || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Szolgáltató (ISP)</span>
                        <span className="font-semibold text-slate-200 truncate block" title={selectedUserDetail.geo?.isp}>
                          {selectedUserDetail.geo?.isp || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Szervezet / ASN</span>
                        <span className="font-semibold text-slate-200 truncate block" title={`${selectedUserDetail.geo?.org} (${selectedUserDetail.geo?.asn})`}>
                          {selectedUserDetail.geo?.org || selectedUserDetail.geo?.asn || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Időzóna</span>
                        <span className="font-semibold text-slate-200">
                          {selectedUserDetail.geo?.timezone || '—'}
                        </span>
                      </div>
                    </div>

                    {selectedUserDetail.geo?.latitude && selectedUserDetail.geo?.longitude && (
                      <div className="pt-2 border-t border-slate-700/60 font-mono text-[11px] text-slate-400">
                        Koordináták: {selectedUserDetail.geo.latitude}, {selectedUserDetail.geo.longitude}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Device & Browser Profile */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Laptop size={14} className="text-violet-400" />
                    <span>Eszköz és Böngésző Adatok</span>
                  </h3>

                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Eszköz Kategória</span>
                        <span className="font-semibold text-slate-200">
                          {selectedUserDetail.device?.device || 'Asztali'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Operációs Rendszer</span>
                        <span className="font-semibold text-slate-200">
                          {selectedUserDetail.device?.os || 'Ismeretlen'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Böngésző</span>
                        <span className="font-semibold text-slate-200">
                          {selectedUserDetail.device?.browser || 'Ismeretlen'}
                        </span>
                      </div>
                    </div>

                    {selectedUserDetail.device?.raw && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Nyers User-Agent</span>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/60 font-mono text-[11px] text-slate-300 break-all select-all">
                          {selectedUserDetail.device.raw}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Connection & IP History */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Activity size={14} className="text-amber-400" />
                    <span>Munkamenet és IP Előzmények</span>
                  </h3>

                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-700/60">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Fiók Létrehozva</span>
                        <span className="font-mono text-slate-200 font-semibold">
                          {new Date(selectedUserDetail.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Utolsó Aktivitás</span>
                        <span className="font-mono text-slate-200 font-semibold">
                          {new Date(selectedUserDetail.lastSeenAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">
                        Összes használt IP cím ({selectedUserDetail.allIps?.length || 0}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedUserDetail.allIps && selectedUserDetail.allIps.length > 0 ? (
                          selectedUserDetail.allIps.map((ip: string) => (
                            <span
                              key={ip}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs flex items-center gap-1.5"
                            >
                              <span>{ip}</span>
                              <button
                                onClick={() => copyToClipboard(ip)}
                                className="text-slate-400 hover:text-white transition"
                                title="Másolás"
                              >
                                {copiedIp === ip ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 italic">Nincs további IP cím.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedUserDetail(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
                  >
                    Bezárás
                  </button>
                </div>
              </div>
            </div>
          )}

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
                    <th className="py-2.5 px-3">IP Cím</th>
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
                      <td className="py-2 px-3 font-mono text-cyan-300 text-[11px]">
                        {log.ipAddress ? (
                          <span className="flex items-center gap-1.5" title={log.geo?.city ? `${log.geo.city}, ${log.geo.country}` : log.ipAddress}>
                            <span>{log.geo?.flag || '🌐'}</span>
                            <span>{log.ipAddress}</span>
                            {log.geo?.city && <span className="text-[10px] text-slate-400 font-normal">({log.geo.city})</span>}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
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
