'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Zap, BarChart3, Lightbulb, BookOpen, ChevronRight, CheckCircle2,
  ArrowRight, Sparkles, Terminal, Cpu, ShieldCheck, Play, Layers, Flame, Trophy,
  Bot, RefreshCw
} from 'lucide-react';

import LiveTheme from '@/components/LiveTheme';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'judge' | 'interview' | 'ai' | 'analytics'>('judge');
  const [demoLang, setDemoLang] = useState<'cpp' | 'python' | 'java'>('cpp');
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoPassed, setDemoPassed] = useState(true);

  const demoCodes = {
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> mp;\n        for (int i = 0; i < nums.size(); i++) {\n            int diff = target - nums[i];\n            if (mp.count(diff)) return {mp[diff], i};\n            mp[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
    python: `def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []`,
    java: `import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (map.containsKey(diff)) return new int[]{map.get(diff), i};\n            map.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}`
  };

  const handleRunDemo = () => {
    setDemoRunning(true);
    setTimeout(() => {
      setDemoRunning(false);
      setDemoPassed(true);
    }, 1200);
  };

  const metrics = [
    { label: 'Curated Problems', val: '250+', sub: 'Striver A2Z aligned' },
    { label: 'Execution Runtimes', val: '4 Languages', sub: 'C++, Java, Python, JS' },
    { label: 'Judge Latency', val: '< 200ms', sub: 'Isolated sandbox runner' },
    { label: 'AI Assistance', val: '24/7 Coach', sub: 'Gemini 1.5 Powered' },
  ];

  const features = [
    {
      id: 'judge',
      title: 'Real Code Execution Engine',
      subtitle: 'Native compilation & multi-test evaluation',
      desc: 'Submit solution code across C++, Java, Python, or JS. Your code is executed against strict test cases with sub-second feedback, memory limits, and execution timers.',
      icon: Terminal,
      badge: 'Isolated Runner',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'interview',
      title: 'AI Mock Technical Interviewer',
      subtitle: 'Simulate high-stakes coding interviews',
      desc: 'Practice technical interviews with an AI coach that asks clarifying questions, probes edge cases, evaluates time complexity, and gives detailed scorecard feedback.',
      icon: Bot,
      badge: 'Interactive Audio/Text',
      color: 'from-indigo-500 to-purple-600'
    },
    {
      id: 'ai',
      title: '3-Tier Hints & AI Code Review',
      subtitle: 'Never stay stuck on a problem',
      desc: 'Get progressive hint nudges without giving away full solutions. Analyze your time/space complexity O(N) automatically and receive AI refactoring tips.',
      icon: Sparkles,
      badge: 'Smart Assistance',
      color: 'from-amber-500 to-orange-600'
    },
    {
      id: 'analytics',
      title: 'Radar Charts & Activity Heatmaps',
      subtitle: 'Comprehensive skill tracking',
      desc: 'Track topic mastery across Arrays, DP, Graphs, and Trees. View your submission streak, external platform ranks (LeetCode/GFG), and badge accomplishments.',
      icon: BarChart3,
      badge: 'Visual Insights',
      color: 'from-pink-500 to-rose-600'
    }
  ];

  const topics = ['Arrays', 'Strings', 'Binary Search', 'Linked Lists', 'Trees & BST', 'Graphs', 'Dynamic Programming', 'Heaps & Tries'];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#030014] text-white selection:bg-purple-500/30 selection:text-white">
      <LiveTheme />

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
        {/* Floating Announcement Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/30 rounded-full py-2 px-5 mb-8 text-xs sm:text-sm font-semibold text-indigo-300 backdrop-blur-xl shadow-lg shadow-indigo-500/10"
        >
          <Sparkles size={16} className="text-indigo-400 animate-pulse" />
          <span>Production-Ready Online Judge & AI Technical Coach</span>
          <span className="bg-indigo-500/20 text-indigo-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">v2.0</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] max-w-5xl font-['Outfit']"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Crack Your Technical Interviews With <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Real Code Execution & AI Coaching
          </span>
        </motion.h1>

        {/* Hero Description */}
        <motion.p
          className="text-base sm:text-xl text-slate-400 max-w-3xl mb-10 leading-relaxed font-light"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Engineered for developers mastering Data Structures & Algorithms. Run C++, Java, Python, and JavaScript against hidden test suites, receive progressive AI hints, and practice live mock technical interviews.
        </motion.p>

        {/* Hero CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/problems">
            <button className="w-full sm:w-auto btn-primary py-3.5 px-8 text-base font-bold shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 cursor-pointer">
              <span>Start Solving Problems</span>
              <ChevronRight size={18} />
            </button>
          </Link>

          <Link href="/interview">
            <button className="w-full sm:w-auto btn-ghost py-3.5 px-8 text-base font-semibold border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 cursor-pointer">
              <Bot size={18} className="text-indigo-400" />
              <span>Practice AI Mock Interview</span>
            </button>
          </Link>
        </motion.div>

        {/* Interactive Judge Terminal Hero Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full max-w-4xl glass-panel rounded-2xl md:rounded-3xl border border-white/10 p-4 sm:p-6 text-left shadow-2xl shadow-indigo-950/60 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          
          {/* Terminal Top Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Terminal size={14} className="text-indigo-400" /> dsa-judge-sandbox // two-sum.cpp
              </span>
            </div>

            <div className="flex items-center gap-2">
              {(['cpp', 'python', 'java'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setDemoLang(lang)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    demoLang === lang
                      ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}

              <button
                onClick={handleRunDemo}
                disabled={demoRunning}
                className="ml-2 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/30 transition-all cursor-pointer"
              >
                {demoRunning ? (
                  <RefreshCw size={12} className="animate-spin text-emerald-400" />
                ) : (
                  <Play size={12} className="fill-current text-emerald-400" />
                )}
                {demoRunning ? 'Evaluating...' : 'Run Test Suite'}
              </button>
            </div>
          </div>

          {/* Terminal Code Display */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
            <div className="bg-[#070818] p-4 rounded-xl border border-white/5 font-mono text-xs sm:text-sm text-slate-300 overflow-x-auto leading-relaxed max-h-[220px]">
              <pre>{demoCodes[demoLang]}</pre>
            </div>

            {/* Simulated Execution Result */}
            <div className="bg-[#070818] p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Verdict</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-extrabold border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={12} /> ACCEPTED
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-white/5 text-slate-400">
                    <span>Test Cases:</span>
                    <span className="text-emerald-400 font-bold">15 / 15 Passed</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5 text-slate-400">
                    <span>Execution Time:</span>
                    <span className="text-slate-200">12 ms</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5 text-slate-400">
                    <span>Time Complexity:</span>
                    <span className="text-purple-300 font-bold">O(N)</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-400">
                    <span>Space Complexity:</span>
                    <span className="text-indigo-300 font-bold">O(N)</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-indigo-300">
                  <Sparkles size={12} /> AI Verified Solution
                </span>
                <span className="text-emerald-400 font-bold">Score: 100/100</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Metrics Bar Section */}
      <section className="border-y border-white/10 bg-[#07081a]/60 backdrop-blur-xl py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {metrics.map((m, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 font-['Outfit']">
                {m.val}
              </span>
              <span className="text-sm font-semibold text-slate-200 mt-1">{m.label}</span>
              <span className="text-xs text-slate-400">{m.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Matrix Showcase Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="text-center mb-16">
          <span className="px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-widest">
            Complete Toolkit
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-4 tracking-tight">
            Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Technical Excellence</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mt-3">
            Every feature is designed to sharpen your problem-solving workflow and prepare you for real tech interviews.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className="glass-panel p-8 rounded-3xl border border-white/10 hover:border-indigo-500/30 relative overflow-hidden flex flex-col justify-between group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.color} p-[1px] shadow-lg`}>
                      <div className="w-full h-full bg-[#0a0b1e] rounded-[15px] flex items-center justify-center">
                        <Icon size={26} className="text-white" />
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">{feat.title}</h3>
                  <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">{feat.subtitle}</div>
                  <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{feat.desc}</p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                  <Link href="/problems" className="text-sm font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                    Explore Feature <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Recruiter & System Architecture Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a0c24] to-[#040514]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 pb-8 border-b border-white/10">
            <div>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-widest">
                System Design & Stack
              </span>
              <h3 className="text-3xl font-extrabold text-white mt-3">Architected Like Commercial SaaS</h3>
              <p className="text-slate-400 text-sm sm:text-base mt-1 max-w-xl">
                Built with full-stack TypeScript, asynchronous judge streaming, isolated code execution containers, and Google Gemini AI models.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {['Next.js 16', 'TypeScript', 'Tailwind v4', 'Prisma ORM', 'Express.js', 'SSE Streaming', 'Gemini AI'].map((tech) => (
                <span key={tech} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs font-mono font-semibold">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Pipeline Visual Flow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            {[
              { step: '01', title: 'Code Editor', desc: 'Monaco Editor with multi-language starter templates & linting' },
              { step: '02', title: 'SSE Gateway', desc: 'Asynchronous streaming protocol delivering instant verdicts' },
              { step: '03', title: 'Judge Engine', desc: 'Isolated runtime evaluating hidden test cases & time complexity' },
              { step: '04', title: 'AI Assistant', desc: 'Gemini 1.5 Flash generating code reviews, hints & interview feedback' },
            ].map((p, i) => (
              <div key={i} className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 flex flex-col items-center">
                <span className="text-xs font-mono font-bold text-indigo-400 mb-2">{p.step}.</span>
                <span className="text-base font-bold text-white mb-1">{p.title}</span>
                <span className="text-xs text-slate-400 leading-relaxed">{p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center relative z-10">
        <div className="glass-panel p-10 sm:p-16 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-pink-900/30 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Ready to Level Up Your Coding Credentials?
          </h2>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Join hundreds of developers solving curated DSA problems, tracking topic mastery, and mastering AI-assisted interviews today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/problems">
              <button className="btn-primary py-3.5 px-8 text-base font-bold shadow-xl shadow-indigo-500/40 cursor-pointer">
                Explore Problems Sheet
              </button>
            </Link>
            <Link href="/register">
              <button className="btn-ghost py-3.5 px-8 text-base font-semibold border-white/20 hover:bg-white/10 cursor-pointer">
                Create Free Account
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#02030d] py-10 px-6 relative z-10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Code2 size={18} className="text-indigo-400" />
            <span className="font-bold text-slate-300 text-sm">DSA-Judge</span>
            <span>— Advanced Code Judge & AI Interview Coach</span>
          </div>
          <div>
            <span>Built with Next.js 16, TypeScript & Google Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
