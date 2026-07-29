'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Link2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import api from '@/lib/api';

type Platform = 'CODEFORCES' | 'LEETCODE' | 'CODECHEF' | 'HACKERRANK' | 'GEEKSFORGEEKS' | 'ATCODER';

interface PlatformAccount {
  id: string;
  platform: Platform;
  username: string;
  solvedCount: number;
  isVerified: boolean;
  lastSyncedAt: string | null;
}

const PLATFORM_DETAILS: Record<Platform, { name: string; color: string; url: (username: string) => string }> = {
  CODEFORCES: { name: 'Codeforces', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', url: (u) => `https://codeforces.com/profile/${encodeURIComponent(u)}` },
  LEETCODE: { name: 'LeetCode', color: 'text-amber-300 bg-amber-500/10 border-amber-500/20', url: (u) => `https://leetcode.com/${encodeURIComponent(u)}` },
  CODECHEF: { name: 'CodeChef', color: 'text-orange-200 bg-orange-300/10 border-orange-300/20', url: (u) => `https://www.codechef.com/users/${encodeURIComponent(u)}` },
  HACKERRANK: { name: 'HackerRank', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', url: (u) => `https://www.hackerrank.com/profile/${encodeURIComponent(u)}` },
  GEEKSFORGEEKS: { name: 'GeeksforGeeks', color: 'text-green-400 bg-green-500/10 border-green-500/20', url: (u) => `https://auth.geeksforgeeks.org/user/${encodeURIComponent(u)}/profile` },
  ATCODER: { name: 'AtCoder', color: 'text-slate-300 bg-slate-500/10 border-slate-500/20', url: (u) => `https://atcoder.jp/users/${encodeURIComponent(u)}` },
};

const platformList = Object.keys(PLATFORM_DETAILS) as Platform[];

export default function PlatformTracker() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [platform, setPlatform] = useState<Platform>('CODEFORCES');
  const [username, setUsername] = useState('');
  const [solvedCount, setSolvedCount] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadAccounts = async () => {
    try {
      const response = await api.get('/platform-accounts');
      setAccounts(response.data || []);
    } catch {
      setError('Could not load connected platforms.');
    }
  };

  useEffect(() => { void loadAccounts(); }, []);

  const totalSolved = useMemo(() => accounts.reduce((sum, account) => sum + account.solvedCount, 0), [accounts]);
  const availablePlatforms = platformList.filter((item) => !accounts.some((account) => account.platform === item) || item === platform);

  const saveAccount = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.put('/platform-accounts', {
        platform,
        username,
        ...(platform === 'CODEFORCES' ? {} : { solvedCount: Number(solvedCount) }),
      });
      if (platform === 'CODEFORCES') await api.post('/platform-accounts/codeforces/refresh');
      setUsername('');
      setSolvedCount('');
      setIsAdding(false);
      await loadAccounts();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message || 'Could not save this platform.');
    } finally {
      setSaving(false);
    }
  };

  const refreshCodeforces = async () => {
    setError('');
    setRefreshing(true);
    try {
      await api.post('/platform-accounts/codeforces/refresh');
      await loadAccounts();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message || 'Could not refresh Codeforces.');
    } finally {
      setRefreshing(false);
    }
  };

  const removeAccount = async (account: PlatformAccount) => {
    if (!window.confirm(`Remove ${PLATFORM_DETAILS[account.platform].name}?`)) return;
    setError('');
    try {
      await api.delete(`/platform-accounts/${account.platform}`);
      setAccounts((current) => current.filter((item) => item.id !== account.id));
    } catch {
      setError('Could not remove this platform.');
    }
  };

  return (
    <section className="glass rounded-3xl overflow-hidden border border-white/5">
      <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h2 className="font-bold text-white tracking-wide text-lg flex items-center gap-2"><Link2 size={18} className="text-emerald-400" /> Connected Platforms</h2>
          <p className="text-xs text-slate-500 mt-1">Track your public problem-solving profiles in one place.</p>
        </div>
        <div className="text-right"><div className="text-2xl font-black text-white">{totalSolved}</div><div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold">External solves</div></div>
      </div>

      <div className="p-5 md:p-6">
        {error && <p className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
        {accounts.length === 0 && !isAdding ? (
          <div className="py-7 text-center border border-dashed border-white/10 rounded-2xl">
            <Link2 size={30} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-300 font-medium">No coding platforms connected yet.</p>
            <p className="text-slate-500 text-sm mt-1">Add your public username to start tracking totals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map((account) => {
              const detail = PLATFORM_DETAILS[account.platform];
              return <div key={account.id} className="rounded-xl border border-white/5 bg-white/[0.025] p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-black text-sm ${detail.color}`}>{detail.name.slice(0, 2).toUpperCase()}</div>
                <div className="min-w-0 flex-1"><div className="text-slate-100 font-semibold">{detail.name}</div><div className="text-slate-500 text-xs truncate">@{account.username}</div></div>
                <div className="text-right"><div className="text-xl font-black text-white">{account.solvedCount}</div><div className="text-[10px] uppercase tracking-wider text-slate-500">solved</div></div>
                <div className="flex flex-col gap-1">
                  <a href={detail.url(account.username)} target="_blank" rel="noreferrer" title={`Open ${detail.name}`} className="p-1.5 text-slate-500 hover:text-white"><ExternalLink size={15} /></a>
                  <button onClick={() => removeAccount(account)} title={`Remove ${detail.name}`} className="p-1.5 text-slate-600 hover:text-red-400"><Trash2 size={15} /></button>
                </div>
              </div>;
            })}
          </div>
        )}

        {accounts.some((account) => account.platform === 'CODEFORCES') && <button onClick={refreshCodeforces} disabled={refreshing} className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 disabled:opacity-60"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Refreshing Codeforces…' : 'Refresh Codeforces total'}</button>}

        {isAdding ? <form onSubmit={saveAccount} className="mt-5 pt-5 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <label className="text-xs text-slate-400">Platform<select value={platform} onChange={(event) => setPlatform(event.target.value as Platform)} className="mt-1.5 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm text-white outline-none"><option value={platform}>{PLATFORM_DETAILS[platform].name}</option>{availablePlatforms.filter((item) => item !== platform).map((item) => <option key={item} value={item}>{PLATFORM_DETAILS[item].name}</option>)}</select></label>
          <label className="text-xs text-slate-400">Public username<input value={username} onChange={(event) => setUsername(event.target.value)} required maxLength={100} placeholder="Your handle" className="mt-1.5 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm text-white outline-none" /></label>
          {platform === 'CODEFORCES' ? <p className="text-xs text-emerald-400 pb-2">Total is fetched free from Codeforces after you save.</p> : <label className="text-xs text-slate-400">Solved count<input type="number" min="0" value={solvedCount} onChange={(event) => setSolvedCount(event.target.value)} required placeholder="0" className="mt-1.5 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm text-white outline-none" /></label>}
          <div className="sm:col-span-3 flex gap-3"><button disabled={saving} className="btn-primary px-4 py-2 text-sm disabled:opacity-60">{saving ? 'Saving…' : 'Save platform'}</button><button type="button" onClick={() => setIsAdding(false)} className="text-sm text-slate-400 hover:text-white">Cancel</button></div>
        </form> : accounts.length < platformList.length && <button onClick={() => { setPlatform(platformList.find((item) => !accounts.some((account) => account.platform === item)) || 'CODEFORCES'); setIsAdding(true); }} className="mt-5 w-full rounded-xl border border-dashed border-emerald-500/30 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center gap-2"><Plus size={16} /> Add platform</button>}
      </div>
    </section>
  );
}
