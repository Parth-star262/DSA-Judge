'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export function Skeleton({ className = '', width, height, borderRadius }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
        borderRadius: borderRadius !== undefined ? borderRadius : undefined,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border border-white/5">
      <div className="flex items-center gap-3">
        <Skeleton width={40} height={40} borderRadius={12} />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton width="60%" height={18} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton width="100%" height={60} borderRadius={8} />
      <div className="flex justify-between items-center pt-2">
        <Skeleton width={80} height={24} borderRadius={6} />
        <Skeleton width={100} height={32} borderRadius={999} />
      </div>
    </div>
  );
}

export function SkeletonProblemList() {
  return (
    <div className="flex flex-col gap-4 w-full">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-panel p-5 rounded-2xl flex flex-col gap-3 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton width={28} height={28} borderRadius={8} />
              <Skeleton width={200} height={20} />
            </div>
            <Skeleton width={60} height={24} borderRadius={999} />
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center justify-between py-2 px-3">
                <div className="flex items-center gap-3">
                  <Skeleton width={14} height={14} borderRadius="50%" />
                  <Skeleton width={160 + j * 40} height={16} />
                </div>
                <Skeleton width={70} height={22} borderRadius={6} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6">
      <div className="glass-panel p-6 rounded-2xl flex flex-col items-center gap-4 border border-white/5">
        <Skeleton width={96} height={96} borderRadius="50%" />
        <Skeleton width={140} height={22} />
        <Skeleton width={100} height={14} />
        <div className="w-full flex justify-around pt-4 border-t border-white/5">
          <Skeleton width={60} height={40} />
          <Skeleton width={60} height={40} />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <Skeleton height={220} borderRadius={16} />
      </div>
    </div>
  );
}
