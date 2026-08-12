'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Trophy, Flame, Shield, Sparkles, User, Award, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { SkeletonCard } from '@/components/SkeletonLoader';

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 skeleton rounded-2xl" />
          <div className="flex flex-col gap-2">
            <div className="w-64 h-8 skeleton rounded-xl" />
            <div className="w-40 h-4 skeleton rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const top3 = users.slice(0, 3);
  const restUsers = users.slice(3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16 relative">
      {/* Glow ambient background */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-5 mb-10 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/20">
          <Crown size={36} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-1 font-['Outfit']">
            Global Leaderboard
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">Rankings based on verified problem evaluations, accuracy & daily streak mastery.</p>
        </div>
      </motion.div>

      {/* Top 3 Podium Highlights */}
      {top3.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 relative z-10"
        >
          {top3.map((u, idx) => {
            const ranks = [
              { title: '1st Place', border: 'border-amber-500/50', bg: 'from-amber-500/20 to-amber-950/30', badge: 'bg-amber-500 text-black', iconColor: 'text-amber-400' },
              { title: '2nd Place', border: 'border-slate-300/50', bg: 'from-slate-400/15 to-slate-950/30', badge: 'bg-slate-300 text-black', iconColor: 'text-slate-300' },
              { title: '3rd Place', border: 'border-amber-700/50', bg: 'from-amber-700/20 to-amber-950/30', badge: 'bg-amber-700 text-white', iconColor: 'text-amber-600' },
            ];
            const r = ranks[idx];

            return (
              <div
                key={u.userId}
                className={`glass-panel p-6 rounded-3xl border ${r.border} bg-gradient-to-b ${r.bg} flex flex-col items-center text-center relative overflow-hidden group shadow-xl`}
              >
                <div className={`absolute top-3 right-4 text-xs font-extrabold px-3 py-1 rounded-full ${r.badge}`}>
                  Rank #{idx + 1}
                </div>

                <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-white/20 flex items-center justify-center mb-4 mt-2 shadow-inner group-hover:scale-105 transition-transform">
                  <User size={36} className={r.iconColor} />
                </div>

                <Link href={`/profile/${u.userId}`} className="text-xl font-extrabold text-white hover:text-indigo-300 transition-colors mb-1">
                  {u.name}
                </Link>

                <div className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-1.5">
                  <Flame size={14} className="text-orange-400 fill-current" /> {u.currentStreak} Day Streak
                </div>

                <div className="w-full grid grid-cols-2 gap-2 pt-4 border-t border-white/10 text-xs">
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Solved</span>
                    <span className="text-emerald-400 font-extrabold text-base">{u.solved}</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Accuracy</span>
                    <span className="text-indigo-300 font-extrabold text-base">{u.acceptanceRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Main Leaderboard Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative z-10"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#090b22] border-b border-white/10 text-xs uppercase tracking-wider text-slate-400 font-extrabold">
                <th className="py-4 px-6 text-center w-20">Rank</th>
                <th className="py-4 px-6">Hacker</th>
                <th className="py-4 px-6 text-center">Problems Solved</th>
                <th className="py-4 px-6 text-center">Acceptance Rate</th>
                <th className="py-4 px-6 text-center">Current Streak</th>
                <th className="py-4 px-6 text-center">Best Streak</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.userId}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition-colors font-medium text-sm"
                >
                  <td className="py-4 px-6 text-center font-extrabold">
                    {i === 0 ? (
                      <span className="text-amber-400 font-mono text-base">#1</span>
                    ) : i === 1 ? (
                      <span className="text-slate-300 font-mono text-base">#2</span>
                    ) : i === 2 ? (
                      <span className="text-amber-600 font-mono text-base">#3</span>
                    ) : (
                      <span className="text-slate-500 font-mono">#{i + 1}</span>
                    )}
                  </td>
                  <td className="py-4 px-6 font-bold text-white">
                    <Link href={`/profile/${user.userId}`} className="hover:text-indigo-300 transition-colors flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs text-indigo-300">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      {user.name}
                    </Link>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold px-3 py-1 rounded-full text-xs">
                      {user.solved} Solved
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center font-mono text-indigo-300 font-bold">
                    {user.acceptanceRate.toFixed(1)}%
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className={`inline-flex items-center gap-1 font-bold ${user.currentStreak > 2 ? 'text-orange-400' : 'text-slate-400'}`}>
                      {user.currentStreak > 0 && <Flame size={15} className="fill-current" />}
                      {user.currentStreak} Days
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center font-semibold text-slate-400">
                    {user.longestStreak} Days
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center p-16 text-slate-400 flex flex-col items-center gap-3">
              <Trophy size={48} className="text-slate-600 opacity-50" />
              <p className="text-base font-semibold">No rankings available yet. Be the first to solve a problem!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
