'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCircle2 } from 'lucide-react';
import { useGetAlertsQuery } from '@/store/api/baseApi';

export default function NotificationBell() {
  const { data: alerts = [] } = useGetAlertsQuery({ unreadOnly: true }, { pollingInterval: 60000 });
  const [open, setOpen] = useState(false);
  const count = alerts.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative btn-ghost p-2 rounded-xl"
        aria-label="Thông báo"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[var(--surface)]">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl z-50 overflow-hidden animate-scale-in"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 className="font-semibold text-sm text-heading">Cảnh báo ({count})</h3>
              <Link href="/dashboard/alerts" onClick={() => setOpen(false)} className="text-xs text-teal-700 dark:text-teal-400 font-medium hover:underline">
                Xem tất cả
              </Link>
            </div>
            {count === 0 ? (
              <div className="p-6 text-center text-caption text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                Không có cảnh báo mới
              </div>
            ) : (
              <ul className="max-h-64 overflow-y-auto">
                {alerts.slice(0, 5).map((a) => (
                  <li key={a.id} className="px-4 py-3 hover:bg-[var(--bg)] transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <p className="text-sm font-medium text-heading">{a.title}</p>
                    <p className="text-caption text-xs mt-0.5 line-clamp-2">{a.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
