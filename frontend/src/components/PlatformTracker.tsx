'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ChevronDown, ExternalLink, Link2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import api from '@/lib/api';

type Platform = 'CODEFORCES' | 'LEETCODE' | 'CODECHEF' | 'HACKERRANK' | 'GEEKSFORGEEKS' | 'ATCODER';
type AutoSyncPlatform = Extract<Platform, 'CODEFORCES' | 'LEETCODE'>;

interface PlatformAccount { id: string; platform: Platform; username: string; solvedCount: number; isVerified: boolean; lastSyncedAt: string | null; }

const PLATFORM_DETAILS: Record<Platform, { name: string; color: string; url: (username: string) => string }> = {
  CODEFORCES: { name: 'Codeforces', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', url: (u) => `https://codeforces.com/profile/${encodeURIComponent(u)}` },
  LEETCODE: { name: 'LeetCode', color: 'text-amber-300 bg-amber-500/10 border-amber-500/20', url: (u) => `https://leetcode.com/u/${encodeURIComponent(u)}/` },
  CODECHEF: { name: 'CodeChef', color: 'text-orange-200 bg-orange-300/10 border-orange-300/20', url: (u) => `https://www.codechef.com/users/${encodeURIComponent(u)}` },
  HACKERRANK: { name: 'HackerRank', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', url: (u) => `https://www.hackerrank.com/profile/${encodeURIComponent(u)}` },
  GEEKSFORGEEKS: { name: 'GeeksforGeeks', color: 'text-green-400 bg-green-500/10 border-green-500/20', url: (u) => `https://auth.geeksforgeeks.org/user/${encodeURIComponent(u)}/profile` },
  ATCODER: { name: 'AtCoder', color: 'text-slate-300 bg-slate-500/10 border-slate-500/20', url: (u) => `https://atcoder.jp/users/${encodeURIComponent(u)}` },
};

const platformList = Object.keys(PLATFORM_DETAILS) as Platform[];
const AUTO_SYNC_PLATFORMS: AutoSyncPlatform[] = ['CODEFORCES', 'LEETCODE'];
const isAutoSyncPlatform = (platform: Platform): platform is AutoSyncPlatform => AUTO_SYNC_PLATFORMS.includes(platform as AutoSyncPlatform);

export default function PlatformTracker() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [platform, setPlatform] = useState<Platform>('LEETCODE');
  const [username, setUsername] = useState('');
  const [solvedCount, setSolvedCount] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState<Platform | null>(null);
  const [error, setError] = useState('');

  const loadAccounts = async () => {
    try { const response = await api.get('/platform-accounts'); setAccounts(response.data || []); }
    catch { setError('Could not load connected platforms.'); }
  };

  useEffect(() => { void loadAccounts(); }, []);
  const totalSolved = useMemo(() => accounts.reduce((sum, account) => sum + account.solvedCount, 0), [accounts]);
  const availablePlatforms = platformList.filter((item) => !accounts.some((account) => account.platform === item) || item === platform);

  const refreshAccount = async (platformToRefresh: AutoSyncPlatform) => {
    setError(''); setRefreshing(platformToRefresh);
    try { await api.post(`/platform-accounts/${platformToRefresh.toLowerCase()}/refresh`); await loadAccounts(); }
    catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message || `Could not refresh ${PLATFORM_DETAILS[platformToRefresh].name}.`);
    } finally { setRefreshing(null); }
  };

  const saveAccount = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setSaving(true);
    try {
      await api.put('/platform-accounts', { platform, username, ...(isAutoSyncPlatform(platform) ? {} : { solvedCount: Number(solvedCount) }) });
      if (isAutoSyncPlatform(platform)) await refreshAccount(platform); else await loadAccounts();
      setUsername(''); setSolvedCount(''); setIsAdding(false);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message || 'Could not save this platform.');
    } finally { setSaving(false); }
  };

  const removeAccount = async (account: PlatformAccount) => {
    if (!window.confirm(`Remove ${PLATFORM_DETAILS[account.platform].name}?`)) return;
    setError('');
    try { await api.delete(`/platform-accounts/${account.platform}`); setAccounts((current) => current.filter((item) => item.id !== account.id)); }
    catch { setError('Could not remove this platform.'); }
  };

  return (
    <section className="glass rounded-2xl overflow-hidden border border-white/5 bg-[#121317]">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between gap-4">
        <div className="min-w-0"><h2 className="font-bold text-slate-100 tracking-wide text-base flex items-center gap-2"><Link2 size={17} className="text-orange-400" /> Problem Solving Stats</h2><p className="text-xs text-slate-500 mt-1">All your coding profiles, together.</p></div>
        <div className="text-right shrink-0"><div className="text-2xl leading-none font-black text-white">{totalSolved}</div><div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500 font-bold">Total solved</div></div>
      </div>
      <div className="p-4 sm:p-5">
        {error && <p className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
        {accounts.length === 0 && !isAdding ? <div className="py-7 text-center border border-dashed border-white/10 rounded-xl"><Link2 size={30} className="mx-auto text-slate-600 mb-3" /><p className="text-slate-300 font-medium">No coding platforms connected yet.</p><p className="text-slate-500 text-sm mt-1">Add your public username to start tracking totals.</p></div> : <div className="space-y-1.5">{accounts.map((account) => {
          const detail = PLATFORM_DETAILS[account.platform];
          return <div key={account.id} className="group rounded-lg px-3 py-2.5 flex items-center gap-3 hover:bg-white/[0.045] transition-colors">
            <div className={`w-8 h-8 rounded-md border flex items-center justify-center font-black text-[10px] ${detail.color}`}>{detail.name.slice(0, 2).toUpperCase()}</div>
            <div className="min-w-0 flex-1"><div className="text-slate-100 font-semibold text-sm">{detail.name}</div><div className="text-slate-500 text-[11px] truncate">@{account.username}</div></div>
            <div className="text-right"><div className="text-sm font-black text-slate-100">{account.solvedCount}</div><div className="text-[9px] uppercase tracking-wider text-slate-500">solved</div></div>
            <BadgeCheck size={19} className={account.isVerified ? 'text-emerald-400' : 'text-slate-600'} aria-label={account.isVerified ? 'Verified total' : 'Manual total'} />
            <div className="flex items-center gap-0.5"><a href={detail.url(account.username)} target="_blank" rel="noreferrer" title={`Open ${detail.name}`} className="p-1.5 text-slate-500 hover:text-white"><ExternalLink size={16} /></a><button onClick={() => removeAccount(account)} title={`Remove ${detail.name}`} className="p-1.5 text-slate-600 hover:text-red-400"><Trash2 size={15} /></button></div>
          </div>;
        })}</div>}
        {accounts.filter((account) => isAutoSyncPlatform(account.platform)).length > 0 && <div className="mt-3 flex flex-wrap gap-3">{accounts.filter((account) => isAutoSyncPlatform(account.platform)).map((account) => <button key={account.id} onClick={() => refreshAccount(account.platform as AutoSyncPlatform)} disabled={refreshing !== null} className="inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-60"><RefreshCw size={14} className={refreshing === account.platform ? 'animate-spin' : ''} />{refreshing === account.platform ? 'Refreshing…' : `Refresh ${PLATFORM_DETAILS[account.platform].name}`}</button>)}</div>}
        {isAdding ? <form onSubmit={saveAccount} className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <label className="text-xs text-slate-400">Platform<select value={platform} onChange={(event) => setPlatform(event.target.value as Platform)} className="mt-1.5 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm text-white outline-none"><option value={platform}>{PLATFORM_DETAILS[platform].name}</option>{availablePlatforms.filter((item) => item !== platform).map((item) => <option key={item} value={item}>{PLATFORM_DETAILS[item].name}</option>)}</select></label>
          <label className="text-xs text-slate-400">Public username<input value={username} onChange={(event) => setUsername(event.target.value)} required maxLength={100} placeholder={platform === 'LEETCODE' ? 'e.g. ROCKSTAR_PARTH' : 'Your handle'} className="mt-1.5 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm text-white outline-none" /></label>
          {isAutoSyncPlatform(platform) ? <p className="text-xs text-emerald-400 pb-2">Your public solved total is fetched automatically after you save.</p> : <label className="text-xs text-slate-400">Solved count<input type="number" min="0" value={solvedCount} onChange={(event) => setSolvedCount(event.target.value)} required placeholder="0" className="mt-1.5 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm text-white outline-none" /></label>}
          <div className="sm:col-span-3 flex gap-3"><button disabled={saving || refreshing !== null} className="btn-primary px-4 py-2 text-sm disabled:opacity-60">{saving ? 'Saving…' : 'Save platform'}</button><button type="button" onClick={() => setIsAdding(false)} className="text-sm text-slate-400 hover:text-white">Cancel</button></div>
        </form> : accounts.length < platformList.length && <button onClick={() => { setPlatform(platformList.find((item) => !accounts.some((account) => account.platform === item)) || 'LEETCODE'); setIsAdding(true); }} className="mt-4 w-full rounded-lg bg-white/[0.07] py-2.5 text-sm font-semibold text-orange-400 hover:bg-white/[0.11] flex items-center justify-center gap-2"><Plus size={16} /> Add Platform <ChevronDown size={15} className="-rotate-90" /></button>}
      </div>
    </section>
  );
}
