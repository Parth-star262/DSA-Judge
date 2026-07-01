'use client';

import { motion } from 'framer-motion';
import { Award, Sparkles } from 'lucide-react';

interface BadgeItem {
  id: string;
  badgeType: string;
  awardedAt?: string;
}

interface BadgeMeta {
  name: string;
  description: string;
}

interface BadgeGalleryProps {
  badges: BadgeItem[];
  badgeMeta: Record<string, BadgeMeta>;
}

export default function BadgeGallery({ badges, badgeMeta }: BadgeGalleryProps) {
  if (!badges.length) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-slate-400">
        No badges unlocked yet. Keep solving to earn your first one.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {badges.map((badge, index) => {
        const meta = badgeMeta[badge.badgeType] || {
          name: badge.badgeType.replace(/_/g, ' '),
          description: 'Badge earned through consistent progress',
        };

        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.92, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/10 via-white/[0.03] to-transparent p-4 shadow-[0_0_24px_rgba(245,158,11,0.08)]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_35%)]" />
            <div className="relative flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.16)]">
                <Award size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-amber-200 font-semibold">
                  <Sparkles size={14} />
                  <span className="truncate">{meta.name}</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-300">{meta.description}</p>
                {badge.awardedAt && (
                  <p className="mt-3 text-xs uppercase tracking-[0.22em] text-amber-300/70">
                    Unlocked {new Date(badge.awardedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}