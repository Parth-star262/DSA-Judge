'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Sparkles, Bug, Loader2, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIReviewPanelProps {
  problemSlug: string;
  code: string;
  language: string;
  verdict: string;
  score: number;
  passedCases: number;
  totalCases: number;
  complexityEstimate?: string;
  // For debug mode
  failedInput?: string;
  failedExpectedOutput?: string;
  failedActualOutput?: string;
  failedStderr?: string;
}

export default function AIReviewPanel({
  problemSlug, code, language, verdict, score,
  passedCases, totalCases, complexityEstimate,
  failedInput, failedExpectedOutput, failedActualOutput, failedStderr,
}: AIReviewPanelProps) {
  const [review, setReview] = useState<string | null>(null);
  const [debugAnalysis, setDebugAnalysis] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [debugLoading, setDebugLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [cooldown, setCooldown] = useState(0);

  const makeHash = (value: string) => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  };
  const reviewCacheKey = `ai-review:${problemSlug}:${language}:${verdict}:${score}:${passedCases}:${totalCases}:${makeHash(code)}`;
  const debugCacheKey = `ai-debug:${problemSlug}:${language}:${makeHash([code, failedInput || '', failedExpectedOutput || '', failedActualOutput || '', failedStderr || ''].join('::'))}`;

  const readCachedValue = (cacheKey: string) => {
    if (typeof window === 'undefined') return null;

    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as { value?: string; codeHash?: string; expiresAt?: number };
      if (parsed?.expiresAt && parsed.expiresAt < Date.now()) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      return parsed?.value || null;
    } catch {
      return null;
    }
  };

  const writeCachedValue = (cacheKey: string, value: string) => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(cacheKey, JSON.stringify({
      value,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    }));
  };

  const hasFailed = verdict === 'WRONG_ANSWER' || verdict === 'RUNTIME_ERROR' || verdict === 'TLE' || verdict === 'PARTIAL';
  const hasFailedCase = !!(failedInput || failedActualOutput || failedStderr);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Reset when verdict changes
  useEffect(() => {
    setReview(null);
    setDebugAnalysis(null);
    setReviewError(null);
    setDebugError(null);
  }, [verdict, problemSlug]);

  const fetchReview = async () => {
    if (reviewLoading) return;

    const cachedReview = readCachedValue(reviewCacheKey);
    if (cachedReview) {
      setReview(cachedReview);
      setReviewError(null);
      setExpanded(true);
      setCooldown(45);
      return;
    }

    if (cooldown > 0) return;

    setReviewLoading(true);
    setReviewError(null);
    setExpanded(true);

    try {
      const res = await api.post('/ai/review', {
        problemSlug, code, language, verdict, score, passedCases, totalCases, complexityEstimate,
      });
      setReview(res.data.review);
      writeCachedValue(reviewCacheKey, res.data.review);
      setCooldown(45);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to get review';
      setReviewError(msg);
    } finally {
      setReviewLoading(false);
    }
  };

  const fetchDebug = async () => {
    if (debugLoading) return;

    const cachedDebug = readCachedValue(debugCacheKey);
    if (cachedDebug) {
      setDebugAnalysis(cachedDebug);
      setDebugError(null);
      setExpanded(true);
      setCooldown(45);
      return;
    }

    if (cooldown > 0) return;

    setDebugLoading(true);
    setDebugError(null);
    setExpanded(true);

    try {
      const res = await api.post('/ai/debug', {
        problemSlug, code, language,
        input: failedInput,
        expectedOutput: failedExpectedOutput,
        actualOutput: failedActualOutput,
        stderr: failedStderr,
      });
      setDebugAnalysis(res.data.analysis);
      writeCachedValue(debugCacheKey, res.data.analysis);
      setCooldown(45);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to get debug analysis';
      setDebugError(msg);
    } finally {
      setDebugLoading(false);
    }
  };

  if (verdict === 'PENDING') return null;

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(30,27,56,0.6) 0%, rgba(20,18,40,0.6) 100%)',
      border: '1px solid rgba(168,85,247,0.18)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          cursor: 'pointer',
          background: 'rgba(168,85,247,0.04)',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'linear-gradient(135deg, #a855f7, #6c63ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Brain size={13} color="#fff" />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            AI Analysis
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Action Buttons */}
          {!review && !reviewLoading && (
            <button
              onClick={(e) => { e.stopPropagation(); fetchReview(); }}
              disabled={cooldown > 0 || reviewLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(168,85,247,0.12)', color: cooldown > 0 ? 'var(--text-muted)' : '#c4b5fd',
                border: '1px solid rgba(168,85,247,0.25)', borderRadius: 7,
                padding: '4px 12px', fontSize: 12, fontWeight: 600,
                cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
              }}
            >
              <Sparkles size={12} />
              {cooldown > 0 ? `${cooldown}s` : 'AI Review'}
            </button>
          )}

          {hasFailed && hasFailedCase && !debugAnalysis && !debugLoading && (
            <button
              onClick={(e) => { e.stopPropagation(); fetchDebug(); }}
              disabled={cooldown > 0 || debugLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(239,68,68,0.1)', color: cooldown > 0 ? 'var(--text-muted)' : '#f87171',
                border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7,
                padding: '4px 12px', fontSize: 12, fontWeight: 600,
                cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
              }}
            >
              <Bug size={12} />
              {cooldown > 0 ? `${cooldown}s` : 'Debug this'}
            </button>
          )}

          {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div style={{ padding: '0 14px 14px' }}>
          {/* Loading States */}
          {(reviewLoading || debugLoading) && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0',
            }}>
              <Loader2 size={16} color="#a855f7" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {reviewLoading ? 'Reviewing your code...' : 'Analyzing the failure...'}
              </span>
            </div>
          )}

          {/* Review Result */}
          {review && (
            <div style={{
              marginTop: 8,
              padding: 1,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(168,85,247,0.5), rgba(99,102,241,0.35), rgba(34,197,94,0.18))',
            }}>
              <div style={{
                padding: '10px 14px',
                background: 'rgba(10,10,26,0.92)',
                borderRadius: 11,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Sparkles size={12} color="#a855f7" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: 0.5 }}>AI Review</span>
                </div>
                <div className="prose-dark" style={{ fontSize: 13, lineHeight: 1.7, color: '#e2e2f0' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{review}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Debug Result */}
          {debugAnalysis && (
            <div style={{
              marginTop: 8,
              padding: 1,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(239,68,68,0.45), rgba(245,158,11,0.22), rgba(168,85,247,0.16))',
            }}>
              <div style={{
                padding: '10px 14px',
                background: 'rgba(10,10,26,0.92)',
                borderRadius: 11,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Bug size={12} color="#f87171" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: 0.5 }}>Bug Analysis</span>
                </div>
                <div className="prose-dark" style={{ fontSize: 13, lineHeight: 1.7, color: '#e2e2f0' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{debugAnalysis}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {reviewError && (
            <div style={{ marginTop: 8, fontSize: 13, color: '#f87171', padding: '8px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8 }}>
              {reviewError}
            </div>
          )}
          {debugError && (
            <div style={{ marginTop: 8, fontSize: 13, color: '#f87171', padding: '8px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8 }}>
              {debugError}
            </div>
          )}

          {/* Prompt to use buttons if no results yet */}
          {!review && !debugAnalysis && !reviewLoading && !debugLoading && !reviewError && !debugError && (
            <div style={{ padding: '10px 0', fontSize: 12, color: 'var(--text-muted)', opacity: 0.7 }}>
              Click <strong>AI Review</strong> for feedback on your code{hasFailed && hasFailedCase ? ', or ' : '.'}
              {hasFailed && hasFailedCase && <><strong>Debug this</strong> to understand why it failed.</>}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
