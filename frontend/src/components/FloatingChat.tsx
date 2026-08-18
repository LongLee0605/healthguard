'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FloatingChat() {
  const pathname = usePathname();
  if (pathname === '/dashboard/chat') return null;

  return (
    <div className="fixed right-4 z-50 no-print floating-safe group lg:right-6">
      <Link
        href="/dashboard/chat"
        className="relative flex items-center gap-2 bg-gradient-to-br from-violet-700 to-teal-600 hover:from-violet-600 hover:to-teal-500 rounded-full shadow-lg shadow-teal-500/25 hover:scale-105 transition-all pl-3 pr-4 py-3 touch-target"
        title="Chat với AI"
      >
        <span className="text-xl">🤖</span>
        <span className="text-white font-semibold text-sm hidden sm:block max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
          Hỏi AI
        </span>
      </Link>
    </div>
  );
}
