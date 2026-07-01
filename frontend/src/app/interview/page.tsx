'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot, Brain, CalendarDays, Clock3, MessageSquare, PlayCircle, RefreshCcw, Send, Sparkles, SquarePen, Trophy, User } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type Role = 'system' | 'assistant' | 'user';

interface InterviewMessage {
  role: Role;
  content: string;
}

interface InterviewHistoryItem {
  id: string;
  score: number | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}

interface InterviewSessionDetail extends InterviewHistoryItem {
  userId: string;
  problemId: string | null;
  messages: InterviewMessage[];
  problem?: {
    id: string;
    slug: string;
    title: string;
    difficulty: string;
  } | null;
}

const toDisplayTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const roleStyles: Record<Exclude<Role, 'system'>, { label: string; wrapper: string; badge: string }> = {
  assistant: {
    label: 'Interviewer',
    wrapper: 'bg-white/5 border-white/10 text-slate-100',
    badge: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25',
  },
  user: {
    label: 'Candidate',
    wrapper: 'bg-indigo-500/15 border-indigo-500/25 text-indigo-50',
    badge: 'bg-indigo-500/15 text-indigo-200 border-indigo-500/25',
  },
};

export default function InterviewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<InterviewSessionDetail | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [problemSlug, setProblemSlug] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const activeTranscript = useMemo(() => {
    if (!currentSession?.messages) return [];
    return currentSession.messages.filter((message) => message.role !== 'system');
  }, [currentSession]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/ai/interview/history');
      setHistory(res.data || []);
    } catch (error: any) {
      setPageError(error?.response?.data?.error || 'Failed to load interview history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    setPageError(null);
    try {
      const res = await api.get(`/ai/interview/${sessionId}`);
      setCurrentSession(res.data);
      setSelectedSessionId(sessionId);
      localStorage.setItem('interview-session-id', sessionId);
    } catch (error: any) {
      setPageError(error?.response?.data?.error || 'Failed to load interview session.');
    }
  };

  useEffect(() => {
    if (!user) return;

    loadHistory();

    const savedSessionId = localStorage.getItem('interview-session-id');
    if (savedSessionId) {
      loadSession(savedSessionId).catch(() => undefined);
    }
  }, [user]);

  useEffect(() => {
    if (!user && !authLoading) {
      router.replace('/login');
    }
  }, [authLoading, router, user]);

  const startInterview = async () => {
    if (starting) return;

    setStarting(true);
    setPageError(null);

    try {
      const payload = problemSlug.trim() ? { problemSlug: problemSlug.trim() } : {};
      const res = await api.post('/ai/interview/start', payload);
      const sessionId = res.data.sessionId as string;

      setCurrentSession({
        id: sessionId,
        userId: user!.id,
        problemId: null,
        messages: [{ role: 'assistant', content: res.data.message }],
        score: null,
        feedback: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setSelectedSessionId(sessionId);
      localStorage.setItem('interview-session-id', sessionId);
      setInput('');
      await loadHistory();
    } catch (error: any) {
      setPageError(error?.response?.data?.error || 'Failed to start interview session.');
    } finally {
      setStarting(false);
    }
  };

  const sendMessage = async () => {
    if (!currentSession || sending || ending || !input.trim() || currentSession.feedback) return;

    const message = input.trim();
    setInput('');
    setSending(true);
    setCurrentSession((prev) =>
      prev
        ? { ...prev, messages: [...prev.messages, { role: 'user', content: message }] }
        : prev,
    );

    try {
      const res = await api.post(`/ai/interview/${currentSession.id}/message`, { message });
      setCurrentSession((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, { role: 'assistant', content: res.data.message }],
              updatedAt: new Date().toISOString(),
            }
          : prev,
      );
      await loadHistory();
    } catch (error: any) {
      setPageError(error?.response?.data?.error || 'Failed to send message.');
      setCurrentSession((prev) =>
        prev
          ? { ...prev, messages: prev.messages.filter((_, index) => index !== prev.messages.length - 1) }
          : prev,
      );
    } finally {
      setSending(false);
    }
  };

  const endInterview = async () => {
    if (!currentSession || ending || currentSession.feedback) return;

    setEnding(true);
    setPageError(null);

    try {
      const res = await api.post(`/ai/interview/${currentSession.id}/end`);
      setCurrentSession((prev) =>
        prev
          ? {
              ...prev,
              score: res.data.score,
              feedback: res.data.feedback,
              updatedAt: new Date().toISOString(),
            }
          : prev,
      );
      await loadHistory();
    } catch (error: any) {
      setPageError(error?.response?.data?.error || 'Failed to end interview session.');
    } finally {
      setEnding(false);
    }
  };

  const resumeHistorySession = async (sessionId: string) => {
    await loadSession(sessionId);
  };

  if (authLoading || (!user && typeof window !== 'undefined')) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" />
          <span className="text-slate-400 font-medium tracking-widest text-sm uppercase">Loading Interview...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 md:py-16 relative">
      <div className="absolute top-10 right-10 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 text-xs font-bold uppercase tracking-[0.24em] mb-4">
            <Brain size={14} /> AI Interview Simulator
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">Practice the interview, not just the solution</h1>
          <p className="text-slate-400 max-w-3xl text-lg">
            Start a mock DSA interview, answer follow-up questions, and end the session to get a scored evaluation and feedback on communication, approach, and complexity.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={startInterview}
            disabled={starting}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white font-semibold shadow-[0_0_24px_rgba(217,70,239,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {starting ? <RefreshCcw size={16} className="animate-spin" /> : <PlayCircle size={16} />}
            Start New Interview
          </button>
          <button
            onClick={endInterview}
            disabled={!currentSession || ending || Boolean(currentSession?.feedback)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-semibold hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SquarePen size={16} />
            End Session
          </button>
        </div>
      </motion.div>

      {pageError && (
        <div className="relative z-10 mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-200">
          {pageError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_0.9fr] gap-6 relative z-10">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-3xl border border-white/10 overflow-hidden shadow-xl shadow-black/30"
        >
          <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-bold text-white tracking-wide text-lg flex items-center gap-2">
                <MessageSquare size={18} className="text-fuchsia-400" /> Live Session
              </h2>
              <p className="text-slate-400 text-sm mt-1">{currentSession ? `Session ${currentSession.id.slice(0, 8)}` : 'No active interview session'}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                value={problemSlug}
                onChange={(e) => setProblemSlug(e.target.value)}
                placeholder="Optional problem slug"
                className="min-w-[220px] rounded-xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-fuchsia-500/50"
              />
              <Link href="/problems" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/[0.08] transition-colors">
                <Sparkles size={14} /> Pick a problem
              </Link>
            </div>
          </div>

          <div className="max-h-[62vh] overflow-y-auto p-5 md:p-6 space-y-4 bg-[#070b17]">
            {!currentSession ? (
              <div className="min-h-[40vh] flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-4">
                  <Bot size={30} className="text-fuchsia-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Start a mock interview</h3>
                <p className="text-slate-400 max-w-md mb-6">
                  Create a new session to get an interviewer prompt. You can optionally provide a problem slug to focus the discussion on a specific challenge.
                </p>
                <button
                  onClick={startInterview}
                  disabled={starting}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white font-semibold"
                >
                  {starting ? <RefreshCcw size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                  Start Interview
                </button>
              </div>
            ) : (
              <>
                {currentSession.problem && (
                  <div className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/8 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-fuchsia-300 font-bold mb-1">Problem Focus</div>
                      <div className="text-white font-semibold">{currentSession.problem.title}</div>
                      <div className="text-sm text-slate-400">{currentSession.problem.difficulty}</div>
                    </div>
                    <Link href={`/problems/${currentSession.problem.slug}`} className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08] transition-colors">
                      Open Problem
                    </Link>
                  </div>
                )}

                {activeTranscript.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-8 text-slate-400 text-center">
                    The interviewer will appear here once the session starts.
                  </div>
                ) : (
                  activeTranscript.map((message, index) => {
                    const style = message.role === 'assistant' ? roleStyles.assistant : roleStyles.user;
                    return (
                      <motion.div
                        key={`${message.role}-${index}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl border p-4 md:p-5 ${style.wrapper}`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-[0.2em] ${style.badge}`}>
                            {message.role === 'assistant' ? <Bot size={12} /> : <User size={12} />}
                            {style.label}
                          </div>
                          <div className="text-xs text-slate-500">{index === 0 ? 'Opening prompt' : `Turn ${Math.ceil((index + 1) / 2)}`}</div>
                        </div>
                        <p className="whitespace-pre-wrap leading-7 text-[15px] text-slate-100">{message.content}</p>
                      </motion.div>
                    );
                  })
                )}

                {currentSession.feedback && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold uppercase tracking-[0.22em] text-xs mb-3">
                      <Trophy size={14} /> Final Evaluation
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <div className="rounded-full border border-emerald-500/20 bg-emerald-500/15 px-3 py-1.5 text-emerald-200 font-semibold">
                        Score: {currentSession.score ?? 'N/A'}/10
                      </div>
                      <div className="text-sm text-emerald-100/80">{toDisplayTime(currentSession.updatedAt)}</div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-emerald-50/90">{currentSession.feedback}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t border-white/5 bg-white/[0.02] p-4 md:p-5">
            <div className="flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-1">
                <label className="block text-xs uppercase tracking-[0.22em] text-slate-500 font-bold mb-2">Your response</label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  disabled={!currentSession || sending || ending || Boolean(currentSession?.feedback)}
                  rows={3}
                  placeholder={currentSession ? 'Explain your thinking, tradeoffs, or edge cases...' : 'Start a session first'}
                  className="w-full resize-none rounded-2xl bg-[#0b1120] border border-white/10 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-fuchsia-500/50 disabled:opacity-60"
                />
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Ctrl/Cmd + Enter to send</span>
                  <span>End the session once you are done to get the score</span>
                </div>
              </div>

              <button
                onClick={sendMessage}
                disabled={!currentSession || sending || ending || !input.trim() || Boolean(currentSession?.feedback)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-5 py-3 font-semibold text-white shadow-[0_0_24px_rgba(217,70,239,0.22)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? <RefreshCcw size={16} className="animate-spin" /> : <Send size={16} />}
                Send
              </button>
            </div>
          </div>
        </motion.section>

        <aside className="space-y-6 relative z-10">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="glass rounded-3xl border border-white/10 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <CalendarDays size={18} className="text-fuchsia-400" /> Session History
              </h2>
              <button onClick={loadHistory} className="text-xs font-semibold text-fuchsia-300 hover:text-fuchsia-200 transition-colors">
                Refresh
              </button>
            </div>

            <div className="max-h-[34vh] overflow-y-auto divide-y divide-white/5">
              {historyLoading ? (
                <div className="p-6 text-slate-400 text-sm">Loading sessions...</div>
              ) : history.length === 0 ? (
                <div className="p-6 text-slate-400 text-sm">
                  No interview sessions yet. Start one to build your history.
                </div>
              ) : (
                history.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => void resumeHistorySession(session.id)}
                    className={`w-full text-left p-4 transition-colors hover:bg-white/[0.03] ${selectedSessionId === session.id ? 'bg-fuchsia-500/10' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="text-sm font-semibold text-white">Session {session.id.slice(0, 8)}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Clock3 size={11} /> {toDisplayTime(session.createdAt)}
                        </div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-200">
                        {session.score ?? 'Pending'}
                      </div>
                    </div>
                    <div className="text-sm text-slate-400 line-clamp-2">
                      {session.feedback ? session.feedback.split('\n')[0] : 'In progress or awaiting feedback'}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="glass rounded-3xl border border-white/10 p-5"
          >
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-fuchsia-400" /> Interview Tips
            </h3>
            <ul className="space-y-3 text-sm text-slate-400 leading-6">
              <li>State the brute-force approach first, then explain how you improve it.</li>
              <li>Call out edge cases and time/space complexity without waiting to be asked.</li>
              <li>When stuck, talk through invariants and what the interviewer should look for.</li>
            </ul>
          </motion.section>
        </aside>
      </div>
    </div>
  );
}