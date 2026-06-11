'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, CircleDashed, Clock3, RotateCcw, User, Activity, Code2, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface HistoryProblem {
  title: string;
  slug: string;
}

interface HistoryItem {
  id: string;
  verdict: string;
  score: number;
  submittedAt: string;
  complexityEstimate?: string | null;
  problem: HistoryProblem;
}

const verdictColor = (verdict: string) => {
  if (verdict === 'ACCEPTED') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (verdict === 'PARTIAL') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (verdict === 'WRONG_ANSWER' || verdict === 'RUNTIME_ERROR') return 'text-red-400 bg-red-500/10 border-red-500/20';
  if (verdict === 'TLE') return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
  return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [history, setHistory] = useState<HistoryItem[] | null>(null);

  useEffect(() => {
    if (!user) return;
    api.get('/submissions/user/history')
      .then((res) => setHistory(res.data || []))
      .catch(() => setHistory([]));
  }, [user]);

  const stats = useMemo(() => {
    const safeHistory = history || [];
    const solved = new Set(
      safeHistory
        .filter((h) => h.verdict === 'ACCEPTED')
        .map((h) => h.problem.slug)
    ).size;
    const attempted = safeHistory.length;
    const revisit = safeHistory.filter((h) => h.verdict === 'WRONG_ANSWER' || h.verdict === 'RUNTIME_ERROR' || h.verdict === 'TLE').length;
    return { solved, attempted, revisit };
  }, [history]);

  const historyLoading = !!user && history === null;
  const historyItems = history || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-slate-400 font-medium tracking-widest text-sm uppercase">Loading Profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-10 max-w-md w-full text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/5">
            <User size={36} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Login Required</h1>
          <p className="text-slate-400 mb-8">Please sign in to view your progress and submission history.</p>
          <Link href="/login">
            <button className="w-full btn-primary bg-gradient-to-r from-indigo-500 to-purple-500 py-3 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              Sign In Now
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 relative">
      <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-6 mb-12">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
          <div className="w-full h-full rounded-full bg-[#0a0f1c] flex items-center justify-center border-4 border-transparent bg-clip-padding">
            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{user.name}</h1>
          <p className="text-indigo-300 font-medium tracking-wide">{user.email}</p>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants} initial="hidden" animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10"
      >
        <motion.div variants={itemVariants} className="glass rounded-2xl p-6 border border-emerald-500/20 shadow-[inset_0_0_20px_rgba(34,197,94,0.02)]">
          <div className="flex items-center justify-between pointer-events-none mb-4">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={16} /> Solved
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Trophy size={14} className="text-emerald-500" />
            </div>
          </div>
          <div className="text-5xl font-black text-white">{stats.solved}</div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass rounded-2xl p-6 border border-blue-500/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.02)]">
          <div className="flex items-center justify-between pointer-events-none mb-4">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <CircleDashed size={16} /> Attempted
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Activity size={14} className="text-blue-500" />
            </div>
          </div>
          <div className="text-5xl font-black text-white">{stats.attempted}</div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass rounded-2xl p-6 border border-amber-500/20 shadow-[inset_0_0_20px_rgba(245,158,11,0.02)]">
          <div className="flex items-center justify-between pointer-events-none mb-4">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <RotateCcw size={16} /> Revisit
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Code2 size={14} className="text-amber-500" />
            </div>
          </div>
          <div className="text-5xl font-black text-white">{stats.revisit}</div>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass rounded-3xl overflow-hidden border border-white/5 relative z-10"
      >
        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <h2 className="font-bold text-white tracking-wide text-lg flex items-center gap-2">
            <Clock3 size={18} className="text-indigo-400" /> Recent Submissions
          </h2>
        </div>

        {historyLoading ? (
          <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>
        ) : historyItems.length === 0 ? (
          <div className="p-16 text-center">
            <Code2 size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-400 text-lg">No submissions yet.</p>
            <p className="text-slate-500 mt-2 text-sm">Start your journey by solving your first problem!</p>
            <Link href="/problems">
              <button className="mt-6 px-6 py-2 rounded-full border border-indigo-500/30 text-indigo-400 font-semibold hover:bg-indigo-500/10 transition">
                Explore Problems
              </button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {historyItems.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-4 md:gap-8 items-center p-6 hover:bg-white/[0.02] transition-colors group">
                <Link href={`/problems/${item.problem.slug}`} className="text-slate-200 font-semibold group-hover:text-indigo-300 transition-colors text-lg truncate">
                  {item.problem.title}
                </Link>
                
                <div className="flex md:block items-center justify-between">
                  <span className={`px-3 py-1 text-xs font-bold tracking-widest rounded-md border ${verdictColor(item.verdict)}`}>
                    {item.verdict.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="text-indigo-300 font-mono font-bold tracking-wider text-right">
                  {item.score}%
                </div>
                
                <div className="text-slate-500 text-sm font-medium flex items-center gap-2 justify-end">
                  {new Date(item.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
