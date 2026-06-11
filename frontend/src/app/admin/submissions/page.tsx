'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  Activity, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Filter,
  User,
  Code
} from 'lucide-react';
import { motion } from 'framer-motion';

type Submission = {
  id: string;
  verdict: string;
  language: string;
  submittedAt: string;
  user: { name: string; email: string };
  problem: { title: string; slug: string };
  executionTime: number;
  memory: number;
};

export default function SubmissionsManagement() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/submissions');
      setSubmissions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const filteredSubmissions = submissions.filter(s => 
    s.user.name.toLowerCase().includes(search.toLowerCase()) || 
    s.problem.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Submissions</h1>
          <p className="text-slate-400">Global feed of all code submissions across the platform.</p>
        </div>
        <button 
          onClick={fetchSubmissions}
          className="text-sm text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-2"
        >
          <Clock size={16} /> Refresh Now
        </button>
      </div>

      <div className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/10 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by user or problem..."
            className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all">
          <Filter size={18} />
        </button>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-sm font-medium">
                <th className="px-6 py-4">Submission ID</th>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Problem</th>
                <th className="px-6 py-4">Verdict</th>
                <th className="px-6 py-4">Stats</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && submissions.length === 0 ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-white/5 rounded w-1/2" /></td>
                  </tr>
                ))
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No submissions found.</td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-xs font-mono text-slate-500">#{sub.id.slice(-8)}</div>
                      <div className="text-[10px] text-indigo-400 font-bold uppercase">{sub.language}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                          <User size={12} className="text-slate-400" />
                        </div>
                        <div className="text-sm font-medium text-white">{sub.user.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Code size={14} className="text-slate-500" />
                        {sub.problem.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 font-bold text-xs ${
                        sub.verdict === 'ACCEPTED' ? 'text-emerald-400' :
                        sub.verdict === 'PENDING' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {sub.verdict === 'ACCEPTED' ? <CheckCircle2 size={14} /> : 
                         sub.verdict === 'PENDING' ? <Clock size={14} /> : <AlertCircle size={14} />}
                        {sub.verdict}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        <div>Time: {sub.executionTime || 0}s</div>
                        <div>Mem: {sub.memory || 0} KB</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-400">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                        <div className="text-[10px] text-slate-500">{new Date(sub.submittedAt).toLocaleTimeString()}</div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
