'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, Bot, Brain, CalendarDays, CheckCircle2, ChevronDown, ChevronUp,
  Clock3, Code2, ExternalLink, Lightbulb, Loader2, MessageSquare, PlayCircle,
  RefreshCcw, Send, Sparkles, SquarePen, Star, Trophy, User, Zap,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import InterviewOnboarding from '@/components/InterviewOnboarding';

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'system' | 'assistant' | 'user';
type InterviewMode = 'standard' | 'topic-focus' | 'theory' | 'code-review';

interface InterviewMessage { role: Role; content: string; }

interface QuestionResult {
  id: string; score: number; strengths: string[]; mistakes: string[];
  betterApproach: string; interviewerFeedback: string; conceptsToRevise: string[];
  topic: string; timeTakenSeconds: number;
}

interface SessionDetail {
  id: string; userId: string; score: number | null; feedback: string | null;
  difficulty: string; mode: string; topicsCovered: string[];
  durationSeconds: number; reportGenerated: boolean;
  messages: InterviewMessage[]; questionResults: QuestionResult[];
  createdAt: string; updatedAt: string;
}

interface SessionSummary {
  id: string; score: number | null; feedback: string | null; difficulty: string;
  mode: string; topicsCovered: string[]; durationSeconds: number;
  reportGenerated: boolean; createdAt: string; updatedAt: string;
  _count: { questionResults: number };
}

interface Profile {
  skillLevel: string; preferredLanguage: string; preferredDifficulty: string;
  weakTopics: string[]; strongTopics: string[]; totalSessions: number; avgScore: number;
}

const ALL_TOPICS = [
  'Arrays','Strings','Linked List','Stack','Queue','Hashing','Binary Search',
  'Recursion','Backtracking','Trees','BST','Heap','Graphs','Trie','Greedy',
  'Dynamic Programming','Bit Manipulation','Sliding Window','Two Pointers',
  'Prefix Sum','Segment Tree','Disjoint Set Union',
];

const toDisplayTime = (v: string) =>
  new Date(v).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const formatDuration = (s: number) => {
  const m = Math.floor(s / 60); const sec = s % 60;
  return `${m}m ${sec}s`;
};

// ─── Score Card Component ──────────────────────────────────────────────────────
function ScoreCard({ result }: { result: QuestionResult }) {
  const [open, setOpen] = useState(false);
  const color = result.score >= 7 ? 'emerald' : result.score >= 5 ? 'amber' : 'red';
  return (
    <div className={`rounded-2xl border p-4 bg-${color}-500/5 border-${color}-500/20`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`text-2xl font-bold text-${color}-300`}>{result.score}/10</div>
          <div>
            <div className="text-sm font-semibold text-white">{result.topic}</div>
            <div className="text-xs text-slate-400">{formatDuration(result.timeTakenSeconds)} • Click to expand</div>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pt-4 space-y-3 border-t border-white/5 mt-4">
              {result.strengths.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Strengths</div>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => <li key={i} className="text-sm text-slate-300 flex items-start gap-2"><CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />{s}</li>)}
                  </ul>
                </div>
              )}
              {result.mistakes.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Mistakes</div>
                  <ul className="space-y-1">
                    {result.mistakes.map((m, i) => <li key={i} className="text-sm text-slate-300 flex items-start gap-2"><AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />{m}</li>)}
                  </ul>
                </div>
              )}
              {result.betterApproach && (
                <div>
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Better Approach</div>
                  <p className="text-sm text-slate-300 leading-6">{result.betterApproach}</p>
                </div>
              )}
              {result.interviewerFeedback && (
                <div>
                  <div className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest mb-1">Interviewer Feedback</div>
                  <p className="text-sm text-slate-300 leading-6">{result.interviewerFeedback}</p>
                </div>
              )}
              {result.conceptsToRevise.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Revise</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.conceptsToRevise.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Hint Panel Component ──────────────────────────────────────────────────────
function HintPanel({ sessionId, disabled }: { sessionId: string; disabled: boolean }) {
  const [hintLevel, setHintLevel] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const requestHint = async () => {
    if (loading || hintLevel >= 3) return;
    setLoading(true);
    try {
      const nextLevel = hintLevel + 1;
      const res = await api.post(`/coach/session/${sessionId}/hint`, { hintLevel: nextLevel });
      setHint(res.data.hint);
      setHintLevel(nextLevel);
      setOpen(true);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
          <Lightbulb size={15} /> Hints ({hintLevel}/3)
        </div>
        <div className="flex gap-2">
          {hint && (
            <button onClick={() => setOpen(!open)} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
              {open ? 'Hide' : 'Show'}
            </button>
          )}
          <button
            onClick={requestHint}
            disabled={disabled || loading || hintLevel >= 3}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-medium disabled:opacity-40 hover:bg-amber-500/30 transition-colors"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : hintLevel >= 3 ? 'Max hints' : `Hint ${hintLevel + 1}`}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && hint && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4">
              <div className="text-sm text-amber-100/80 leading-6 whitespace-pre-wrap border-t border-amber-500/10 pt-3">{hint}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Timer Hook ───────────────────────────────────────────────────────────────
function useTimer(startedAt: string | null, stopped: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt || stopped) return;
    const base = Date.now() - new Date(startedAt).getTime();
    setElapsed(Math.floor(base / 1000));
    const id = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(id);
  }, [startedAt, stopped]);
  return elapsed;
}

// ─── Main Interview Page ───────────────────────────────────────────────────────
export default function InterviewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<SessionDetail | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [mode, setMode] = useState<InterviewMode>('standard');
  const [topicFocus, setTopicFocus] = useState('');
  const [problemSlug, setProblemSlug] = useState('');
  const [input, setInput] = useState('');
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // For per-question scoring
  const [questionToScore, setQuestionToScore] = useState<string | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState<string | null>(null);
  const [questionTopic, setQuestionTopic] = useState('General');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const elapsed = useTimer(currentSession?.createdAt || null, Boolean(currentSession?.reportGenerated));

  const activeTranscript = useMemo(() =>
    currentSession?.messages?.filter((m) => m.role !== 'system') || [],
    [currentSession]
  );

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [activeTranscript.length, scrollToBottom]);

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.get('/coach/profile');
      setProfile(res.data);
      if (!res.data) setShowOnboarding(true);
    } catch { setShowOnboarding(true); } finally { setProfileLoading(false); }
  }, []);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get('/coach/sessions');
      setSessions(res.data || []);
    } catch { /* silent */ } finally { setSessionsLoading(false); }
  }, []);

  const loadSession = useCallback(async (id: string, silent = false) => {
    try {
      const res = await api.get(`/coach/session/${id}`);
      setCurrentSession(res.data);
      setSelectedSessionId(id);
      localStorage.setItem('coach-session-id', id);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404 || status === 403) {
        localStorage.removeItem('coach-session-id');
        setCurrentSession(null); setSelectedSessionId(null);
        return;
      }
      if (!silent) setPageError(err?.response?.data?.error || 'Failed to load session.');
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadProfile();
    loadSessions();
    const saved = localStorage.getItem('coach-session-id');
    if (saved) loadSession(saved, true).catch(() => undefined);
  }, [user, loadProfile, loadSessions, loadSession]);

  useEffect(() => {
    if (!user && !authLoading) router.replace('/login');
  }, [authLoading, router, user]);

  const startInterview = async () => {
    if (starting) return;
    setStarting(true); setPageError(null);
    try {
      const payload: Record<string, string> = { mode };
      if (problemSlug.trim()) payload.problemSlug = problemSlug.trim();
      if (mode === 'topic-focus' && topicFocus) payload.topicFocus = topicFocus;
      const res = await api.post('/coach/session/start', payload);
      const sessionId = res.data.sessionId as string;
      setCurrentSession({
        id: sessionId, userId: user!.id, score: null, feedback: null,
        difficulty: res.data.difficulty, mode: res.data.mode, topicsCovered: [],
        durationSeconds: 0, reportGenerated: false,
        messages: [{ role: 'assistant', content: res.data.message }],
        questionResults: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      setSelectedSessionId(sessionId);
      localStorage.setItem('coach-session-id', sessionId);
      setInput('');
      setQuestionToScore(activeTranscript.length > 0 ? activeTranscript[activeTranscript.length - 1].content : null);
      setQuestionStartedAt(new Date().toISOString());
      await loadSessions();
    } catch (err: any) {
      setPageError(err?.response?.data?.error || 'Failed to start interview session.');
    } finally { setStarting(false); }
  };

  const sendMessage = async () => {
    if (!currentSession || sending || ending || !input.trim() || currentSession.reportGenerated) return;
    const message = input.trim(); setInput(''); setSending(true);
    setCurrentSession((prev) => prev ? { ...prev, messages: [...prev.messages, { role: 'user', content: message }] } : prev);
    try {
      const res = await api.post(`/coach/session/${currentSession.id}/message`, { message });
      setCurrentSession((prev) => prev ? {
        ...prev,
        messages: [...prev.messages, { role: 'assistant', content: res.data.message }],
        updatedAt: new Date().toISOString(),
      } : prev);
      // Track the latest interviewer question for scoring
      setQuestionToScore(res.data.message);
      setQuestionStartedAt(new Date().toISOString());
    } catch (err: any) {
      setPageError(err?.response?.data?.error || 'Failed to send message.');
      setCurrentSession((prev) => prev ? { ...prev, messages: prev.messages.slice(0, -1) } : prev);
    } finally { setSending(false); }
  };

  const scoreAnswer = async () => {
    if (!currentSession || scoring || !questionToScore || !input.trim()) return;
    setScoring(true);
    try {
      const res = await api.post(`/coach/session/${currentSession.id}/score-question`, {
        questionText: questionToScore,
        userAnswer: input,
        topic: questionTopic || mode === 'topic-focus' ? topicFocus : 'General',
        startedAt: questionStartedAt,
      });
      setCurrentSession((prev) => prev ? {
        ...prev,
        questionResults: [...(prev.questionResults || []), res.data],
      } : prev);
    } catch { /* silent */ } finally { setScoring(false); }
  };

  const endInterview = async () => {
    if (!currentSession || ending || currentSession.reportGenerated) return;
    setEnding(true); setPageError(null);
    try {
      const res = await api.post(`/coach/session/${currentSession.id}/end`);
      setCurrentSession((prev) => prev ? {
        ...prev, score: res.data.score, feedback: res.data.feedback,
        reportGenerated: true, durationSeconds: res.data.durationSeconds,
        updatedAt: new Date().toISOString(),
      } : prev);
      await loadSessions();
      await loadProfile();
    } catch (err: any) {
      setPageError(err?.response?.data?.error || 'Failed to end interview session.');
    } finally { setEnding(false); }
  };

  // Loading / auth gates
  if (authLoading || profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" />
          <span className="text-slate-400 font-medium tracking-widest text-sm uppercase">Loading...</span>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const modeOptions: { value: InterviewMode; label: string; icon: React.ReactNode }[] = [
    { value: 'standard', label: 'Standard', icon: <Brain size={14} /> },
    { value: 'topic-focus', label: 'Topic Focus', icon: <Zap size={14} /> },
    { value: 'theory', label: 'Theory', icon: <Sparkles size={14} /> },
    { value: 'code-review', label: 'Code Review', icon: <Code2 size={14} /> },
  ];

  return (
    <>
      {/* Onboarding modal */}
      {showOnboarding && (
        <InterviewOnboarding
          onComplete={() => { setShowOnboarding(false); loadProfile(); }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 relative">
        {/* Background glows */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-fuchsia-500/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-96 h-96 bg-indigo-500/8 rounded-full blur-[150px] pointer-events-none" />

        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 text-xs font-bold uppercase tracking-[0.24em] mb-4">
                <Brain size={14} /> AI Interview Coach
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
                Practice the interview,<br className="hidden md:block" /> not just the solution
              </h1>
              <p className="text-slate-400 max-w-2xl">
                Personalized mock interviews with adaptive difficulty, progressive hints, per-question scoring, and a detailed session report.
              </p>
            </div>

            {/* Profile Summary */}
            {profile && (
              <div className="glass rounded-2xl border border-white/10 p-4 min-w-[220px] shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Your Profile</span>
                  <button onClick={() => setShowOnboarding(true)} className="text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors">Edit</button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Skill</span><span className="text-white font-medium capitalize">{profile.skillLevel?.toLowerCase()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Language</span><span className="text-white font-medium capitalize">{profile.preferredLanguage}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Sessions</span><span className="text-white font-medium">{profile.totalSessions}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Avg Score</span><span className="text-white font-medium">{profile.avgScore > 0 ? `${profile.avgScore}/10` : 'N/A'}</span></div>
                  {profile.weakTopics?.length > 0 && (
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Weak areas</div>
                      <div className="flex flex-wrap gap-1">
                        {profile.weakTopics.slice(0, 4).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/20 text-red-300 text-xs">{t}</span>
                        ))}
                        {profile.weakTopics.length > 4 && <span className="text-slate-500 text-xs">+{profile.weakTopics.length - 4}</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Bar */}
        <div className="relative z-10 mb-6 flex flex-wrap gap-3 items-center">
          {/* Mode Selector */}
          <div className="flex bg-white/[0.03] border border-white/10 rounded-xl p-1 gap-1">
            {modeOptions.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  mode === m.value ? 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {mode === 'topic-focus' && (
            <select
              value={topicFocus}
              onChange={(e) => setTopicFocus(e.target.value)}
              className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-slate-100 outline-none focus:border-fuchsia-500/50"
            >
              <option value="">Select topic...</option>
              {ALL_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}

          <input
            value={problemSlug}
            onChange={(e) => setProblemSlug(e.target.value)}
            placeholder="Problem slug (optional)"
            className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-fuchsia-500/50 w-44"
          />

          <div className="flex gap-2 ml-auto">
            <button
              onClick={startInterview}
              disabled={starting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white font-semibold shadow-[0_0_20px_rgba(217,70,239,0.25)] disabled:opacity-60"
            >
              {starting ? <Loader2 size={15} className="animate-spin" /> : <PlayCircle size={15} />}
              Start New
            </button>
            <button
              onClick={endInterview}
              disabled={!currentSession || ending || Boolean(currentSession?.reportGenerated)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-semibold hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {ending ? <Loader2 size={15} className="animate-spin" /> : <SquarePen size={15} />}
              End Session
            </button>
          </div>
        </div>

        {pageError && (
          <div className="relative z-10 mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-200 text-sm flex items-center gap-2">
            <AlertCircle size={15} /> {pageError}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_0.9fr] gap-6 relative z-10">
          {/* LEFT: Chat Panel */}
          <div className="flex flex-col gap-4">
            <motion.section
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="glass rounded-3xl border border-white/10 overflow-hidden shadow-xl shadow-black/30"
            >
              {/* Session Header */}
              <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <MessageSquare size={17} className="text-fuchsia-400" />
                  <div>
                    <div className="font-bold text-white text-base">
                      {currentSession ? `Live Session` : 'No Active Session'}
                    </div>
                    {currentSession && (
                      <div className="text-xs text-slate-500 flex items-center gap-3">
                        <span className="capitalize">{currentSession.mode} • {currentSession.difficulty}</span>
                        {currentSession.topicsCovered.length > 0 && (
                          <span>{currentSession.topicsCovered.join(', ')}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {currentSession && !currentSession.reportGenerated && (
                  <div className="flex items-center gap-1.5 text-sm font-mono text-slate-300 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5">
                    <Clock3 size={13} className="text-fuchsia-400" />
                    {Math.floor(elapsed / 60).toString().padStart(2, '0')}:{(elapsed % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>

              {/* Chat Messages */}
              <div className="h-[54vh] overflow-y-auto p-4 md:p-5 space-y-4 bg-[#070b17]">
                {!currentSession ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-4">
                      <Bot size={30} className="text-fuchsia-300" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Start a mock interview</h3>
                    <p className="text-slate-400 max-w-md mb-6 text-sm">
                      Choose a mode, optionally focus on a topic, and click "Start New" to begin your personalized coaching session.
                    </p>
                    <button onClick={startInterview} disabled={starting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white font-semibold">
                      {starting ? <Loader2 size={15} className="animate-spin" /> : <PlayCircle size={15} />} Start Interview
                    </button>
                  </div>
                ) : activeTranscript.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-slate-500 text-sm">Starting session...</div>
                ) : (
                  <>
                    {activeTranscript.map((msg, idx) => {
                      const isBot = msg.role === 'assistant';
                      return (
                        <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className={`rounded-2xl border p-4 md:p-5 ${isBot ? 'bg-white/[0.03] border-white/8 text-slate-100' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-50'}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-[0.2em] ${isBot ? 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25' : 'bg-indigo-500/15 text-indigo-200 border-indigo-500/25'}`}>
                              {isBot ? <Bot size={11} /> : <User size={11} />}
                              {isBot ? 'Interviewer' : 'You'}
                            </div>
                            <span className="text-xs text-slate-600">Turn {Math.ceil((idx + 1) / 2)}</span>
                          </div>
                          <p className="whitespace-pre-wrap leading-7 text-[14.5px]">{msg.content}</p>
                        </motion.div>
                      );
                    })}

                    {/* Thinking indicator */}
                    {(sending || starting) && (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <Bot size={16} className="text-fuchsia-400 animate-pulse" />
                        <div className="flex gap-1">
                          {[0,1,2].map((i) => <div key={i} className="w-2 h-2 rounded-full bg-fuchsia-400/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                        </div>
                        <span className="text-slate-500 text-sm">Interviewer is thinking...</span>
                      </div>
                    )}

                    {/* Score Cards */}
                    {currentSession.questionResults && currentSession.questionResults.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs uppercase tracking-widest text-slate-500 font-bold px-1">Question Scores</div>
                        {currentSession.questionResults.map((r, i) => <ScoreCard key={r.id || i} result={r} />)}
                      </div>
                    )}

                    {/* Final Report */}
                    {currentSession.feedback && (
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-5"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-emerald-300 font-bold uppercase tracking-[0.22em] text-xs">
                            <Trophy size={14} /> Session Report
                          </div>
                          <Link href={`/interview/${currentSession.id}/report`}
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200 border border-emerald-500/20 rounded-lg px-2.5 py-1.5 hover:bg-emerald-500/10 transition-colors">
                            <ExternalLink size={11} /> Full Report
                          </Link>
                        </div>
                        {currentSession.score != null && (
                          <div className="flex items-center gap-3 mb-4">
                            <div className="text-3xl font-extrabold text-emerald-300">{currentSession.score}/10</div>
                            <div className="flex">
                              {Array.from({ length: 10 }, (_, i) => (
                                <Star key={i} size={12} className={i < (currentSession.score || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} />
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap text-sm leading-7 text-emerald-50/90">{currentSession.feedback}</p>
                      </motion.div>
                    )}

                    <div ref={chatEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-white/5 bg-white/[0.02] p-4 space-y-3">
                {/* Hint panel */}
                {currentSession && !currentSession.reportGenerated && (
                  <HintPanel sessionId={currentSession.id} disabled={sending || ending} />
                )}

                {/* Score this answer */}
                {currentSession && !currentSession.reportGenerated && questionToScore && (
                  <div className="flex items-center gap-2">
                    <select
                      value={questionTopic}
                      onChange={(e) => setQuestionTopic(e.target.value)}
                      className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-xs text-slate-300 outline-none focus:border-fuchsia-500/40"
                    >
                      <option value="General">Topic: General</option>
                      {ALL_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button
                      onClick={scoreAnswer}
                      disabled={scoring || !input.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-200 text-xs font-medium disabled:opacity-40 hover:bg-indigo-500/20 transition-colors"
                    >
                      {scoring ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />}
                      Score Answer
                    </button>
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-3 md:items-end">
                  <div className="flex-1">
                    <label className="block text-xs uppercase tracking-[0.22em] text-slate-500 font-bold mb-2">Your Response</label>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void sendMessage(); } }}
                      disabled={!currentSession || sending || ending || Boolean(currentSession?.reportGenerated)}
                      rows={3}
                      placeholder={currentSession ? 'Explain your thinking, code, or ask a question...' : 'Start a session first'}
                      className="w-full resize-none rounded-2xl bg-[#0b1120] border border-white/10 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-fuchsia-500/40 disabled:opacity-50 text-sm leading-6"
                    />
                    <div className="mt-1.5 text-xs text-slate-600">Ctrl/Cmd + Enter to send</div>
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!currentSession || sending || ending || !input.trim() || Boolean(currentSession?.reportGenerated)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-5 py-3 font-semibold text-white shadow-[0_0_20px_rgba(217,70,239,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    Send
                  </button>
                </div>
              </div>
            </motion.section>
          </div>

          {/* RIGHT: Sidebar */}
          <aside className="space-y-5 relative z-10">
            {/* Session History */}
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="glass rounded-3xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <h2 className="font-bold text-white flex items-center gap-2 text-sm">
                  <CalendarDays size={16} className="text-fuchsia-400" /> Session History
                </h2>
                <button onClick={loadSessions} className="text-xs font-semibold text-fuchsia-300 hover:text-fuchsia-200 transition-colors">
                  <RefreshCcw size={12} />
                </button>
              </div>
              <div className="max-h-[38vh] overflow-y-auto divide-y divide-white/5">
                {sessionsLoading ? (
                  <div className="p-5 text-slate-400 text-sm">Loading...</div>
                ) : sessions.length === 0 ? (
                  <div className="p-5 text-slate-500 text-sm">No sessions yet. Start your first interview!</div>
                ) : (
                  sessions.map((s) => (
                    <button key={s.id} onClick={() => void loadSession(s.id)}
                      className={`w-full text-left p-4 transition-colors hover:bg-white/[0.03] ${selectedSessionId === s.id ? 'bg-fuchsia-500/8' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="text-sm font-semibold text-white truncate">
                          {s.mode === 'topic-focus' && s.topicsCovered[0] ? s.topicsCovered[0] : 'Session'} — {s.difficulty}
                        </div>
                        <div className={`px-2 py-0.5 rounded-full text-xs font-bold border ${s.score != null ? (s.score >= 7 ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : s.score >= 5 ? 'text-amber-300 bg-amber-500/10 border-amber-500/20' : 'text-red-300 bg-red-500/10 border-red-500/20') : 'text-slate-400 bg-white/[0.03] border-white/10'}`}>
                          {s.score != null ? `${s.score}/10` : 'Pending'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock3 size={10} /> {toDisplayTime(s.createdAt)}</span>
                        {s._count?.questionResults > 0 && <span>{s._count.questionResults} Q scored</span>}
                      </div>
                      {s.reportGenerated && (
                        <Link href={`/interview/${s.id}/report`} onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 mt-1.5 text-xs text-fuchsia-400 hover:text-fuchsia-300">
                          <ExternalLink size={10} /> View Report
                        </Link>
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.section>

            {/* Tips */}
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="glass rounded-3xl border border-white/10 p-5">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2 text-sm">
                <Sparkles size={16} className="text-fuchsia-400" /> Interview Tips
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-400 leading-6">
                <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />State brute force first, then optimize.</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />Always mention time and space complexity.</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />Talk through edge cases without being asked.</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />Use "Score Answer" to get instant AI feedback on each question.</li>
              </ul>

              <div className="mt-4 pt-4 border-t border-white/5">
                <Link href="/interview/analytics"
                  className="flex items-center justify-between text-sm text-slate-300 hover:text-white transition-colors group">
                  <span className="flex items-center gap-2"><Trophy size={14} className="text-amber-400" /> View Topic Performance</span>
                  <ChevronDown size={14} className="rotate-[-90deg] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.section>
          </aside>
        </div>
      </div>
    </>
  );
}