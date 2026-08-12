'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Brain, CheckCircle2, ChevronRight, Code2,
  Loader2, Sparkles, Target, Trophy, User, Zap,
} from 'lucide-react';
import api from '@/lib/api';

const SKILL_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner', desc: '< 50 problems, learning the basics', color: 'emerald' },
  { value: 'INTERMEDIATE', label: 'Intermediate', desc: '50-200 problems, comfortable with most patterns', color: 'indigo' },
  { value: 'ADVANCED', label: 'Advanced', desc: '200+ problems, aiming for FAANG', color: 'fuchsia' },
];

const COMPANIES = ['Google', 'Meta', 'Amazon', 'Microsoft', 'Apple', 'Netflix', 'Uber', 'Airbnb', 'Adobe', 'Flipkart'];

const DIFFICULTIES = [
  { value: 'EASY', label: 'Easy', desc: 'Warm-up problems' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Standard interview difficulty' },
  { value: 'HARD', label: 'Hard', desc: 'FAANG-level challenges' },
  { value: 'MIXED', label: 'Mixed', desc: 'Adaptive — best for most' },
];

const ALL_TOPICS = [
  'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue', 'Hashing',
  'Binary Search', 'Recursion', 'Backtracking', 'Trees', 'BST', 'Heap',
  'Graphs', 'Trie', 'Greedy', 'Dynamic Programming', 'Bit Manipulation',
  'Sliding Window', 'Two Pointers', 'Prefix Sum', 'Segment Tree', 'Disjoint Set Union',
];

const LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'c', 'typescript', 'go', 'rust'];

interface Props {
  onComplete: () => void;
  onSkipToAssessment?: () => void;
}

export default function InterviewOnboarding({ onComplete, onSkipToAssessment }: Props) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [skillLevel, setSkillLevel] = useState('INTERMEDIATE');
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [practiceTopic, setPracticeTopics] = useState<string[]>([]);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [preferredLanguage, setPreferredLanguage] = useState('python');
  const [preferredDifficulty, setPreferredDifficulty] = useState('MIXED');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.post('/coach/profile', {
        skillLevel,
        targetCompanies,
        preferredLanguage,
        preferredDifficulty,
        weakTopics,
        strongTopics: practiceTopic.filter((t) => !weakTopics.includes(t)),
      });
      onComplete();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const stepVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-[#0b1120] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-white/5 bg-gradient-to-r from-fuchsia-500/10 to-indigo-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center">
              <Brain size={20} className="text-fuchsia-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Interview Coach Setup</h2>
              <p className="text-slate-400 text-sm">Personalize your interview preparation</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
                  i < step ? 'bg-fuchsia-500' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">Step {step} of {totalSteps}</p>
        </div>

        {/* Step Content */}
        <div className="p-8 min-h-[320px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <User size={18} className="text-fuchsia-400" /> What's your skill level?
                </h3>
                <p className="text-slate-400 text-sm mb-6">This helps us calibrate interview difficulty to your current level.</p>
                <div className="grid gap-3">
                  {SKILL_LEVELS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSkillLevel(s.value)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                        skillLevel === s.value
                          ? 'border-fuchsia-500/60 bg-fuchsia-500/10'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white">{s.label}</div>
                        <div className="text-sm text-slate-400">{s.desc}</div>
                      </div>
                      {skillLevel === s.value && <CheckCircle2 size={20} className="text-fuchsia-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <Target size={18} className="text-fuchsia-400" /> Target Companies (optional)
                </h3>
                <p className="text-slate-400 text-sm mb-6">Select companies you're targeting. We'll tailor question styles accordingly.</p>
                <div className="flex flex-wrap gap-2">
                  {COMPANIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleItem(targetCompanies, setTargetCompanies, c)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        targetCompanies.includes(c)
                          ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-200'
                          : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      {targetCompanies.includes(c) && '✓ '}{c}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <Zap size={18} className="text-fuchsia-400" /> Topics & Weak Areas
                </h3>
                <p className="text-slate-400 text-sm mb-2">Select topics you want to practice. Then mark which ones feel weak.</p>
                <div className="flex flex-wrap gap-1.5 mb-4 max-h-[180px] overflow-y-auto pr-1">
                  {ALL_TOPICS.map((t) => {
                    const isPractice = practiceTopic.includes(t);
                    const isWeak = weakTopics.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          if (isWeak) {
                            setWeakTopics(weakTopics.filter((x) => x !== t));
                            setPracticeTopics(practiceTopic.filter((x) => x !== t));
                          } else if (isPractice) {
                            setWeakTopics([...weakTopics, t]);
                          } else {
                            setPracticeTopics([...practiceTopic, t]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isWeak
                            ? 'bg-red-500/20 border-red-500/40 text-red-200'
                            : isPractice
                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200'
                            : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06]'
                        }`}
                      >
                        {isWeak ? '⚠ ' : isPractice ? '✓ ' : ''}{t}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-white/10" /> Tap once = practice</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500/40" /> Tap again = practice (selected)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500/40" /> Tap again = weak area</span>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <Code2 size={18} className="text-fuchsia-400" /> Language & Difficulty
                </h3>
                <p className="text-slate-400 text-sm mb-6">Set your preferred coding language and interview difficulty.</p>

                <div className="mb-6">
                  <label className="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">Preferred Language</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setPreferredLanguage(lang)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border capitalize transition-all ${
                          preferredLanguage === lang
                            ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-200'
                            : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">Interview Difficulty</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setPreferredDifficulty(d.value)}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          preferredDifficulty === d.value
                            ? 'border-fuchsia-500/60 bg-fuchsia-500/10'
                            : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="font-semibold text-sm text-white">{d.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{d.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex items-center justify-between gap-4">
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/[0.05] transition-colors"
              >
                Back
              </button>
            )}
            {onSkipToAssessment && step === 1 && (
              <button
                onClick={onSkipToAssessment}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/[0.04] transition-colors flex items-center gap-2"
              >
                <Sparkles size={14} /> Take quick assessment instead
              </button>
            )}
          </div>

          {error && <p className="text-red-400 text-xs flex-1 text-center">{error}</p>}

          {step < totalSteps ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white font-semibold text-sm shadow-[0_0_20px_rgba(217,70,239,0.3)]"
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white font-semibold text-sm shadow-[0_0_20px_rgba(217,70,239,0.3)] disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Trophy size={16} />}
              Start Coaching
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
