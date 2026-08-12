'use client';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, CircleDashed, Clock3, RotateCcw, User, Activity, Code2, Trophy, Sparkles, Globe2, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import BadgeGallery from '@/components/BadgeGallery';
import TopicRadarChart from '@/components/TopicRadarChart';
import PlatformTracker from '@/components/PlatformTracker';
import PlatformRankChart from '@/components/PlatformRankChart';

interface HistoryProblem {
  title: string;
  slug: string;
}

interface HistoryItem {
  id: string;
  verdict: string;
  score: number;
  submittedAt: string;
  language?: string;
  code: string;
  complexityEstimate?: string | null;
  problem: HistoryProblem;
}

interface ActivityDay {
  date: string;
  count: number;
}

interface TopicStat {
  topic: string;
  slug: string;
  score: number;
  solved: number;
  total: number;
}

interface BadgeItem {
  id: string;
  badgeType: string;
  awardedAt: string;
}

interface BadgeMeta {
  name: string;
  description: string;
}

interface ProfileDetails {
  avatarUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
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
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [topicStats, setTopicStats] = useState<TopicStat[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [badgeMeta, setBadgeMeta] = useState<Record<string, BadgeMeta>>({});
  const [profileDetails, setProfileDetails] = useState<ProfileDetails | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;

    let alive = true;

    Promise.allSettled([
      api.get('/submissions/user/history'),
      api.get(`/users/${user.id}/activity`),
      api.get(`/users/${user.id}/topic-stats`),
      api.get('/badges/me'),
      api.get('/badges/meta'),
      api.get('/profile/settings'),
    ]).then((results) => {
      if (!alive) return;

      const [historyResult, activityResult, topicResult, badgesResult, metaResult, profileResult] = results;
      setHistory(historyResult.status === 'fulfilled' ? historyResult.value.data || [] : []);
      setActivity(activityResult.status === 'fulfilled' ? activityResult.value.data || [] : []);
      setTopicStats(topicResult.status === 'fulfilled' ? topicResult.value.data || [] : []);
      setBadges(badgesResult.status === 'fulfilled' ? badgesResult.value.data || [] : []);
      setBadgeMeta(metaResult.status === 'fulfilled' ? metaResult.value.data || {} : {});
      setProfileDetails(profileResult.status === 'fulfilled' ? profileResult.value.data : null);
      setLoadingData(false);
    });

    return () => {
      alive = false;
    };
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

  const historyLoading = !!user && (history === null || loadingData);
  const historyItems = history || [];

  const saveProfileDetails = async () => {
    if (!profileDetails) return;
    setSavingProfile(true);
    try {
      const result = await api.put('/profile/settings', profileDetails);
      setProfileDetails(result.data);
      setEditingProfile(false);
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profileDetails) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 1000000) {
      window.alert('Use a JPG, PNG, or WebP image smaller than 1 MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfileDetails({ ...profileDetails, avatarUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };

  if (loading || historyLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10">
        <div className="animate-pulse w-full h-64 bg-white/5 rounded-2xl"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-3xl p-10 max-w-md w-full text-center relative overflow-hidden border border-white/10"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <User size={36} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Login Required</h1>
          <p className="text-slate-400 text-sm mb-8">Please sign in to view your progress, radar analytics, and submission history.</p>
          <Link href="/login">
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold text-white transition">Sign In Now</button>
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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 md:py-8 relative">
      <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6 relative z-10">
        <aside className="xl:sticky xl:top-6 self-start glass rounded-2xl border border-white/5 overflow-hidden bg-[#121317]">
          <div className="p-6 text-center border-b border-white/5">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-orange-400 via-amber-400 to-emerald-400 p-1 shadow-[0_0_24px_rgba(245,158,11,0.2)]">
              {profileDetails?.avatarUrl ? <img src={profileDetails.avatarUrl} alt={`${user.name}'s profile`} className="w-full h-full rounded-full object-cover bg-[#121317]" /> : <div className="w-full h-full rounded-full bg-[#121317] flex items-center justify-center"><span className="text-4xl font-black text-slate-100">{user.name.charAt(0).toUpperCase()}</span></div>}
            </div>
            <h1 className="mt-4 text-xl font-extrabold text-white tracking-wide uppercase">{user.name}</h1>
            <p className="mt-1 text-xs text-blue-400 font-semibold truncate">{user.email}</p>
            <Link href="/problems"><button className="mt-5 w-full rounded-lg bg-white/[0.08] py-2.5 text-sm font-semibold text-orange-400 hover:bg-white/[0.12] transition">Solve a problem</button></Link>
            <div className="mt-4 flex items-center justify-center gap-3 text-slate-500">
              {profileDetails?.githubUrl && <a href={profileDetails.githubUrl} target="_blank" rel="noreferrer" title="GitHub" className="text-xs font-bold hover:text-white">GH</a>}
              {profileDetails?.linkedinUrl && <a href={profileDetails.linkedinUrl} target="_blank" rel="noreferrer" title="LinkedIn" className="text-xs font-bold hover:text-[#60a5fa]">in</a>}
              {(profileDetails?.githubUrl || profileDetails?.linkedinUrl) && <Globe2 size={17} />}
              <button onClick={() => setEditingProfile((current) => !current)} title="Edit profile links" className="hover:text-orange-400"><Pencil size={17} /></button>
            </div>
            {editingProfile && profileDetails && <div className="mt-4 pt-4 border-t border-white/5 text-left space-y-2">
              <label className="block text-[11px] text-slate-400">Profile photo (JPG, PNG, or WebP; max 1 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} className="mt-1.5 block w-full text-xs text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-orange-500/15 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-orange-300 hover:file:bg-orange-500/25" /></label>
              <input value={profileDetails.avatarUrl?.startsWith('data:image/') ? '' : profileDetails.avatarUrl || ''} onChange={(event) => setProfileDetails({ ...profileDetails, avatarUrl: event.target.value })} placeholder="Or paste a photo URL" className="w-full rounded-md bg-black/20 border border-white/10 px-2.5 py-2 text-xs text-white outline-none" />
              <input value={profileDetails.githubUrl || ''} onChange={(event) => setProfileDetails({ ...profileDetails, githubUrl: event.target.value })} placeholder="GitHub profile URL" className="w-full rounded-md bg-black/20 border border-white/10 px-2.5 py-2 text-xs text-white outline-none" />
              <input value={profileDetails.linkedinUrl || ''} onChange={(event) => setProfileDetails({ ...profileDetails, linkedinUrl: event.target.value })} placeholder="LinkedIn profile URL" className="w-full rounded-md bg-black/20 border border-white/10 px-2.5 py-2 text-xs text-white outline-none" />
              <button onClick={saveProfileDetails} disabled={savingProfile} className="w-full rounded-md bg-orange-500/15 py-2 text-xs font-bold text-orange-300 disabled:opacity-60">{savingProfile ? 'Saving…' : 'Save profile'}</button>
            </div>}
          </div>
          <div className="p-3"><PlatformTracker /></div>
        </aside>

        <main className="min-w-0">

      <motion.div 
        variants={containerVariants} initial="hidden" animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5"
      >
        <motion.div variants={itemVariants} className="glass rounded-xl p-5 border border-white/5 bg-[#16171b]">
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

        <motion.div variants={itemVariants} className="glass rounded-xl p-5 border border-white/5 bg-[#16171b]">
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

        <motion.div variants={itemVariants} className="glass rounded-xl p-5 border border-white/5 bg-[#16171b]">
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

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)] gap-5 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl overflow-hidden border border-white/5 bg-[#16171b]"
        >
          <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h2 className="font-bold text-white tracking-wide text-lg flex items-center gap-2">
              <Activity size={18} className="text-indigo-400" /> Activity Heatmap
            </h2>
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500 font-bold">
              Daily solves
            </div>
          </div>
          <div className="p-5 md:p-6 overflow-x-auto">
            <ActivityHeatmap data={activity} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-xl overflow-hidden border border-white/5 bg-[#16171b]"
        >
          <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h2 className="font-bold text-white tracking-wide text-lg flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" /> Badge Gallery
            </h2>
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500 font-bold">
              {badges.length} unlocked
            </div>
          </div>
          <div className="p-5 md:p-6">
            <BadgeGallery badges={badges} badgeMeta={badgeMeta} />
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl overflow-hidden border border-white/5 bg-[#16171b] mb-5"
      >
        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <h2 className="font-bold text-white tracking-wide text-lg flex items-center gap-2">
            <Trophy size={18} className="text-fuchsia-400" /> Topic Mastery
          </h2>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500 font-bold">Weighted radar</div>
        </div>
        <div className="p-5 md:p-6">
          <TopicRadarChart data={topicStats} />
        </div>
      </motion.div>

      <div className="mb-5">
        <PlatformRankChart />
      </div>

        </main>
      </div>
    </div>
  );
}
