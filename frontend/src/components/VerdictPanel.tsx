'use client';
import { CheckCircle, XCircle, Clock, AlertTriangle, Zap, BarChart3 } from 'lucide-react';

interface VerdictPanelProps {
  result: {
    verdict: string;
    score: number;
    passedCases: number;
    totalCases: number;
    executionTime?: number;
    complexityEstimate?: string;
    optimalComplexity?: string;
    spaceComplexityEstimate?: string;
    optimalSpaceComplexity?: string;
    firstFailedCase?: {
      input: string;
      expectedOutput: string;
      actualOutput: string;
      stderr?: string;
    };
  } | null;
  loading: boolean;
}

const VERDICT_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  ACCEPTED: { icon: <CheckCircle size={22} />, label: 'Accepted', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  COMPLETED: { icon: <CheckCircle size={22} />, label: 'Execution Completed', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  PARTIAL:  { icon: <Zap size={22} />, label: 'Partial Credit', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  WRONG_ANSWER: { icon: <XCircle size={22} />, label: 'Wrong Answer', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  TLE: { icon: <Clock size={22} />, label: 'Time Limit Exceeded', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  RUNTIME_ERROR: { icon: <AlertTriangle size={22} />, label: 'Runtime Error', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  PENDING: { icon: <Clock size={22} />, label: 'Pending...', color: '#8888aa', bg: 'rgba(136,136,170,0.1)' },
  RUNNING: { icon: <Clock size={22} />, label: 'Running...', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
};

export default function VerdictPanel({ result, loading }: VerdictPanelProps) {
  if (loading) return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>⚙️ Running your code...</div>
      <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 12 }}>Judging all test cases</div>
    </div>
  );

  if (!result) return null;

  if (result.verdict === 'PENDING' || result.verdict === 'RUNNING') {
    return (
      <div style={{
        background: 'rgba(136,136,170,0.08)',
        border: '1px solid rgba(136,136,170,0.18)',
        borderRadius: 12,
        padding: '16px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#a3a3c2' }}>
          <Clock size={22} />
          <span style={{ fontWeight: 700, fontSize: 18 }}>
            {result.verdict === 'RUNNING' ? 'Submission running' : 'Submission queued'}
          </span>
        </div>
        <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
          {result.verdict === 'RUNNING'
            ? 'The worker picked up the job and is judging the test cases.'
            : 'The submission is waiting for a worker. This panel will update automatically.'}
        </div>
        <div style={{ marginTop: 12, background: 'rgba(0,0,0,0.25)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
          <div style={{ width: '70%', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, rgba(136,136,170,0.2), rgba(136,136,170,0.8))', animation: 'pendingPulse 1.4s ease-in-out infinite' }} />
        </div>
      </div>
    );
  }

  const cfg = VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.PENDING;
  const isAveragedRuntime = result.totalCases > 0;
  const complexityMatch = result.complexityEstimate === result.optimalComplexity ||
    (result.optimalComplexity && result.complexityEstimate?.includes(result.optimalComplexity));
  const spaceComplexityMatch = result.spaceComplexityEstimate === result.optimalSpaceComplexity ||
    (result.optimalSpaceComplexity && result.spaceComplexityEstimate?.includes(result.optimalSpaceComplexity));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Main verdict */}
      <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: cfg.color }}>
          {cfg.icon}
          <span style={{ fontWeight: 700, fontSize: 18 }}>{cfg.label}</span>
        </div>
        {result.verdict === 'PARTIAL' || result.totalCases > 0 ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Test cases passed</span>
              <span style={{ color: cfg.color, fontWeight: 600 }}>{result.passedCases} / {result.totalCases}</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, background: cfg.color,
                width: `${result.totalCases > 0 ? (result.passedCases / result.totalCases) * 100 : 0}%`,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        ) : null}
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
            {isAveragedRuntime ? 'Mean across judged test cases' : 'Single run on selected input'}
          </div>
        </div>
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Score</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: cfg.color }}>{result.score}%</div>
        </div>
      </div>

      {/* Complexity */}
      {result.complexityEstimate && (
        <div style={{
          background: 'var(--surface-2)', border: `1px solid ${complexityMatch ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
          borderRadius: 10, padding: '14px 16px',
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
            {!complexityMatch && (
              <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>
                ⚠️ Your solution is slower than optimal. Try to improve!
              </div>
            )}
            {complexityMatch && (
              <div style={{ fontSize: 12, color: '#22c55e', marginTop: 4 }}>
                ✅ Optimal complexity achieved!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Space Complexity */}
      {result.spaceComplexityEstimate && (
        <div style={{
          background: 'var(--surface-2)', border: `1px solid ${spaceComplexityMatch ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
          borderRadius: 10, padding: '14px 16px',
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
            {!spaceComplexityMatch && (
              <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>
                ⚠️ Your solution uses more space than optimal.
              </div>
            )}
            {spaceComplexityMatch && (
              <div style={{ fontSize: 12, color: '#22c55e', marginTop: 4 }}>
                ✅ Optimal space complexity achieved!
              </div>
            )}
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
            <div className="flex-card" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Input</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#e5e7eb', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {result.firstFailedCase.input}
              </div>
            </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="flex-card" style={{ background: 'var(--surface-2)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Expected Output</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#86efac', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {result.firstFailedCase.expectedOutput}
                </div>
              </div>
              <div className="flex-card" style={{ background: 'var(--surface-2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Actual Output</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {result.firstFailedCase.actualOutput || (result.verdict === 'RUNTIME_ERROR' ? '(No output due to error)' : '(Empty output)')}
                </div>
              </div>
            </div>

            {result.firstFailedCase.stderr && (
              <div className="flex-card" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px' }}>
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

      <style jsx>{`
        @keyframes pendingPulse {
          0% { transform: translateX(-30%); opacity: 0.5; }
          50% { opacity: 1; }
          100% { transform: translateX(50%); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
