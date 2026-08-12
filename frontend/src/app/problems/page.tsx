'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChevronDown, ChevronRight, Circle, Lock, PlayCircle, ShieldCheck,
  Search, CheckCircle2, Filter, Sparkles, BookOpen, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonProblemList } from '@/components/SkeletonLoader';

interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  isPremium: boolean;
}

interface Topic {
  id: string;
  name: string;
  slug: string;
  order: number;
  problems: Problem[];
}

const DiffBadge = ({ d }: { d: string }) => {
  const diff = d.toLowerCase();
  const isE = diff === 'easy';
  const isM = diff === 'medium';
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide uppercase border ${
        isE
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/10'
          : isM
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-sm shadow-amber-500/10'
          : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-sm shadow-rose-500/10'
      }`}
    >
      {d}
    </span>
  );
};

export default function ProblemsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const { user } = useAuth();

  useEffect(() => {
    api
      .get('/problems')
      .then((r) => {
        setTopics(r.data);
        if (r.data.length > 0) setExpanded(new Set([r.data[0].id]));
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleTopic = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpanded(new Set(topics.map((t) => t.id)));
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  // Filter topics and problems based on search & difficulty filter
  const filteredTopics = useMemo(() => {
    return topics
      .map((topic) => {
        const filteredProblems = topic.problems.filter((p) => {
          const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.slug.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesDiff = selectedDifficulty === 'ALL' || p.difficulty.toUpperCase() === selectedDifficulty;
          return matchesSearch && matchesDiff;
        });
        return { ...topic, problems: filteredProblems };
      })
      .filter((topic) => topic.problems.length > 0);
  }, [topics, searchQuery, selectedDifficulty]);

  const totalProblems = useMemo(() => topics.reduce((acc, t) => acc + t.problems.length, 0), [topics]);
  const filteredTotal = useMemo(() => filteredTopics.reduce((acc, t) => acc + t.problems.length, 0), [filteredTopics]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8 flex flex-col gap-3">
          <div className="w-36 h-6 skeleton rounded-full" />
          <div className="w-64 h-10 skeleton rounded-xl" />
        </div>
        <SkeletonProblemList />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16 relative">
      {/* Ambient background glows */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-extrabold uppercase tracking-widest mb-3">
          <ShieldCheck size={14} /> Striver's A2Z DSA Sheet Aligned
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-3 font-['Outfit']">
          Curated DSA Problems
        </h1>
        <p className="text-slate-400 text-base sm:text-lg">
          Master data structures topic-by-topic. Solve {totalProblems} core problems with sub-second judge execution.
        </p>
      </motion.div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between relative z-10 shadow-xl">
        {/* Search Bar Input */}
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problem title or slug..."
            className="w-full bg-[#0a0c20] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
          />
        </div>

        {/* Difficulty Filter Tabs */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 bg-[#0a0c20] p-1 rounded-xl border border-white/10">
            {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDifficulty === diff
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Expand/Collapse Buttons */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={expandAll}
              className="text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Results Count Banner */}
      {(searchQuery || selectedDifficulty !== 'ALL') && (
        <div className="mb-6 text-sm text-slate-400 font-medium flex items-center justify-between">
          <span>
            Showing <strong className="text-indigo-300">{filteredTotal}</strong> matching problem{filteredTotal !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDifficulty('ALL');
            }}
            className="text-xs text-indigo-400 hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Topics Accordion List */}
      <div className="flex flex-col gap-4 relative z-10">
        {filteredTopics.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center border border-white/10">
            <BookOpen size={40} className="mx-auto text-slate-500 mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-white mb-1">No matching problems found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your search criteria or difficulty filter.</p>
          </div>
        ) : (
          filteredTopics.map((topic, i) => {
            const isExpanded = expanded.has(topic.id);
            const easyCount = topic.problems.filter((p) => p.difficulty === 'EASY').length;
            const medCount = topic.problems.filter((p) => p.difficulty === 'MEDIUM').length;
            const hardCount = topic.problems.filter((p) => p.difficulty === 'HARD').length;

            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                key={topic.id}
                className="glass-panel rounded-2xl overflow-hidden border border-white/10 hover:border-indigo-500/30 transition-all shadow-lg"
              >
                {/* Topic Accordion Header */}
                <button
                  onClick={() => toggleTopic(topic.id)}
                  className="w-full bg-transparent border-none cursor-pointer p-5 flex items-center justify-between group hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-lg text-white group-hover:text-indigo-200 transition-colors block">
                        {topic.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-medium">
                        <span className="text-emerald-400">{easyCount} Easy</span> •{' '}
                        <span className="text-amber-400">{medCount} Med</span> •{' '}
                        <span className="text-rose-400">{hardCount} Hard</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="bg-slate-800/80 border border-slate-700/50 rounded-full px-3 py-1 text-xs font-bold text-slate-300">
                      {topic.problems.length} Problem{topic.problems.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>

                {/* Problem Items List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-white/5 bg-[#050616]/60"
                    >
                      {topic.problems.length === 0 ? (
                        <div className="p-6 text-slate-500 text-sm font-medium text-center">
                          No problems available under this criteria.
                        </div>
                      ) : (
                        topic.problems.map((p, idx) => (
                          <Link
                            href={`/problems/${p.slug}`}
                            key={p.id}
                            className={`group flex items-center justify-between p-4 pl-6 md:pl-10 transition-all hover:bg-indigo-500/10 relative ${
                              idx < topic.problems.length - 1 ? 'border-b border-white/5' : ''
                            }`}
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 transform -translate-x-full group-hover:translate-x-0 transition-transform" />

                            <div className="flex items-center gap-4 flex-1">
                              <div className="text-slate-600 group-hover:text-indigo-400 transition-colors">
                                <Circle size={15} />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-mono text-xs w-6">{idx + 1}.</span>
                                <span className="text-slate-200 font-semibold text-sm md:text-base group-hover:text-white group-hover:translate-x-1 transition-all">
                                  {p.title}
                                </span>
                                {p.isPremium && !user && <Lock size={14} className="text-amber-400 ml-1" />}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <DiffBadge d={p.difficulty} />
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 hidden sm:flex items-center gap-1 text-xs font-bold bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                                Solve <PlayCircle size={14} />
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
