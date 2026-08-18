'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, HeartPulse, FileText, Menu } from 'lucide-react';

const TABS = [
  { href: '/dashboard', label: 'Trang chủ', Icon: Home, match: (p: string) => p === '/dashboard' },
  { href: '/dashboard/chat', label: 'Chat', Icon: MessageCircle, match: (p: string) => p.startsWith('/dashboard/chat') },
  { href: '/dashboard/vitals', label: 'Chỉ số', Icon: HeartPulse, match: (p: string) => p.startsWith('/dashboard/vitals') },
  { href: '/dashboard/symptoms', label: 'Triệu chứng', Icon: FileText, match: (p: string) => p.startsWith('/dashboard/symptoms') },
];

interface Props {
  onMenuOpen: () => void;
}

export default function MobileBottomNav({ onMenuOpen }: Props) {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 no-print bottom-nav-safe backdrop-blur-md"
      style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 92%, transparent)', borderTop: '1px solid var(--border-subtle)' }}
      aria-label="Điều hướng chính"
    >
      <div className="grid grid-cols-5 h-16">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 text-[10px] sm:text-xs font-medium transition-colors touch-target ${
                active ? 'text-teal-700 dark:text-teal-400' : 'text-caption'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-teal-600 dark:bg-teal-400" />
              )}
              <tab.Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="truncate max-w-full px-0.5">{tab.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMenuOpen}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] sm:text-xs font-medium text-caption touch-target"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
          <span>Thêm</span>
        </button>
      </div>
    </nav>
  );
}
