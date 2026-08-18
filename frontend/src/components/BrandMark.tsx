'use client';

import { useId } from 'react';

interface BrandMarkProps {
  size?: number;
  className?: string;
}

/** App icon (shield + ECG). Same artwork as brand/icon.svg. */
export default function BrandMark({ size = 40, className = '' }: BrandMarkProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 rounded-[22%] shadow-sm shadow-teal-600/20 ${className}`.trim()}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="64" y1="64" x2="448" y2="448" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id={`${uid}-shine`} x1="256" y1="96" x2="256" y2="416" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill={`url(#${uid}-bg)`} />
      <rect width="512" height="512" rx="112" fill={`url(#${uid}-shine)`} />
      <path d="M256 108c-52 0-96 28-120 72-8 14-12 30-12 46v44c0 62 48 118 108 142 8 3 16 3 24 0 60-24 108-80 108-142v-44c0-16-4-32-12-46-24-44-68-72-120-72z" fill="#ffffff" fillOpacity="0.12" />
      <path d="M256 124c-44 0-82 24-102 62-6 11-9 24-9 36v38c0 52 40 100 92 120 6 2 13 2 19 0 52-20 92-68 92-120v-38c0-12-3-25-9-36-20-38-58-62-102-62z" stroke="#ffffff" strokeWidth="18" strokeLinejoin="round" />
      <path d="M168 268h48l20-44 24 88 20-44h44" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M300 196h28v28h-28zM314 182h28v56h-28z" fill="#ffffff" />
    </svg>
  );
}
