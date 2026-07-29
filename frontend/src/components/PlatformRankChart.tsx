'use client';

import { useEffect, useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import api from '@/lib/api';

interface RatingPoint { date: string; rating: number; rank?: number; contestName?: string; }
interface PlatformAccount { id: string; platform: string; username: string; currentRating?: number | null; ratingHistory?: RatingPoint[] | null; }

export default function PlatformRankChart() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    api.get('/platform-accounts').then((response) => {
      const connected = (response.data || []).filter((account: PlatformAccount) => Array.isArray(account.ratingHistory) && account.ratingHistory.length > 0);
      setAccounts(connected);
      if (connected[0]) setSelected(connected[0].id);
    }).catch(() => setAccounts([]));
  }, []);

  const account = accounts.find((item) => item.id === selected);
  const history = useMemo(() => (Array.isArray(account?.ratingHistory) ? account.ratingHistory.map((item) => ({ ...item, label: new Date(item.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) })) : []), [account]);

  return <section className="glass rounded-xl overflow-hidden border border-white/5 bg-[#16171b]">
    <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between gap-3">
      <div><h2 className="font-bold text-white flex items-center gap-2"><BarChart3 size={18} className="text-orange-400" /> Rank journey</h2><p className="text-xs text-slate-500 mt-1">Public contest rating history by platform.</p></div>
      {accounts.length > 1 && <select value={selected} onChange={(event) => setSelected(event.target.value)} className="rounded-lg bg-slate-900 border border-white/10 px-2.5 py-2 text-xs text-slate-200 outline-none">{accounts.map((item) => <option key={item.id} value={item.id}>{item.platform} · @{item.username}</option>)}</select>}
    </div>
    {!account ? <div className="h-[230px] flex items-center justify-center text-center px-6"><p className="text-sm text-slate-500">No public rating history yet. Connect Codeforces and refresh it after participating in rated contests.</p></div> : <div className="p-4"><div className="flex items-baseline gap-2 mb-2"><span className="text-2xl font-black text-white">{account.currentRating || history.at(-1)?.rating}</span><span className="text-xs uppercase tracking-wider text-slate-500">current rating</span></div><div className="h-[190px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={history}><XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis domain={['dataMin - 50', 'dataMax + 50']} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={36} /><Tooltip contentStyle={{ background: '#121317', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: '#cbd5e1' }} /><Line type="monotone" dataKey="rating" stroke="#fb923c" strokeWidth={3} dot={{ r: 3, fill: '#fb923c' }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div></div>}
  </section>;
}
