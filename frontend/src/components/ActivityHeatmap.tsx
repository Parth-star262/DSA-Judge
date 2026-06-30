'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityDay[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getColor(count: number): string {
  if (count === 0) return 'rgba(255,255,255,0.04)';
  if (count === 1) return 'rgba(99,102,241,0.35)';
  if (count === 2) return 'rgba(99,102,241,0.55)';
  if (count <= 4) return 'rgba(99,102,241,0.75)';
  return 'rgba(99,102,241,1)';
}

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const { weeks, monthLabels, totalSolves, activeDays } = useMemo(() => {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Build date map
    const dateMap: Record<string, number> = {};
    for (const d of data) dateMap[d.date] = d.count;

    // Build weeks array (Sunday-first)
    const startDate = new Date(oneYearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // go back to Sunday

    const weeks: { date: string; count: number }[][] = [];
    const monthLabels: { month: string; weekIndex: number }[] = [];
    let currentWeek: { date: string; count: number }[] = [];
    let lastMonth = -1;

    const d = new Date(startDate);
    while (d <= today) {
      const dateStr = d.toISOString().slice(0, 10);
      const count = dateMap[dateStr] || 0;
      const isPast = d <= today;
      currentWeek.push({ date: dateStr, count: isPast ? count : -1 });

      if (d.getMonth() !== lastMonth) {
        monthLabels.push({ month: MONTHS[d.getMonth()], weekIndex: weeks.length });
        lastMonth = d.getMonth();
      }

      if (d.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      d.setDate(d.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    const totalSolves = data.reduce((s, d) => s + d.count, 0);
    const activeDays = data.filter((d) => d.count > 0).length;

    return { weeks, monthLabels, totalSolves, activeDays };
  }, [data]);

  const CELL = 12;
  const GAP = 3;
  const WEEK_WIDTH = CELL + GAP;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e5e7eb', margin: 0 }}>Activity</h3>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>{totalSolves} total solves</span>
          <span>{activeDays} active days</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'inline-block', minWidth: weeks.length * WEEK_WIDTH + 28 }}>
          {/* Month labels */}
          <div style={{ display: 'flex', marginLeft: 28, marginBottom: 4 }}>
            {monthLabels.map(({ month, weekIndex }) => (
              <div
                key={`${month}-${weekIndex}`}
                style={{
                  position: 'absolute',
                  left: 28 + weekIndex * WEEK_WIDTH,
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {month}
              </div>
            ))}
            <div style={{ height: 14 }} />
          </div>

          {/* Grid */}
          <div style={{ position: 'relative', display: 'flex', gap: GAP }}>
            {/* Day labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: 4 }}>
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <div key={d} style={{ height: CELL, fontSize: 9, color: 'var(--text-muted)', lineHeight: `${CELL}px`, textAlign: 'right' }}>
                  {d % 2 === 1 ? DAYS[d].slice(0, 3) : ''}
                </div>
              ))}
            </div>

            {/* Cells */}
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                {Array.from({ length: 7 }).map((_, di) => {
                  const cell = week[di];
                  if (!cell || cell.count === -1) {
                    return <div key={di} style={{ width: CELL, height: CELL, borderRadius: 2 }} />;
                  }
                  return (
                    <motion.div
                      key={di}
                      title={`${cell.date}: ${cell.count} solve${cell.count !== 1 ? 's' : ''}`}
                      whileHover={{ scale: 1.4 }}
                      style={{
                        width: CELL, height: CELL, borderRadius: 2,
                        background: getColor(cell.count),
                        cursor: cell.count > 0 ? 'pointer' : 'default',
                        transition: 'background 0.2s',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Less</span>
            {[0, 1, 2, 3, 5].map((v) => (
              <div key={v} style={{ width: CELL, height: CELL, borderRadius: 2, background: getColor(v) }} />
            ))}
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
