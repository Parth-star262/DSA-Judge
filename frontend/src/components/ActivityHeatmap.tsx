'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ActivityDay {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityDay[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getColor(count: number): string {
  if (count === 0) return 'rgba(255,255,255,0.13)';
  if (count === 1) return 'rgba(22,163,74,0.55)';
  if (count === 2) return 'rgba(22,163,74,0.72)';
  if (count <= 4) return 'rgba(22,163,74,0.88)';
  return 'rgb(34,197,94)';
}

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const { months, totalSolves, activeDays } = useMemo(() => {
    const today = new Date();
    const dateMap: Record<string, number> = {};
    for (const day of data) dateMap[day.date] = day.count;

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Six compact month calendars reproduce the dashboard-style heatmap.
    const months = Array.from({ length: 6 }, (_, offset) => {
      const date = new Date(today.getFullYear(), today.getMonth() - 5 + offset, 1);
      const year = date.getFullYear();
      const monthIndex = date.getMonth();
      const firstDay = new Date(year, monthIndex, 1).getDay();
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const cells: ({ date: string; count: number } | null)[] = Array(firstDay).fill(null);

      for (let day = 1; day <= daysInMonth; day += 1) {
        const current = new Date(year, monthIndex, day);
        const dateKey = formatDate(current);
        cells.push(current > today ? null : { date: dateKey, count: dateMap[dateKey] || 0 });
      }
      while (cells.length % 7 !== 0) cells.push(null);
      return { label: MONTHS[monthIndex], cells };
    });

    return {
      months,
      totalSolves: data.reduce((sum, day) => sum + day.count, 0),
      activeDays: data.filter((day) => day.count > 0).length,
    };
  }, [data]);

  const CELL = 10;
  const GAP = 2;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e5e7eb', margin: 0 }}>Activity</h3>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>{totalSolves} total solves</span>
          <span>{activeDays} active days</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
        <div style={{ display: 'flex', gap: 24, minWidth: 'max-content', paddingTop: 2 }}>
          {months.map(({ label, cells }, monthIndex) => (
            <div key={`${label}-${monthIndex}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${CELL}px)`, gap: GAP }}>
                {cells.map((cell, index) => cell ? (
                  <motion.div
                    key={cell.date}
                    title={`${cell.date}: ${cell.count} solve${cell.count !== 1 ? 's' : ''}`}
                    whileHover={{ scale: 1.35 }}
                    style={{ width: CELL, height: CELL, borderRadius: 2, background: getColor(cell.count), cursor: cell.count > 0 ? 'pointer' : 'default' }}
                  />
                ) : <div key={index} style={{ width: CELL, height: CELL }} />)}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Less</span>
        {[0, 1, 2, 3, 5].map((value) => (
          <div key={value} style={{ width: CELL, height: CELL, borderRadius: 2, background: getColor(value) }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>More</span>
      </div>
    </div>
  );
}
