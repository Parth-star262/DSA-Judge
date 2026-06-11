'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Code2, Zap, BarChart3, Lightbulb, BookOpen, ChevronRight, CheckCircle, ArrowRight } from 'lucide-react';

import LiveTheme from '@/components/LiveTheme';

export default function HomePage() {
  const features = [
    { icon: <CheckCircle className="text-emerald-400 group-hover:scale-110 transition-transform" size={28} />, title: 'Real Code Execution', desc: 'Submit code in C++, Java, Python, or JavaScript and get verdicts against hidden test cases.' },
    { icon: <BarChart3 className="text-blue-400 group-hover:scale-110 transition-transform" size={28} />, title: 'Time Complexity Analysis', desc: 'Every submission is analyzed — know if your solution is O(N), O(N log N), or O(N²).' },
    { icon: <Lightbulb className="text-amber-400 group-hover:scale-110 transition-transform" size={28} />, title: '3-Tier Hints', desc: 'Stuck? Get progressively detailed hints — from a nudge to a near-complete approach.' },
    { icon: <BookOpen className="text-purple-400 group-hover:scale-110 transition-transform" size={28} />, title: 'Editorials', desc: 'Full written editorials with optimal code, time/space complexity breakdowns.' },
    { icon: <Zap className="text-orange-400 group-hover:scale-110 transition-transform" size={28} />, title: 'Partial Scoring', desc: 'Get credit for partially correct solutions — see exactly which test cases pass.' },
    { icon: <Code2 className="text-indigo-400 group-hover:scale-110 transition-transform" size={28} />, title: 'Topic-wise Sheets', desc: 'Problems organized by topic — Arrays, DP, Trees, Graphs — just like Striver\'s A2Z sheet.' },
  ];

  const topics = ['Arrays', 'Linked Lists', 'Binary Search', 'Trees', 'DP', 'Graphs', 'Greedy', 'Sorting'];

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <LiveTheme />
      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6 sm:px-12 flex flex-col items-center justify-center text-center pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full py-1.5 px-4 mb-8 text-sm font-medium text-indigo-300 backdrop-blur-md pointer-events-auto"
        >
          <Zap size={14} className="text-indigo-400" /> Free to use · No credit card required
        </motion.div>

        <motion.h1 
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight max-w-5xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Master DSA with <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 animate-gradient">
            Real Code Execution
          </span>
        </motion.h1>

        <motion.p 
          className="text-lg sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed font-light"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Submit code, get instant verdicts, automatic time complexity analysis, 3-tier hints, and comprehensive editorials. Like Striver's — but entirely yours to conquer.
        </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-6 pointer-events-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/problems" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto btn-primary group">
              Start Solving 
              <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <Link href="/leaderboard" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto btn-ghost hover:bg-white/5 border-white/10 hover:border-white/20">
              View Leaderboard
            </button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto btn-ghost hover:bg-white/5 border-white/10 hover:border-white/20">
              Create Account
            </button>
          </Link>
        </motion.div>

        {/* Topic Pills */}
        <motion.div 
          className="flex flex-wrap gap-3 justify-center mt-20 max-w-3xl pointer-events-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {topics.map(topic => (
            <motion.div key={topic} variants={itemVariants}>
              <Link href="/problems" className="block">
                <span className="px-5 py-2.5 rounded-full bg-slate-900/50 border border-slate-700/50 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 backdrop-blur-sm transition-all duration-300 text-sm font-medium hover:bg-slate-800/80 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center gap-1 group">
                  {topic}
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -ml-2 group-hover:ml-0 transition-all duration-300" />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16 text-white">
            Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">level up</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div 
                key={i} 
                className="group relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl md:rounded-3xl blur-xl transition-all duration-500 group-hover:from-indigo-500/20 group-hover:to-purple-500/20 opacity-0 group-hover:opacity-100" />
                <div className="relative glass h-full p-8 rounded-2xl md:rounded-3xl border border-white/5 hover:border-white/10 transition-all duration-300 overflow-hidden">
                  {/* Subtle top glare */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed font-light text-sm sm:text-base">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
