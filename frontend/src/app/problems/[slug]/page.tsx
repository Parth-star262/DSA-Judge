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
import { Play, Send, BookOpen, Lightbulb, Lock, ChevronLeft, Tag, GripVertical } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

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
  // Remove inline example text completely - find where "Example 1:" starts and cut everything from there
  const exampleIndex = description.search(/Example\s+\d+:/i);
  if (exampleIndex === -1) return description;
  
  // Also check for the problem statement ending and cut from there
  const beforeExamples = description.substring(0, exampleIndex).trim();
  return beforeExamples;
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
      const containerHeight = window.innerHeight - 64; // Approximate navbar height
      const distanceToBottom = window.innerHeight - e.clientY;
      const percentage = (distanceToBottom / containerHeight) * 100;
      setOutputHeightPercent(Math.max(20, Math.min(percentage, 80)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // let editor/monaco and other listeners recalc layout after resize
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
    api.get(`/problems/${slug}`)
      .then(r => {
        setProblem(r.data);
        setCustomInput(r.data.testCases?.[0]?.input || '');
        setLanguage('cpp');
        setCode(getStarter(slug, 'cpp'));
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (tab === 'hints' && user && hints.length === 0) {
      api.get(`/problems/${slug}/hints`).then(r => setHints(r.data));
    }
  }, [tab, user, slug, hints.length]);

  useEffect(() => {
    if (tab === 'editorial' && isEnrolled && !editorial) {
      setEditorialLoading(true);
      api.get(`/problems/${slug}/editorial`)
        .then(r => setEditorial(r.data))
        .catch(() => setEditorial(null))
        .finally(() => setEditorialLoading(false));
    }
  }, [tab, isEnrolled, slug, editorial]);

  // Auto-show output when results arrive
  useEffect(() => {
    if (runResult || submitResult) {
      setShowOutput(true);
    }
  }, [runResult, submitResult]);

  const handleRun = async () => {
    if (!user) { alert('Please login to run code'); return; }
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

    setRunLoading(true); setRunResult(null);
    try {
      const sampleCases = (problem?.testCases || []).filter(tc => tc.isSample);
      const selectedSample = sampleCases[activeTestCase];
      const input = runMode === 'custom' ? customInput : (sampleCases[activeTestCase]?.input || '');
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
    } finally { setRunLoading(false); }
  };

  const handleSubmit = async () => {
    if (!user) { alert('Please login to submit'); return; }
    setSubmitLoading(true); setSubmitResult(null);
    try {
      const res = await api.post('/submissions', { problemSlug: slug, code, language });
      setSubmitResult(res.data);
      setRunResult(null);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setSubmitResult({ verdict: 'RUNTIME_ERROR', score: 0, passedCases: 0, totalCases: 0, stderr: error.response?.data?.error || error.message });
      } else {
        setSubmitResult({ verdict: 'RUNTIME_ERROR', score: 0, passedCases: 0, totalCases: 0, stderr: 'Submit failed' });
      }
    } finally { setSubmitLoading(false); }
  };

  const handleEnroll = async () => {
    const res = await enroll();
    if (!res.ok) {
      alert(res.message || 'Enrollment failed');
      if ((res.message || '').toLowerCase().includes('login')) {
        router.push('/login');
      }
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: 'var(--text-muted)' }}>
      Loading problem...
    </div>
  );

  if (!problem) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: '#ef4444' }}>
      Problem not found
    </div>
  );

  const diffColor = problem.difficulty === 'EASY' ? '#22c55e' : problem.difficulty === 'MEDIUM' ? '#f59e0b' : '#ef4444';
  const sampleCases = problem.testCases || [];
  const cleanedDescription = stripInlineExamples(problem.description);

  return (
    <div
      className="problem-layout"
      style={{ '--left-width': `${leftWidth}%` } as React.CSSProperties}
    >

      {/* LEFT PANEL — Problem description */}
      <div className="problem-left" style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', overflow: 'hidden', minHeight: 0, height: '100%' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <Link href="/problems" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, marginBottom: 10 }}>
            <ChevronLeft size={14} /> All Problems
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{problem.title}</h1>
            <span style={{ background: `${diffColor}18`, color: diffColor, border: `1px solid ${diffColor}40`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {problem.difficulty}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{problem.topic?.name}</div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
            {(['description', 'hints', 'editorial'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab === t ? 'rgba(108,99,255,0.2)' : 'transparent',
                color: tab === t ? '#a78bfa' : 'var(--text-muted)',
                border: tab === t ? '1px solid rgba(108,99,255,0.4)' : '1px solid transparent',
                borderRadius: 7, padding: '5px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
              }}>
                {t === 'description' && <BookOpen size={13} />}
                {t === 'hints' && <Lightbulb size={13} />}
                {t === 'editorial' && <BookOpen size={13} />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t === 'editorial' && !isEnrolled && <Lock size={11} />}
              </button>
            ))}
            <div style={{ marginLeft: 'auto' }}>
              <AIHintButton problemSlug={slug} code={code} language={language} disabled={!user} />
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="problem-description-scroll">

          {/* Description */}
          {tab === 'description' && (
            <div>
              <div className="prose-dark">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanedDescription}</ReactMarkdown>
              </div>

              {/* Examples */}
              {sampleCases.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>Examples</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sampleCases.length} sample case{sampleCases.length > 1 ? 's' : ''}</div>
                  </div>

                  <div style={{ display: 'grid', gap: 14 }}>
                    {sampleCases.map((tc, i: number) => (
                      <div
                        key={tc.id}
                        style={{
                          border: '1px solid rgba(108,99,255,0.18)',
                          background: 'linear-gradient(180deg, rgba(108,99,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                          borderRadius: 14,
                          padding: 16,
                          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ background: 'rgba(108,99,255,0.2)', color: '#c4b5fd', border: '1px solid rgba(108,99,255,0.35)', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                              Example {i + 1}
                            </span>
                            {tc.isSample && (
                              <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 600 }}>Sample input</span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Input</div>
                            <div style={{
                              background: 'rgba(15,23,42,0.72)',
                              border: '1px solid var(--border)',
                              borderRadius: 12,
                              padding: '12px 14px',
                              color: '#e5e7eb',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 13,
                              lineHeight: 1.7,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}>
                              {tc.input}
                            </div>
                          </div>

                          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Output</div>
                            <div style={{
                              background: 'rgba(15,23,42,0.72)',
                              border: '1px solid rgba(34,197,94,0.22)',
                              borderRadius: 12,
                              padding: '12px 14px',
                              color: '#86efac',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 13,
                              lineHeight: 1.7,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}>
                              {tc.expectedOutput}
                            </div>
                          </div>
                        </div>

                        {tc.explanation && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
                              Explanation
                            </div>
                            <div
                              className="prose-dark"
                              style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--border)',
                                borderRadius: 12,
                                padding: 14,
                                fontSize: 14,
                                lineHeight: 1.7,
                                color: 'var(--text)',
                              }}
                            >
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
              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: 8 }}>Constraints</div>
                <div className="prose-dark" style={{ fontSize: 14 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.constraints}</ReactMarkdown>
                </div>
              </div>

              {/* Expected Complexity */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: 8 }}>Expected Complexity</div>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Targeted Time Complexity</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: '#22c55e', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 6, padding: '2px 10px' }}>
                      {problem.targetedTimeComplexity || problem.optimalTimeComplexity || problem.optimalComplexity || '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Targeted Space Complexity</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: '#22c55e', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 6, padding: '2px 10px' }}>
                      {problem.targetedSpaceComplexity || problem.optimalSpaceComplexity || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Tags (enrolled only) - HIDDEN */}
              {false && (problem?.companyTags?.length || 0) > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                    <Tag size={14} /> Company Tags
                    {!isEnrolled && <Lock size={12} color="#f59e0b" />}
                  </div>
                  {isEnrolled ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(problem?.companyTags || []).map((ct) => (
                        <span key={ct.id} style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                          {ct.companyName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f59e0b' }}>
                      🔒 Enroll to see which companies asked this problem
                      <button onClick={handleEnroll} style={{ display: 'block', marginTop: 8, background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                        Enroll Free
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Hints Tab */}
          {tab === 'hints' && (
            <div>
              {!user ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <Lightbulb size={32} style={{ margin: '0 auto 12px', display: 'block', color: '#f59e0b' }} />
                  <div style={{ fontWeight: 600, color: '#fff', marginBottom: 8 }}>Login to view hints</div>
                  <Link href="/login"><button className="btn-primary" style={{ marginTop: 12 }}>Login</button></Link>
                </div>
              ) : <HintPanel hints={hints} />}
            </div>
          )}

          {/* Editorial Tab */}
          {tab === 'editorial' && (
            <div>
              {!isEnrolled ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Lock size={40} style={{ margin: '0 auto 16px', display: 'block', color: '#6c63ff' }} />
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 18, marginBottom: 8 }}>Editorial is locked</div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                    Enroll for free to access full editorial with approach explanation, code, and complexity analysis.
                  </div>
                  <button onClick={handleEnroll} className="btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}>
                    ✨ Enroll Free
                  </button>
                </div>
              ) : editorialLoading ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Loading editorial...</div>
              ) : editorial ? (
                <div className="prose-dark">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{editorial.content}</ReactMarkdown>
                  {editorial.videoUrl && (
                    <a href={editorial.videoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#a78bfa', marginTop: 16, textDecoration: 'none' }}>
                      ▶ Watch Video Solution
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No editorial available yet</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Editor + Results */}
      <div className="problem-right" style={{ gridTemplateRows: showOutput ? `minmax(240px, 1fr) 52px minmax(180px, ${outputHeightPercent}%)` : 'minmax(0, 1fr) 52px 0px' }}>
        {/* Editor */}
        <div style={{ minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
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

        {/* ── Permanent Action Bar (always visible) ── */}
        <div className="action-bar" style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 16px', flexShrink: 0,
          borderTop: '1px solid var(--border)',
          borderBottom: showOutput ? '1px solid var(--border)' : 'none',
          background: 'var(--surface)',
          minHeight: '52px',
          boxSizing: 'border-box',
        }}>
          {/* Vertical Drag Handle (placed at the top edge of the action bar) */}
          {showOutput && (
            <div
              onMouseDown={startResize}
              style={{
                position: 'absolute',
                top: -3,
                left: 0,
                right: 0,
                height: 6,
                cursor: 'ns-resize',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDragging ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(124, 58, 237, 0.4)';
              }}
              onMouseLeave={(e) => {
                if (!isDragging) e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Visual grabber pill */}
              <div style={{ width: 32, height: 3, borderRadius: 2, background: 'rgba(255, 255, 255, 0.15)' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => { setRunMode('sample'); setShowOutput(true); }}
              style={{ background: runMode === 'sample' ? 'rgba(108,99,255,0.15)' : 'transparent', border: `1px solid ${runMode === 'sample' ? 'rgba(108,99,255,0.4)' : 'transparent'}`, borderRadius: 6, padding: '5px 14px', fontSize: 12, color: runMode === 'sample' ? '#a78bfa' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
            >Sample Cases</button>
            <button
              onClick={() => { setRunMode('custom'); setShowOutput(true); }}
              style={{ background: runMode === 'custom' ? 'rgba(108,99,255,0.15)' : 'transparent', border: `1px solid ${runMode === 'custom' ? 'rgba(108,99,255,0.4)' : 'transparent'}`, borderRadius: 6, padding: '5px 14px', fontSize: 12, color: runMode === 'custom' ? '#a78bfa' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
            >Custom Input</button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setShowOutput(!showOutput)} style={{ background: showOutput ? 'rgba(108,99,255,0.2)' : 'transparent', color: showOutput ? '#a78bfa' : 'var(--text-muted)', border: showOutput ? '1px solid rgba(108,99,255,0.4)' : '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}>
              {showOutput ? '✕ Close Output' : '○ Output'}
            </button>
            {(runResult || submitResult) && (
              <button onClick={() => { setRunResult(null); setSubmitResult(null); }} style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                Clear
              </button>
            )}
            <button onClick={handleRun} disabled={runLoading || submitLoading} style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 8, padding: '6px 18px', fontWeight: 700, cursor: runLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit', opacity: submitLoading ? 0.5 : 1 }}>
              <Play size={14} /> {runLoading ? 'Running...' : 'Run'}
            </button>
            <button onClick={handleSubmit} disabled={runLoading || submitLoading} style={{ background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 700, cursor: submitLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit', opacity: runLoading ? 0.5 : 1 }}>
              <Send size={14} /> {submitLoading ? 'Judging...' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Bottom collapsible output panel */}
        <div style={{
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          position: 'relative',
          scrollbarGutter: 'stable',
          overscrollBehavior: 'contain',
        }}>

          {/* ── Single scrollable output body ── */}
          {showOutput && (
            <div style={{
              padding: '18px 16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              WebkitOverflowScrolling: 'touch',
              boxSizing: 'border-box',
            }}>

              {/* Sample Cases */}
              {runMode === 'sample' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {sampleCases.map((tc, i: number) => (
                      <button key={i} onClick={() => setActiveTestCase(i)} style={{ background: activeTestCase === i ? 'rgba(108,99,255,0.25)' : 'var(--surface-2)', border: `1px solid ${activeTestCase === i ? 'rgba(108,99,255,0.5)' : 'var(--border)'}`, borderRadius: 7, padding: '5px 14px', fontSize: 12, color: activeTestCase === i ? '#c4b5fd' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                        Case {i + 1}
                      </button>
                    ))}
                  </div>
                  {sampleCases[activeTestCase] && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Input</div>
                        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#e5e7eb', lineHeight: 1.7 }}>
                          {String(sampleCases[activeTestCase].input)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Expected Output</div>
                        <div style={{ background: 'var(--surface-2)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#86efac', lineHeight: 1.7 }}>
                          {String(sampleCases[activeTestCase].expectedOutput)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Input */}
              {runMode === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Custom Input</div>
                    <textarea value={customInput} onChange={e => setCustomInput(e.target.value)} style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, resize: 'vertical', minHeight: 80, outline: 'none', lineHeight: 1.7 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
                      Expected Output{' '}<span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, opacity: 0.6 }}>(optional)</span>
                    </div>
                    <textarea value={customExpectedOutput} onChange={e => setCustomExpectedOutput(e.target.value)} placeholder="Add expected output to check verdict" style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, resize: 'vertical', minHeight: 64, outline: 'none', lineHeight: 1.7 }} />
                  </div>
                </div>
              )}

              {/* Verdict Panel */}
              {(runResult || submitResult || runLoading || submitLoading) && (
                <div className="flex-height" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <VerdictPanel result={submitResult || runResult} loading={runLoading || submitLoading} />
                </div>
              )}

              {/* AI Review Panel */}
              {(runResult || submitResult) && !runLoading && !submitLoading && (
                <div className="flex-height" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
                </div>
              )}

              {/* Program Output */}
              {runResult?.output && !runLoading && !submitLoading && (
                <div className="flex-height" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Your Output</div>
                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#e2e2f0', lineHeight: 1.7 }}>
                    {runResult.output}
                  </div>
                </div>
              )}

              {/* Stderr / Runtime Error */}
              {runResult?.stderr && !runLoading && !submitLoading && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, color: runResult.verdict === 'RUNTIME_ERROR' ? '#ef4444' : 'var(--text-muted)' }}>
                    {runResult.verdict === 'RUNTIME_ERROR' ? '⚠ Runtime Error' : 'Stderr'}
                  </div>
                  <div style={{ background: runResult.verdict === 'RUNTIME_ERROR' ? 'rgba(239,68,68,0.07)' : 'var(--surface-2)', border: `1px solid ${runResult.verdict === 'RUNTIME_ERROR' ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`, borderRadius: 8, padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7, color: runResult.verdict === 'RUNTIME_ERROR' ? '#fca5a5' : '#e2e2f0' }}>
                    {runResult.stderr}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
      {/* Vertical drag handle between left and right panels */}
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
        aria-orientation="vertical"
        title="Drag to resize — double-click to reset"
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
          pointerEvents: 'auto',
        }}
      >
        <div style={{ width: 2, height: 48, background: isHoveringDivider ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', borderRadius: 2, transition: 'background 120ms' }} />
        <div style={{ position: 'absolute', left: '50%', top: '12px', transform: 'translateX(-50%)', pointerEvents: 'none', display: isHoveringDivider ? 'block' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '6px 10px', borderRadius: 8, fontSize: 12, boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}>
            <GripVertical size={14} color="rgba(255,255,255,0.9)" />
            <div style={{ whiteSpace: 'nowrap' }}>Drag to resize · Double-click to reset</div>
          </div>
        </div>
      </div>
      <AIChatPanel
        problemSlug={slug}
        problemTitle={problem.title}
        problemDescription={problem.description}
        code={code}
        language={language}
        disabled={!user}
      />
      <style jsx>{`
        .problem-layout {
          display: grid;
          grid-template-columns: minmax(340px, var(--left-width, 42%)) minmax(0, 1fr);
          height: calc(100dvh - 64px);
          min-height: 0;
          position: relative;
          overflow: hidden;
          transition: grid-template-columns 140ms ease;
        }

        .problem-left,
        .problem-right {
          min-width: 0;
          min-height: 0;
        }

        .problem-right {
          display: grid;
          overflow: hidden;
          background: var(--surface);
          height: 100%;
        }

        .problem-description-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px 24px 48px;
          overscroll-behavior: contain;
        }

        .action-bar {
          flex-wrap: wrap;
          row-gap: 8px;
        }

        .mode-toggle {
          transition: all 0.2s ease;
        }

        @media (max-width: 1200px) {
          .problem-layout {
            grid-template-columns: minmax(320px, var(--left-width, 46%)) minmax(0, 1fr);
          }
        }

        @media (max-width: 980px) {
          .problem-layout {
            grid-template-columns: 1fr;
            grid-template-rows: minmax(360px, 46%) minmax(440px, 54%);
            height: auto;
            min-height: calc(100dvh - 64px);
            overflow: visible;
          }

          .problem-left {
            border-right: none;
            border-bottom: 1px solid var(--border);
            min-height: 480px;
          }

          .problem-right {
            min-height: 640px;
          }

          .problem-layout-divider {
            display: none !important;
          }

          .action-bar {
            padding: 10px 12px;
          }
        }

        @media (max-width: 720px) {
          .problem-layout {
            display: flex;
            flex-direction: column;
          }

          .problem-left {
            height: min(68dvh, 720px) !important;
            min-height: 480px;
          }

          .problem-right {
            height: max(720px, calc(100dvh - 64px)) !important;
            min-height: 720px;
          }

          .action-bar {
            flex-wrap: wrap;
            row-gap: 8px;
            min-height: 96px !important;
          }

          .action-bar > :global(div) {
            width: 100%;
            justify-content: space-between;
          }
        }

        /* Thin scrollbar for output panel */
        .problem-right ::-webkit-scrollbar { width: 5px; height: 5px; }
        .problem-right ::-webkit-scrollbar-track { background: transparent; }
        .problem-right ::-webkit-scrollbar-thumb { background: rgba(108,99,255,0.35); border-radius: 8px; }
        .problem-right ::-webkit-scrollbar-thumb:hover { background: rgba(108,99,255,0.6); }
        /* Make panels inside the output area shrink properly when the editor is resized */
        .problem-right .flex-card { min-width: 0; }
        .problem-right .flex-height { min-height: 0; flex: 1 1 0; display: flex; flex-direction: column; }
      `}</style>
    </div>
  );
}
