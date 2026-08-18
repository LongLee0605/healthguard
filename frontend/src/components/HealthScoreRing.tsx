'use client';

import { useEffect, useState } from 'react';

export function HealthScoreRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Tốt' : score >= 60 ? 'Trung bình' : 'Cần chú ý';

  useEffect(() => {
    const duration = 1000;
    const steps = 40;
    const increment = score / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimated(score);
        clearInterval(timer);
      } else {
        setAnimated(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28 sm:w-36 sm:h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" className="dark:stroke-slate-700" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-heading">{animated}</span>
          <span className="text-caption text-xs">/100</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold" style={{ color }}>{label}</p>
    </div>
  );
}
