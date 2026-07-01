'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { ArrowRight, Lightbulb, RefreshCcw } from 'lucide-react';

interface Recommendation {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  topic?: { name: string };
}

interface NextProblemCardProps {
  enabled: boolean;
}

export default function NextProblemCard({ enabled }: NextProblemCardProps) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let alive = true;
    setLoading(true);
    setMessage(null);

    api.get('/ai/recommend')
      .then((res) => {
        if (!alive) return;
        setRecommendations(res.data?.recommendations || []);
        setMessage(res.data?.message || null);
      })
      .catch((error) => {
        if (!alive) return;
        setMessage(error?.response?.data?.error || 'Could not load recommendations right now.');
        setRecommendations([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase tracking-[0.22em] text-xs">
          <Lightbulb size={14} /> What to solve next?
        </div>
        {loading && <RefreshCcw size={14} className="animate-spin text-indigo-300" />}
      </div>

      {message && <p className="text-sm text-indigo-100/80 mb-4">{message}</p>}

      {recommendations.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {recommendations.map((problem) => (
            <Link
              key={problem.id}
              href={`/problems/${problem.slug}`}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.08] transition-colors"
            >
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500 font-bold mb-2">
                {problem.topic?.name || 'Recommended'}
              </div>
              <div className="font-semibold text-white mb-2">{problem.title}</div>
              <div className="flex items-center justify-between text-sm text-indigo-200">
                <span>{problem.difficulty}</span>
                <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      ) : !loading ? (
        <p className="text-sm text-indigo-100/80">Solve more problems to unlock better recommendations.</p>
      ) : null}
    </div>
  );
}