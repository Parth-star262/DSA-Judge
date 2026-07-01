'use client';

import { useMemo, useState } from 'react';
import { diffLines } from 'diff';
import { GitCompareArrows } from 'lucide-react';

interface DiffSubmission {
  id: string;
  code: string;
  language?: string;
  verdict: string;
  score: number;
  submittedAt: string;
  problem: { title: string; slug: string };
}

interface SubmissionDiffViewerProps {
  submissions: DiffSubmission[];
}

export default function SubmissionDiffViewer({ submissions }: SubmissionDiffViewerProps) {
  const [leftId, setLeftId] = useState(submissions[0]?.id || '');
  const [rightId, setRightId] = useState(submissions[1]?.id || submissions[0]?.id || '');

  const left = submissions.find((item) => item.id === leftId) || submissions[0] || null;
  const right = submissions.find((item) => item.id === rightId) || submissions[1] || submissions[0] || null;

  const diff = useMemo(() => {
    if (!left || !right) return [];
    return diffLines(left.code || '', right.code || '');
  }, [left, right]);

  if (submissions.length < 2 || !left || !right) {
    return (
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 text-slate-400">
        Submit at least two solutions to compare code history.
      </div>
    );
  }

  const renderLine = (value: string, index: number, background: string, color: string) => (
    <div key={`${value}-${index}`} className="grid grid-cols-[56px_1fr] gap-3 px-4 py-1.5" style={{ background }}>
      <span className="text-right text-[11px] text-slate-500 select-none">{index + 1}</span>
      <pre className="whitespace-pre-wrap break-words text-sm leading-6" style={{ color }}>
        {value}
      </pre>
    </div>
  );

  let lineNumber = 0;

  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-4 flex-wrap">
        <h3 className="font-bold text-white tracking-wide text-lg flex items-center gap-2">
          <GitCompareArrows size={18} className="text-indigo-400" /> Submission Diff Viewer
        </h3>
        <div className="flex flex-wrap gap-3">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold flex items-center gap-2">
            Left
            <select
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0b1120] px-3 py-2 text-slate-100 outline-none"
            >
              {submissions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.problem.title} · {item.verdict}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold flex items-center gap-2">
            Right
            <select
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0b1120] px-3 py-2 text-slate-100 outline-none"
            >
              {submissions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.problem.title} · {item.verdict}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-b border-white/5">
        <div className="p-5 border-b lg:border-b-0 lg:border-r border-white/5">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500 font-bold mb-2">Base submission</div>
          <div className="text-sm text-slate-200 font-semibold">{left.problem.title}</div>
          <div className="text-xs text-slate-500 mt-1">{left.verdict} · {left.score}% · {new Date(left.submittedAt).toLocaleString()}</div>
        </div>
        <div className="p-5">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500 font-bold mb-2">Compared submission</div>
          <div className="text-sm text-slate-200 font-semibold">{right.problem.title}</div>
          <div className="text-xs text-slate-500 mt-1">{right.verdict} · {right.score}% · {new Date(right.submittedAt).toLocaleString()}</div>
        </div>
      </div>

      <div className="max-h-[420px] overflow-auto font-mono text-sm">
        {diff.map((part, partIndex) => {
          const lines = part.value.split('\n').filter((line) => line.length > 0 || part.value.includes('\n'));
          const isAdded = part.added;
          const isRemoved = part.removed;
          const background = isAdded ? 'rgba(34,197,94,0.08)' : isRemoved ? 'rgba(239,68,68,0.08)' : 'transparent';
          const color = isAdded ? '#86efac' : isRemoved ? '#fca5a5' : '#e2e8f0';

          return lines.map((line, lineIndex) => {
            if (!isAdded) lineNumber += 1;
            const currentLine = isRemoved ? '-' : lineNumber;
            return (
              <div key={`${partIndex}-${lineIndex}`} className="grid grid-cols-[56px_1fr] gap-3 px-4 py-1.5" style={{ background }}>
                <span className="text-right text-[11px] text-slate-500 select-none">{currentLine}</span>
                <pre className="whitespace-pre-wrap break-words leading-6" style={{ color }}>
                  {isAdded ? `+ ${line}` : isRemoved ? `- ${line}` : line}
                </pre>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}