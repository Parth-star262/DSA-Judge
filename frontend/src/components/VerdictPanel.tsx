'use client';
import { useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, Zap, BarChart3, ChevronDown, ChevronUp, Cpu, Award, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface VerdictResult {
  verdict: string;
  score: number;
  passedCases: number;
  totalCases: number;
  executionTime?: number;
  complexityEstimate?: string;
  optimalComplexity?: string;
  complexityMatch?: boolean;
  spaceComplexityEstimate?: string;
  optimalSpaceComplexity?: string;
  spaceComplexityMatch?: boolean;
  firstFailedCase?: {
    input: string;
    expectedOutput: string;
    actualOutput: string;
    stderr?: string;
  };
  newBadges?: Array<{ type: string; name: string; description: string }>;
}

interface VerdictPanelProps {
  result: VerdictResult | null;
  loading: boolean;
  streamStatus?: 'queued' | 'judging' | 'complete' | null;
  problemSlug?: string;
  code?: string;
  language?: string;
  token?: string;
}

const VERDICT_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  ACCEPTED:      { icon: <CheckCircle size={22} />, label: 'Accepted', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  COMPLETED:     { icon: <CheckCircle size={22} />, label: 'Execution Completed', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  PARTIAL:       { icon: <Zap size={22} />, label: 'Partial Credit', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  WRONG_ANSWER:  { icon: <XCircle size={22} />, label: 'Wrong Answer', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  TLE:           { icon: <Clock size={22} />, label: 'Time Limit Exceeded', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  RUNTIME_ERROR: { icon: <AlertTriangle size={22} />, label: 'Runtime Error', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
};

function ComplexityExplainer({ complexity, problemSlug, code, language, token }: {
  complexity: string; problemSlug?: string; code?: string; language?: string; token?: string;
}) {
  const [open, setOpen] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const explain = async () => {
    if (explanation) { setOpen(!open); return; }
    setOpen(true);
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/ai/explain-complexity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ problemSlug, code, language, complexityEstimate: complexity }),
      });
      const data = await r.json();
      setExplanation(data.explanation || 'Unable to generate explanation.');
    } catch {
      setExplanation('AI service unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={explain}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          color: '#818cf8', fontSize: 12, cursor: 'pointer', padding: 0, fontWeight: 600,
        }}
      >
        <Cpu size={13} />
        {open ? 'Hide' : 'Why this complexity?'}
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: 8, padding: '10px 14px', background: 'rgba(99,102,241,0.08)',
              borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)',
              fontSize: 13, color: '#c7d2fe', lineHeight: 1.6,
            }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#818cf8' }}>
                  <Loader2 size={13} className="animate-spin" /> Analyzing your code...
                </span>
              ) : explanation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BadgeUnlock({ badges }: { badges: Array<{ type: string; name: string; description: string }> }) {
  const [dismissed, setDismissed] = useState(false);
  if (!badges?.length || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 200 }}
        style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.08))',
          border: '1px solid rgba(251,191,36,0.4)',
          borderRadius: 12, padding: '14px 16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Award size={18} color="#fbbf24" />
            <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: 14 }}>
              {badges.length === 1 ? 'Badge Unlocked!' : `${badges.length} Badges Unlocked!`}
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {badges.map((b) => (
            <div key={b.type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{b.name.split(' ')[0]}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#fde68a' }}>{b.name.slice(2).trim()}</div>
                <div style={{ fontSize: 11, color: '#d97706' }}>{b.description}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function VerdictPanel({ result, loading, streamStatus, problemSlug, code, language, token }: VerdictPanelProps) {
  // Live streaming loading state
  if (loading || streamStatus === 'queued' || streamStatus === 'judging') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, textAlign: 'center' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '3px solid rgba(99,102,241,0.2)',
              borderTop: '3px solid #6366f1',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
          <div style={{ color: '#a5b4fc', fontWeight: 600, fontSize: 15 }}>
            {streamStatus === 'queued' ? '⏳ In queue...' : '⚙️ Judging test cases...'}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {streamStatus === 'queued' ? 'Waiting for a judge slot' : 'Running your code against all test cases'}
          </div>
        </div>
      </motion.div>
    );
  }

  if (!result) return null;

  const cfg = VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.RUNTIME_ERROR;
  const isAveragedRuntime = result.totalCases > 0;
  const complexityMatch = result.complexityMatch ??
    (result.complexityEstimate === result.optimalComplexity);
  const spaceComplexityMatch = result.spaceComplexityMatch ??
    (result.spaceComplexityEstimate === result.optimalSpaceComplexity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      {/* Badge unlock notification */}
      {result.newBadges && result.newBadges.length > 0 && (
        <BadgeUnlock badges={result.newBadges} />
      )}

      {/* Main verdict */}
      <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: cfg.color }}>
          {cfg.icon}
          <span style={{ fontWeight: 700, fontSize: 18 }}>{cfg.label}</span>
        </div>
        {result.totalCases > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Test cases passed</span>
              <span style={{ color: cfg.color, fontWeight: 600 }}>{result.passedCases} / {result.totalCases}</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.totalCases > 0 ? (result.passedCases / result.totalCases) * 100 : 0}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 4, background: cfg.color }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            {isAveragedRuntime ? 'Avg. Runtime' : 'Runtime'}
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>
            {result.executionTime ? `${(result.executionTime * 1000).toFixed(0)} ms` : '—'}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            {isAveragedRuntime ? 'Mean across test cases' : 'Single run'}
          </div>
        </div>
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Score</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: cfg.color }}>{result.score}%</div>
        </div>
      </div>

      {/* Time Complexity with AI Explainer */}
      {result.complexityEstimate && (
        <div style={{
          background: 'var(--surface-2)', borderRadius: 10, padding: '14px 16px',
          border: `1px solid ${complexityMatch ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <BarChart3 size={15} color={complexityMatch ? '#22c55e' : '#f59e0b'} />
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>Time Complexity</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Your code</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14,
                color: complexityMatch ? '#22c55e' : '#f59e0b',
                background: complexityMatch ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                padding: '2px 10px', borderRadius: 6,
              }}>
                {result.complexityEstimate}
              </span>
            </div>
            {result.optimalComplexity && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Expected optimal</span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14,
                  color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 10px', borderRadius: 6,
                }}>
                  {result.optimalComplexity}
                </span>
              </div>
            )}
            {!complexityMatch && <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 2 }}>⚠️ Slower than optimal. Try to improve!</div>}
            {complexityMatch && <div style={{ fontSize: 12, color: '#22c55e', marginTop: 2 }}>✅ Optimal complexity achieved!</div>}
            {/* Phase 3.4 — AI Complexity Explainer */}
            {token && (
              <ComplexityExplainer
                complexity={result.complexityEstimate}
                problemSlug={problemSlug}
                code={code}
                language={language}
                token={token}
              />
            )}
          </div>
        </div>
      )}

      {/* Space Complexity */}
      {result.spaceComplexityEstimate && (
        <div style={{
          background: 'var(--surface-2)', borderRadius: 10, padding: '14px 16px',
          border: `1px solid ${spaceComplexityMatch ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <BarChart3 size={15} color={spaceComplexityMatch ? '#22c55e' : '#f59e0b'} />
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>Space Complexity</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Your code</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14,
                color: spaceComplexityMatch ? '#22c55e' : '#f59e0b',
                background: spaceComplexityMatch ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                padding: '2px 10px', borderRadius: 6,
              }}>
                {result.spaceComplexityEstimate}
              </span>
            </div>
            {result.optimalSpaceComplexity && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Expected optimal</span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14,
                  color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 10px', borderRadius: 6,
                }}>
                  {result.optimalSpaceComplexity}
                </span>
              </div>
            )}
            {!spaceComplexityMatch && <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 2 }}>⚠️ More space than optimal.</div>}
            {spaceComplexityMatch && <div style={{ fontSize: 12, color: '#22c55e', marginTop: 2 }}>✅ Optimal space!</div>}
          </div>
        </div>
      )}

      {/* Failed Test Case Details */}
      {result.firstFailedCase && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={16} /> Failing Test Case Details
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Input</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#e5e7eb', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {result.firstFailedCase.input}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--surface-2)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Expected Output</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#86efac', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {result.firstFailedCase.expectedOutput}
                </div>
              </div>
              <div style={{ background: 'var(--surface-2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Actual Output</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {result.firstFailedCase.actualOutput || (result.verdict === 'RUNTIME_ERROR' ? '(No output)' : '(Empty)')}
                </div>
              </div>
            </div>
            {result.firstFailedCase.stderr && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  {result.verdict === 'RUNTIME_ERROR' ? 'Runtime Error Details' : 'Standard Error'}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {result.firstFailedCase.stderr}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
