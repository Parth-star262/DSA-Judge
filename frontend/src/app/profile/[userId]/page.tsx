'use client';
import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Activity, CheckCircle2, CircleDashed, Clock3, Code2, RotateCcw, Trophy, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface HistoryItem {
  id: string;
  verdict: string;
  score: number;
  submittedAt: string;
  problem: { title: string; slug: string };
}

interface PublicProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  submissions: HistoryItem[];
}

const verdictColor = (verdict: string) => {
  if (verdict === 'ACCEPTED') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (verdict === 'PARTIAL') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (verdict === 'WRONG_ANSWER' || verdict === 'RUNTIME_ERROR') return 'text-red-400 bg-red-500/10 border-red-500/20';
  if (verdict === 'TLE') return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
  return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
};

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/${userId}/profile`)
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const stats = useMemo(() => {
    const submissions = profile?.submissions || [];
    const judged = submissions.filter((h) => h.verdict !== 'PENDING');
    const solved = new Set(
      judged
        .filter((h) => h.verdict === 'ACCEPTED')
        .map((h) => h.problem.slug)
    ).size;
    const revisit = judged.filter((h) => h.verdict === 'WRONG_ANSWER' || h.verdict === 'RUNTIME_ERROR' || h.verdict === 'TLE').length;
    return { solved, attempted: judged.length, revisit };
  }, [profile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400">
        User not found
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 relative">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-6 mb-12">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-1">
          <div className="w-full h-full rounded-full bg-[#0a0f1c] flex items-center justify-center">
            <User size={38} className="text-indigo-300" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{profile.name}</h1>
          <p className="text-indigo-300 font-medium tracking-wide">{profile.email}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass rounded-2xl p-6 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-4 text-emerald-400 text-xs font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Solved</span>
            <Trophy size={16} />
          </div>
          <div className="text-5xl font-black text-white">{stats.solved}</div>
        </div>
        <div className="glass rounded-2xl p-6 border border-blue-500/20">
          <div className="flex items-center justify-between mb-4 text-blue-400 text-xs font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2"><CircleDashed size={16} /> Attempted</span>
            <Activity size={16} />
          </div>
          <div className="text-5xl font-black text-white">{stats.attempted}</div>
        </div>
        <div className="glass rounded-2xl p-6 border border-amber-500/20">
          <div className="flex items-center justify-between mb-4 text-amber-400 text-xs font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2"><RotateCcw size={16} /> Revisit</span>
            <Code2 size={16} />
          </div>
          <div className="text-5xl font-black text-white">{stats.revisit}</div>
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-white/5">
        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <h2 className="font-bold text-white tracking-wide text-lg flex items-center gap-2">
            <Clock3 size={18} className="text-indigo-400" /> Recent Submissions
          </h2>
        </div>
        {profile.submissions.length === 0 ? (
          <div className="p-12 text-slate-400 text-center">No submissions yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {profile.submissions.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-4 md:gap-8 items-center p-6 hover:bg-white/[0.02]">
                <Link href={`/problems/${item.problem.slug}`} className="text-slate-200 font-semibold hover:text-indigo-300 transition-colors text-lg truncate">
                  {item.problem.title}
                </Link>
                <span className={`px-3 py-1 text-xs font-bold tracking-widest rounded-md border ${verdictColor(item.verdict)}`}>
                  {item.verdict.replace('_', ' ')}
                </span>
                <div className="text-indigo-300 font-mono font-bold tracking-wider text-right">{item.score}%</div>
                <div className="text-slate-500 text-sm font-medium text-right">
                  {new Date(item.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
