'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Trophy, Flame, Trophy as Trophy2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardUser {
  userId: string;
  name: string;
  solved: number;
  attempted: number;
  acceptanceRate: number;
  longestStreak: number;
  currentStreak: number;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/leaderboard/global?limit=100')
      .then((res) => setUsers(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-slate-400 font-medium tracking-widest text-sm uppercase">Loading Rankings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 relative">
      <div className="absolute top-20 right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-5 mb-12 relative z-10"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Trophy size={32} className="text-white" />
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">Global Leaderboard</h1>
          <p className="text-slate-400 text-lg">See how you rank among the top performers.</p>
        </div>
      </motion.div>

      {/* Table Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-3xl overflow-hidden border border-white/10 shadow-xl shadow-black/40 relative z-10"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#0f172a]/80 border-b border-slate-700/80 uppercase text-xs tracking-widest text-slate-400 font-bold">
                <th className="p-5 pl-8 text-center w-20">Rank</th>
                <th className="p-5">Hacker</th>
                <th className="p-5 text-center">Solved</th>
                <th className="p-5 text-center">Acceptance</th>
                <th className="p-5 text-center">Current Streak</th>
                <th className="p-5 text-center">Longest Streak</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => {
                const isTop3 = i < 3;
                const topStyles = [
                  'bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500',
                  'bg-gradient-to-r from-slate-300/10 to-transparent border-l-4 border-slate-300',
                  'bg-gradient-to-r from-orange-400/10 to-transparent border-l-4 border-orange-400',
                ];
                
                return (
                  <tr 
                    key={user.userId}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors group ${isTop3 ? topStyles[i] : 'border-l-4 border-transparent'}`}
                  >
                    <td className="p-5 pl-8 text-center font-bold text-lg">
                      {i === 0 ? <span className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">1</span> : 
                       i === 1 ? <span className="text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]">2</span> : 
                       i === 2 ? <span className="text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]">3</span> : 
                       <span className="text-slate-500 group-hover:text-slate-300 transition-colors">{i + 1}</span>}
                    </td>
                    <td className="p-5 font-semibold text-base">
                      <Link href={`/profile/${user.userId}`} className="text-indigo-300 hover:text-indigo-200 transition-colors flex items-center gap-2">
                        {user.name} 
                        {isTop3 && <Trophy2 size={14} className={i===0 ? 'text-amber-500' : i===1 ? 'text-slate-300' : 'text-orange-400'} />}
                      </Link>
                    </td>
                    <td className="p-5 text-center">
                      <div className="inline-flex bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-3 py-1 rounded-full text-sm">
                        {user.solved}
                      </div>
                    </td>
                    <td className="p-5 text-center font-mono text-blue-400 font-medium tracking-wide">
                      {user.acceptanceRate.toFixed(1)}%
                    </td>
                    <td className="p-5 text-center">
                      <div className={`inline-flex items-center gap-1.5 font-bold ${user.currentStreak > 2 ? 'text-orange-400' : 'text-slate-400'}`}>
                        {user.currentStreak > 0 ? <Flame size={16} className={user.currentStreak > 2 ? 'animate-pulse' : ''} /> : <span className="w-4" />}
                        {user.currentStreak}
                      </div>
                    </td>
                    <td className="p-5 text-center font-semibold text-slate-400">
                      {user.longestStreak}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center p-16 text-slate-400 flex flex-col items-center gap-4">
              <Trophy2 size={48} className="text-slate-600 opacity-50" />
              <p className="text-lg">No users on leaderboard yet. Start solving problems!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
