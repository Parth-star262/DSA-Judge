'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  Users, 
  Code2, 
  Activity, 
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

type DashboardStats = {
  stats: {
    totalUsers: number;
    totalProblems: number;
    totalSubmissions: number;
    pendingSubmissions: number;
  };
  recentActivity: any[];
  problemDistribution: { difficulty: string; _count: number }[];
};

export default function AdminOverview() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/10" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white/5 rounded-2xl border border-white/10" />
          <div className="h-96 bg-white/5 rounded-2xl border border-white/10" />
        </div>
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: data?.stats.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Problems', value: data?.stats.totalProblems, icon: Code2, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Submissions', value: data?.stats.totalSubmissions, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Queue Status', value: data?.stats.pendingSubmissions === 0 ? 'Healthy' : `${data?.stats.pendingSubmissions} Pending`, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Overview</h1>
        <p className="text-slate-400">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={card.label}
            className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon size={24} className={card.color} />
              </div>
              <div className="p-1 rounded-full bg-white/5 text-slate-400 group-hover:text-indigo-400 transition-colors">
                <ArrowUpRight size={16} />
              </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">{card.label}</h3>
            <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">View all</button>
          </div>
          <div className="space-y-4 flex-1">
            {data?.recentActivity.map((sub, i) => (
              <div key={sub.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  sub.verdict === 'ACCEPTED' ? 'bg-emerald-500/15 text-emerald-400' : 
                  sub.verdict === 'PENDING' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {sub.verdict === 'ACCEPTED' ? <CheckCircle2 size={18} /> : 
                   sub.verdict === 'PENDING' ? <Clock size={18} /> : <AlertCircle size={18} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{sub.user.name}</p>
                  <p className="text-xs text-slate-400">submitted {sub.problem.title}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${
                    sub.verdict === 'ACCEPTED' ? 'text-emerald-400' : 
                    sub.verdict === 'PENDING' ? 'text-amber-400' : 'text-red-400'
                  }`}>{sub.verdict}</p>
                  <p className="text-[10px] text-slate-500">{new Date(sub.submittedAt).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Problem Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-2xl bg-white/[0.03] border border-white/10"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Distribution</h2>
          </div>
          <div className="space-y-6">
            {data?.problemDistribution.map((item) => {
              const percentage = Math.round((item._count / (data?.stats.totalProblems || 1)) * 100);
              const colors: Record<string, string> = {
                EASY: 'bg-emerald-500',
                MEDIUM: 'bg-amber-500',
                HARD: 'bg-red-500'
              };
              return (
                <div key={item.difficulty} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-medium">{item.difficulty}</span>
                    <span className="text-white font-bold">{item._count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full ${colors[item.difficulty] || 'bg-indigo-500'}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-10 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
            <p className="text-xs text-indigo-300 leading-relaxed">
              <strong>Tip:</strong> You have {data?.stats.totalProblems} problems live. Consider adding more HARD problems to challenge users.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
