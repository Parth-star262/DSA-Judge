'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown, ChevronRight, Circle, Lock, PlayCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Problem {
  id: string; slug: string; title: string; difficulty: string; isPremium: boolean;
}
interface Topic { id: string; name: string; slug: string; order: number; problems: Problem[]; }

const DiffBadge = ({ d }: { d: string }) => {
  const isE = d.toLowerCase() === 'easy';
  const isM = d.toLowerCase() === 'medium';
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border ${isE ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : isM ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
      {d}
    </span>
  );
};

export default function ProblemsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/problems').then(r => {
      setTopics(r.data);
      if (r.data.length > 0) setExpanded(new Set([r.data[0].id]));
    }).finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-400 font-medium tracking-widest text-sm uppercase">Loading Problems...</span>
      </div>
    </div>
  );

  const totalProblems = topics.reduce((acc, t) => acc + t.problems.length, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
          <ShieldCheck size={14} /> Comprehensive DSA Sheet
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
          All Problems
        </h1>
        <p className="text-slate-400 text-lg">{totalProblems} curated problems across {topics.length} core topics.</p>
      </motion.div>

      <div className="flex flex-col gap-5 relative z-10">
        {topics.map((topic, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={topic.id} 
            className="glass rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/20 transition-colors shadow-lg shadow-black/20"
          >
            <button onClick={() => toggle(topic.id)} className="w-full bg-transparent border-none cursor-pointer p-5 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#0f172a] border border-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                  {expanded.has(topic.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
                <span className="font-bold text-lg text-white group-hover:text-indigo-50 transition-colors">{topic.name}</span>
                <span className="bg-slate-800/80 border border-slate-700/50 rounded-full px-3 py-0.5 text-xs font-semibold text-slate-400 group-hover:text-indigo-300">
                  {topic.problems.length}
                </span>
              </div>
            </button>

            <AnimatePresence>
              {expanded.has(topic.id) && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-700/50 bg-black/20"
                >
                  {topic.problems.length === 0 ? (
                    <div className="p-6 text-slate-500 text-sm font-medium">No problems yet in this topic.</div>
                  ) : topic.problems.map((p, idx) => (
                    <Link 
                      href={`/problems/${p.slug}`} 
                      key={p.id} 
                      className={`group flex items-center justify-between p-4 pl-8 md:pl-12 transition-all hover:bg-indigo-500/5 relative overflow-hidden ${idx < topic.problems.length - 1 ? 'border-b border-white/5' : ''}`}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 transform -translate-x-full group-hover:translate-x-0 transition-transform" />
                      
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-slate-600 group-hover:text-indigo-400 transition-colors">
                          <Circle size={14} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono text-xs w-4">{idx + 1}.</span>
                          <span className="text-slate-300 font-semibold text-sm md:text-base group-hover:text-white transition-colors">
                            {p.title}
                          </span>
                          {p.isPremium && !user && <Lock size={14} className="text-amber-500 ml-1" />}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <DiffBadge d={p.difficulty} />
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 hidden sm:flex items-center gap-1 text-sm font-semibold">
                          Solve <PlayCircle size={16} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
