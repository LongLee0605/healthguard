'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { NAV_ITEMS } from '@/components/navItems';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_ITEMS;
    return NAV_ITEMS.filter((item) =>
      `${item.label} ${item.hint} ${item.group}`.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  const go = (href: string) => {
    router.push(href);
    onClose();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      go(results[active].href);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tìm trang"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border shadow-lg animate-scale-in"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-subtle)' }}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 px-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <Search className="w-4 h-4 text-caption shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm trang hoặc việc cần làm..."
            className="w-full bg-transparent py-3.5 text-sm text-heading outline-none placeholder:text-caption"
            aria-label="Từ khóa"
          />
          <kbd className="kbd">Esc</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-sm text-center text-caption">Không có trang khớp với từ khóa này</li>
          ) : (
            results.map((item, index) => {
              const selected = index === active;
              return (
                <li key={item.href}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(item.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${
                      selected ? 'bg-teal-50 dark:bg-teal-950/40' : ''
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${selected ? 'bg-teal-600 text-white' : 'bg-[var(--bg)] text-caption'}`}>
                      <item.Icon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-heading">{item.label}</span>
                      <span className="block text-xs text-caption">{item.group}</span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
