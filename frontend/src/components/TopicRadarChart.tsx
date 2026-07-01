'use client';

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';

interface TopicStat {
  topic: string;
  score: number;
  solved: number;
  total: number;
}

interface TopicRadarChartProps {
  data: TopicStat[];
}

export default function TopicRadarChart({ data }: TopicRadarChartProps) {
  if (!data.length) {
    return <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-slate-400">No topic data yet.</div>;
  }

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="topic" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: 'rgba(10,15,28,0.96)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              color: '#e2e8f0',
            }}
          />
          <Radar
            dataKey="score"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.25}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}