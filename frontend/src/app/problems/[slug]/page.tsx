'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Editor from '@/components/Editor';
import HintPanel from '@/components/HintPanel';
import VerdictPanel from '@/components/VerdictPanel';
import AIHintButton from '@/components/AIHintButton';
import AIReviewPanel from '@/components/AIReviewPanel';
import AIChatPanel from '@/components/AIChatPanel';
import NextProblemCard from '@/components/NextProblemCard';
import { Skeleton } from '@/components/SkeletonLoader';
import { Play, Send, BookOpen, Lightbulb, Lock, ChevronLeft, Tag, GripVertical, HelpCircle, X } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { streamSubmission, type JudgeResult } from '@/lib/sse';

const STARTERS: Record<string, Record<Language, string>> = {
  'two-sum': {
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // return {index1, index2};\n        return {};\n    }\n};`,
    java: `import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // return new int[]{index1, index2};\n        return new int[0];\n    }\n}`,
    python: `def two_sum(nums, target):\n    # return [index1, index2]\n    return []`,
    javascript: `function twoSum(nums, target) {\n  // return [index1, index2]\n  return [];\n}`,
  },
  'longest-subarray-sum-k': {
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    int longestSubarray(vector<int>& nums, int k) {\n        // return maximum length\n        return 0;\n    }\n};`,
    java: `import java.util.*;\n\nclass Solution {\n    public int longestSubarray(int[] nums, int k) {\n        // return maximum length\n        return 0;\n    }\n}`,
    python: `def longest_subarray(nums, k):\n    # return maximum length\n    return 0`,
    javascript: `function longestSubarray(nums, k) {\n  // return maximum length\n  return 0;\n}`,
  },
  'separate-the-digits-in-an-array': {
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> separateDigits(vector<int>& nums) {\n        // implementation\n        return {};\n    }\n};`,
    java: `import java.util.*;\n\nclass Solution {\n    public int[] separateDigits(int[] nums) {\n        // implementation\n        return new int[0];\n    }\n}`,
    python: `def separate_digits(nums):\n    # implementation\n    return []`,
    javascript: `function separateDigits(nums) {\n  // implementation\n  return [];\n}`,
  },
};

const GENERIC_STARTERS: Record<Language, string> = {
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    // Write your function here\n};`,
  java: `import java.util.*;\n\nclass Solution {\n    // Write your function here\n}`,
  python: `# Write your function here`,
  javascript: `// Write your function here`,
};

const getStarter = (problemSlug: string, language: Language) => {
  const byProblem = STARTERS[problemSlug];
  if (byProblem && byProblem[language]) return byProblem[language];
  return GENERIC_STARTERS[language];
};

const stripInlineExamples = (description: string) => {
  const exampleIndex = description.search(/Example\s+\d+:/i);
  if (exampleIndex === -1) return description;
  return description.substring(0, exampleIndex).trim();
};

type Tab = 'description' | 'editorial' | 'hints';
type Language = 'cpp' | 'java' | 'python' | 'javascript';

interface Topic {
  name: string;
}

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
  isSample: boolean;
}

interface CompanyTag {
  id: string;
  companyName: string;
}

interface ProblemDetail {
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topic?: Topic;
  description: string;
  constraints: string;
  optimalComplexity?: string;
  optimalTimeComplexity?: string;
  optimalSpaceComplexity?: string;
  targetedTimeComplexity?: string;
  targetedSpaceComplexity?: string;
  testCases: TestCase[];
  companyTags: CompanyTag[];
  editorial?: Editorial | null;
}

interface Hint {
  level: number;
  content: string | null;
  locked: boolean;
}

interface Editorial {
  content: string;
  videoUrl?: string;
}

interface SubmissionResult {
  verdict: string;
  score: number;
  passedCases: number;
  totalCases: number;
  executionTime?: number;
  complexityEstimate?: string;
  optimalComplexity?: string;
  spaceComplexityEstimate?: string;
  optimalSpaceComplexity?: string;
  output?: string;
  stderr?: string;
  firstFailedCase?: {
    input: string;
    expectedOutput: string;
    actualOutput: string;
    stderr?: string;
  };
}

const DIVIDER_STORAGE_KEY = 'dsa-judge-problem-left-width';

export default function ProblemPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, isEnrolled, enroll } = useAuth();

  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(GENERIC_STARTERS.cpp);
  const [language, setLanguage] = useState<Language>('cpp');
  const [tab, setTab] = useState<Tab>('description');
  const [hints, setHints] = useState<Hint[]>([]);
  const [editorial, setEditorial] = useState<Editorial | null>(null);
  const [editorialLoading, setEditorialLoading] = useState(false);
  const [runResult, setRunResult] = useState<SubmissionResult | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmissionResult | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [streamStatus, setStreamStatus] = useState<'queued' | 'judging' | 'complete' | null>(null);
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [customExpectedOutput, setCustomExpectedOutput] = useState('');
  const [runMode, setRunMode] = useState<'sample' | 'custom'>('sample');
  const [showOutput, setShowOutput] = useState(false);
  const [outputHeightPercent, setOutputHeightPercent] = useState(35);
  const [isDragging, setIsDragging] = useState(false);
  const [leftWidth, setLeftWidth] = useState(42);
  const [isHoveringDivider, setIsHoveringDivider] = useState(false);
  const [isDraggingWidth, setIsDraggingWidth] = useState(false);
  const [mobileTab, setMobileTab] = useState<'problem' | 'code' | 'result'>('problem');
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const savedWidth = Number(window.localStorage.getItem(DIVIDER_STORAGE_KEY));
    if (Number.isFinite(savedWidth) && savedWidth >= 25 && savedWidth <= 75) {
      setLeftWidth(savedWidth);
    }
  }, []);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const startWidthResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingWidth(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const containerHeight = window.innerHeight - 64;
      const distanceToBottom = window.innerHeight - e.clientY;
      const percentage = (distanceToBottom / containerHeight) * 100;
      setOutputHeightPercent(Math.max(20, Math.min(percentage, 80)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.dispatchEvent(new Event('resize'));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!isDraggingWidth) return;

    const handleMouseMove = (e: MouseEvent) => {
      const percentage = (e.clientX / window.innerWidth) * 100;
      setLeftWidth(Math.max(25, Math.min(percentage, 75)));
    };

    const handleMouseUp = () => {
      setIsDraggingWidth(false);
      window.localStorage.setItem(DIVIDER_STORAGE_KEY, String(leftWidth));
      window.dispatchEvent(new Event('resize'));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingWidth, leftWidth]);

  useEffect(() => {
    api
      .get(`/problems/${slug}`)
      .then((r) => {
        setProblem(r.data);
        setCustomInput(r.data.testCases?.[0]?.input || '');
        setLanguage('cpp');
        setCode(getStarter(slug, 'cpp'));
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (tab === 'hints' && user && hints.length === 0) {
      api.get(`/problems/${slug}/hints`).then((r) => setHints(r.data));
    }
  }, [tab, user, slug, hints.length]);

  useEffect(() => {
    if (tab === 'editorial' && isEnrolled && !editorial) {
      setEditorialLoading(true);
      api
        .get(`/problems/${slug}/editorial`)
        .then((r) => setEditorial(r.data))
        .catch(() => setEditorial(null))
        .finally(() => setEditorialLoading(false));
    }
  }, [tab, isEnrolled, slug, editorial]);

  useEffect(() => {
    if (runResult || submitResult) {
      setShowOutput(true);
      setMobileTab('result');
    }
  }, [runResult, submitResult]);

  async function handleRun() {
    if (!user) {
      alert('Please login to run code');
      return;
    }
    const starterForCurrent = getStarter(slug, language);
    if (code.trim() === starterForCurrent.trim()) {
      setRunResult({
        verdict: 'WRONG_ANSWER',
        score: 0,
        passedCases: 0,
        totalCases: 1,
        stderr: 'You are still running the starter template. Please implement the function logic first.',
      });
      setSubmitResult(null);
      return;
    }

    setRunLoading(true);
    setRunResult(null);
    try {
      const sampleCases = (problem?.testCases || []).filter((tc) => tc.isSample);
      const selectedSample = sampleCases[activeTestCase];
      const input = runMode === 'custom' ? customInput : sampleCases[activeTestCase]?.input || '';
      const res = await api.post('/submissions/run', {
        problemSlug: slug,
        code,
        language,
        input,
        expectedOutput: runMode === 'sample' ? selectedSample?.expectedOutput : customExpectedOutput || undefined,
      });
      setRunResult(res.data);
      setSubmitResult(null);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setRunResult({ verdict: 'RUNTIME_ERROR', score: 0, passedCases: 0, totalCases: 0, stderr: error.response?.data?.error || error.message });
      } else {
        setRunResult({ verdict: 'RUNTIME_ERROR', score: 0, passedCases: 0, totalCases: 0, stderr: 'Run failed' });
      }
    } finally {
      setRunLoading(false);
    }
  }

  const pollSubmissionResult = async (submissionId: string) => {
    const maxWaitMs = 5 * 60 * 1000;
    const startedAt = Date.now();

    while (Date.now() - startedAt < maxWaitMs) {
      const res = await api.get(`/submissions/${submissionId}`);
      if (res.data?.verdict && res.data.verdict !== 'PENDING') {
        return {
          verdict: res.data.verdict,
          score: res.data.score ?? 0,
          passedCases: res.data.passedCases ?? 0,
          totalCases: res.data.totalCases ?? 0,
          executionTime: res.data.executionTime ?? 0,
          complexityEstimate: res.data.complexityEstimate ?? undefined,
        } satisfies SubmissionResult;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error('Judging is taking too long. Please check submission history shortly.');
  };

  const waitForSubmissionResult = async (submissionId: string, token: string) => {
    try {
      return await new Promise<SubmissionResult>((resolve, reject) => {
        const cleanup = streamSubmission(submissionId, token, (event) => {
          if (event.type === 'queued') {
            setStreamStatus('queued');
            return;
          }

          if (event.type === 'complete') {
            const result = (event.result || {}) as JudgeResult;
            resolve({
              verdict: result.verdict,
              score: result.score ?? 0,
              passedCases: result.passedCases ?? 0,
              totalCases: result.totalCases ?? 0,
              executionTime: result.executionTime,
              complexityEstimate: result.complexityEstimate,
              optimalComplexity: result.optimalComplexity,
              spaceComplexityEstimate: result.spaceComplexityEstimate,
              optimalSpaceComplexity: result.optimalSpaceComplexity,
              firstFailedCase: result.firstFailedCase,
            });
            cleanup();
            return;
          }

          if (event.type === 'error' || event.type === 'timeout') {
            cleanup();
            reject(new Error(event.type === 'timeout' ? event.message : event.error));
          }
        });
      });
    } catch {
      return pollSubmissionResult(submissionId);
    }
  };

  async function handleSubmit() {
    if (!user) {
      alert('Please login to submit');
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      alert('Please login to submit');
      return;
    }

    setSubmitLoading(true);
    setSubmitResult(null);
    setStreamStatus('queued');
    setRunResult(null);

    try {
      const res = await api.post('/submissions', { problemSlug: slug, code, language });
      const submissionId = res.data?.submissionId as string | undefined;
      if (!submissionId) {
        throw new Error('Submission did not return an id');
      }

      setStreamStatus('judging');
      const finalResult = await waitForSubmissionResult(submissionId, token);
      setSubmitResult(finalResult);
      setStreamStatus('complete');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setSubmitResult({
          verdict: 'RUNTIME_ERROR',
          score: 0,
          passedCases: 0,
          totalCases: 0,
          stderr: error.response?.data?.error || error.message,
        });
      } else if (error instanceof Error) {
        setSubmitResult({
          verdict: 'RUNTIME_ERROR',
          score: 0,
          passedCases: 0,
          totalCases: 0,
          stderr: error.message,
        });
      } else {
        setSubmitResult({
          verdict: 'RUNTIME_ERROR',
          score: 0,
          passedCases: 0,
          totalCases: 0,
          stderr: 'Submit failed',
        });
      }
      setStreamStatus(null);
    } finally {
      setSubmitLoading(false);
    }
  }

  const handleEnroll = async () => {
    const res = await enroll();
    if (!res.ok) {
      alert(res.message || 'Enrollment failed');
      if ((res.message || '').toLowerCase().includes('login')) {
        router.push('/login');
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget = target && ['INPUT', 'TEXTAREA'].includes(target.tagName);

      if (event.key === '?' && !isTypingTarget) {
        event.preventDefault();
        setShowShortcuts(true);
        return;
      }

      if (!(event.ctrlKey || event.metaKey)) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        void handleSubmit();
        return;
      }

      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        void handleRun();
        return;
      }

      if (event.key.toLowerCase() === 'h') {
        event.preventDefault();
        document.dispatchEvent(new Event('dsa-judge:hint-shortcut'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun, handleSubmit]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-slate-400 font-semibold tracking-wider text-sm uppercase">Loading Problem Workspace...</span>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex justify-center items-center min-h-[80vh] text-rose-400 font-bold">
        Problem not found.
      </div>
    );
  }

  const sampleCases = problem.testCases || [];
  const cleanedDescription = stripInlineExamples(problem.description);

  return (
    <div
      className="problem-layout"
      data-mobile-tab={mobileTab}
      style={{ '--left-width': `${leftWidth}%` } as React.CSSProperties}
    >
      {/* Mobile Navigation Tabs */}
      <div className="problem-mobile-tabs">
        <button type="button" onClick={() => setMobileTab('problem')} className={mobileTab === 'problem' ? 'active' : ''}>
          Problem
        </button>
        <button type="button" onClick={() => setMobileTab('code')} className={mobileTab === 'code' ? 'active' : ''}>
          Code
        </button>
        <button
          type="button"
          onClick={() => {
            setMobileTab('result');
            setShowOutput(true);
          }}
          className={mobileTab === 'result' ? 'active' : ''}
        >
          Result
        </button>
      </div>

      {/* LEFT PANEL — Problem Description / Hints / Editorial */}
      <div className="problem-left flex flex-col border-r border-white/10 overflow-hidden min-h-0 h-full bg-[#070818]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#090b20]">
          <Link
            href="/problems"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs font-semibold mb-2"
          >
            <ChevronLeft size={14} /> Back to Problems
          </Link>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">{problem.title}</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase border ${
                problem.difficulty === 'EASY'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : problem.difficulty === 'MEDIUM'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {problem.difficulty}
            </span>
          </div>
          <div className="text-xs text-indigo-400 font-semibold mt-1">{problem.topic?.name}</div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
            {(['description', 'hints', 'editorial'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  tab === t
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {t === 'description' && <BookOpen size={13} />}
                {t === 'hints' && <Lightbulb size={13} />}
                {t === 'editorial' && <BookOpen size={13} />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t === 'editorial' && !isEnrolled && <Lock size={11} className="text-amber-300" />}
              </button>
            ))}
            <div className="ml-auto">
              <AIHintButton problemSlug={slug} code={code} language={language} disabled={!user} />
            </div>
          </div>
        </div>

        {/* Scrollable Content View */}
        <div className="problem-description-scroll flex-1 p-5 sm:p-6 overflow-y-auto">
          {tab === 'description' && (
            <div className="space-y-6">
              <div className="prose-dark">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanedDescription}</ReactMarkdown>
              </div>

              {/* Sample Cases */}
              {sampleCases.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Sample Test Cases</h3>
                  <div className="space-y-4">
                    {sampleCases.map((tc, i) => (
                      <div key={tc.id} className="glass-card p-4 rounded-xl border border-white/10 bg-[#090b22]">
                        <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-extrabold inline-block mb-3">
                          Example {i + 1}
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Input</div>
                            <div className="bg-[#050616] p-3 rounded-lg border border-white/5 font-mono text-xs text-slate-200 whitespace-pre-wrap">
                              {tc.input}
                            </div>
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expected Output</div>
                            <div className="bg-[#050616] p-3 rounded-lg border border-emerald-500/20 font-mono text-xs text-emerald-300 whitespace-pre-wrap">
                              {tc.expectedOutput}
                            </div>
                          </div>
                        </div>

                        {tc.explanation && (
                          <div className="mt-3 pt-3 border-t border-white/5">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Explanation</div>
                            <div className="text-xs text-slate-300 leading-relaxed">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{tc.explanation}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Constraints */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-2">Constraints</h3>
                <div className="prose-dark text-xs sm:text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.constraints}</ReactMarkdown>
                </div>
              </div>

              {/* Targeted Complexity */}
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Targeted Time Complexity</span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {problem.targetedTimeComplexity || problem.optimalTimeComplexity || problem.optimalComplexity || 'O(N)'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Targeted Space Complexity</span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {problem.targetedSpaceComplexity || problem.optimalSpaceComplexity || 'O(1)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {tab === 'hints' && (
            <div>
              {!user ? (
                <div className="text-center py-12">
                  <Lightbulb size={36} className="mx-auto text-amber-400 mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">Login to Access Progressive Hints</h3>
                  <p className="text-xs text-slate-400 mb-4">Get 3-tier guided nudges to break down this problem.</p>
                  <Link href="/login">
                    <button className="btn-primary py-2 px-6 text-xs">Sign In</button>
                  </Link>
                </div>
              ) : (
                <HintPanel hints={hints} />
              )}
            </div>
          )}

          {tab === 'editorial' && (
            <div>
              {!isEnrolled ? (
                <div className="text-center py-12">
                  <Lock size={40} className="mx-auto text-indigo-400 mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">Editorial is Locked</h3>
                  <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-6">
                    Enroll for free to unlock complete editorials, video solutions, and complexity analysis.
                  </p>
                  <button onClick={handleEnroll} className="btn-primary py-2.5 px-6 text-sm font-bold">
                    ✨ Enroll Free
                  </button>
                </div>
              ) : editorialLoading ? (
                <div className="text-center py-12 text-slate-400 text-sm font-medium">Loading Editorial...</div>
              ) : editorial ? (
                <div className="prose-dark">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{editorial.content}</ReactMarkdown>
                  {editorial.videoUrl && (
                    <a
                      href={editorial.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-sm mt-4"
                    >
                      ▶ Watch Video Solution
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-sm">No editorial published for this problem yet.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Monaco Code Editor & Resizable Output */}
      <div
        className="problem-right flex flex-col overflow-hidden bg-[#0a0c20]"
        style={{
          display: 'grid',
          gridTemplateRows: showOutput
            ? `minmax(240px, 1fr) 52px minmax(180px, ${outputHeightPercent}%)`
            : 'minmax(0, 1fr) 52px 0px',
        }}
      >
        {/* Editor Container */}
        <div className="min-h-0 min-w-0 overflow-hidden">
          <Editor
            code={code}
            language={language}
            onCodeChange={setCode}
            onLanguageChange={(l) => {
              const nextLanguage = l as Language;
              setLanguage(nextLanguage);
              setCode(getStarter(slug, nextLanguage));
            }}
          />
        </div>

        {/* Action Bar Bar */}
        <div className="action-bar relative flex items-center justify-between px-4 py-2 bg-[#080a1c] border-t border-white/10 min-h-[52px]">
          {/* Vertical Drag Handle for Output Pane */}
          {showOutput && (
            <div
              onMouseDown={startResize}
              className={`absolute top-[-3px] left-0 right-0 h-2 cursor-ns-resize z-30 flex items-center justify-center transition-colors ${
                isDragging ? 'bg-indigo-500/30' : 'hover:bg-indigo-500/20'
              }`}
            >
              <div className="w-8 h-1 rounded-full bg-white/20" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRunMode('sample');
                setShowOutput(true);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                runMode === 'sample' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sample Cases
            </button>
            <button
              onClick={() => {
                setRunMode('custom');
                setShowOutput(true);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                runMode === 'custom' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom Input
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowOutput(!showOutput);
                setMobileTab('result');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border transition-all ${
                showOutput
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {showOutput ? '✕ Hide Output' : '○ Output'}
            </button>

            <button
              onClick={handleRun}
              disabled={runLoading || submitLoading}
              className="px-4 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play size={13} className="fill-current" />
              {runLoading ? 'Running...' : 'Run'}
            </button>

            <button
              onClick={handleSubmit}
              disabled={runLoading || submitLoading}
              className="btn-primary py-1.5 px-4 text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              <Send size={13} />
              {submitLoading ? 'Judging...' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Collapsible Output Drawer */}
        <div className="bg-[#050718] flex flex-col overflow-y-auto overflow-x-hidden min-h-0 relative">
          {showOutput && (
            <div className="p-4 space-y-4">
              {/* Sample Test Case Selector */}
              {runMode === 'sample' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {sampleCases.map((tc, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveTestCase(i)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeTestCase === i
                            ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                            : 'bg-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Case {i + 1}
                      </button>
                    ))}
                  </div>

                  {sampleCases[activeTestCase] && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Input</div>
                        <div className="bg-[#080a22] p-3 rounded-lg border border-white/10 font-mono text-slate-200">
                          {sampleCases[activeTestCase].input}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Expected Output</div>
                        <div className="bg-[#080a22] p-3 rounded-lg border border-emerald-500/20 font-mono text-emerald-300">
                          {sampleCases[activeTestCase].expectedOutput}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Input View */}
              {runMode === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Custom Input</div>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="w-full bg-[#080a22] border border-white/10 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Verdict Panel */}
              {(runResult || submitResult || runLoading || submitLoading) && (
                <VerdictPanel
                  result={submitResult || runResult}
                  loading={runLoading || submitLoading}
                  streamStatus={streamStatus}
                  problemSlug={slug}
                  code={code}
                  language={language}
                  token={typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined}
                />
              )}

              {/* AI Review Panel */}
              {(runResult || submitResult) && !runLoading && !submitLoading && (
                <AIReviewPanel
                  problemSlug={slug}
                  code={code}
                  language={language}
                  verdict={(submitResult || runResult)!.verdict}
                  score={(submitResult || runResult)!.score}
                  passedCases={(submitResult || runResult)!.passedCases}
                  totalCases={(submitResult || runResult)!.totalCases}
                  complexityEstimate={(submitResult || runResult)?.complexityEstimate}
                  failedInput={(submitResult || runResult)?.firstFailedCase?.input}
                  failedExpectedOutput={(submitResult || runResult)?.firstFailedCase?.expectedOutput}
                  failedActualOutput={(submitResult || runResult)?.firstFailedCase?.actualOutput || (runResult?.output ?? undefined)}
                  failedStderr={(submitResult || runResult)?.firstFailedCase?.stderr || (runResult?.stderr ?? undefined)}
                />
              )}

              {submitResult?.verdict === 'ACCEPTED' && <NextProblemCard enabled={true} />}
            </div>
          )}
        </div>
      </div>

      {/* Resizable Divider Handle between Left and Right */}
      <div
        className="problem-layout-divider"
        onMouseDown={startWidthResize}
        onDoubleClick={() => {
          setLeftWidth(42);
          window.localStorage.setItem(DIVIDER_STORAGE_KEY, '42');
          window.dispatchEvent(new Event('resize'));
        }}
        onMouseEnter={() => setIsHoveringDivider(true)}
        onMouseLeave={() => setIsHoveringDivider(false)}
        role="separator"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `calc(${leftWidth}% - 6px)`,
          width: 12,
          cursor: 'col-resize',
          zIndex: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className={`w-0.5 h-12 rounded-full transition-colors ${isHoveringDivider ? 'bg-indigo-500' : 'bg-white/10'}`} />
      </div>

      {/* AI Assistant Floating Chat Panel */}
      <AIChatPanel
        problemSlug={slug}
        problemTitle={problem.title}
        problemDescription={problem.description}
        code={code}
        language={language}
        disabled={!user}
      />

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="glass-panel w-full max-w-md p-6 rounded-2xl border border-white/10 bg-[#090b22]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                ['Ctrl / Cmd + Enter', 'Submit code to judge'],
                ['Ctrl / Cmd + R', 'Run sample test cases'],
                ['Ctrl / Cmd + H', 'Request AI hint'],
                ['?', 'Toggle shortcut reference'],
              ].map(([key, desc]) => (
                <div key={key} className="flex justify-between items-center p-3 rounded-xl bg-white/5 text-xs">
                  <span className="font-semibold text-slate-200">{desc}</span>
                  <span className="font-mono text-indigo-300 font-bold bg-indigo-500/20 px-2 py-1 rounded">{key}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Layout CSS Rules */}
      <style jsx>{`
        .problem-layout {
          display: grid;
          grid-template-columns: minmax(320px, var(--left-width, 42%)) minmax(0, 1fr);
          height: calc(100dvh - 64px);
          min-height: 0;
          position: relative;
          overflow: hidden;
        }

        .problem-mobile-tabs {
          display: none;
        }

        @media (max-width: 980px) {
          .problem-layout {
            display: flex;
            flex-direction: column;
            height: auto;
            min-height: calc(100dvh - 64px);
          }
          .problem-layout-divider {
            display: none !important;
          }
          .problem-mobile-tabs {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            padding: 8px;
            background: #050616;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .problem-mobile-tabs button {
            padding: 8px;
            font-size: 12px;
            font-weight: 700;
            color: #9494c7;
            background: rgba(255, 255, 255, 0.04);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.08);
          }
          .problem-mobile-tabs button.active {
            background: #7c3aed;
            color: #fff;
            border-color: #7c3aed;
          }
          .problem-layout[data-mobile-tab='problem'] .problem-right,
          .problem-layout[data-mobile-tab='code'] .problem-left,
          .problem-layout[data-mobile-tab='result'] .problem-left {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
