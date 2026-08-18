'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import type { Alert, AlertSeverity } from '@/types';
import {
  addSeenAlertIds,
  getLastAlertAt,
  getNotificationsEnabled,
  getSeenAlertIds,
  sendUnreadCountToDesktop,
  setLastAlertAt,
  showBrowserNotification,
} from '@/lib/notifications';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const POLL_ACTIVE_MS = 30000;
const POLL_HIDDEN_MS = 120000;

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
};

function shouldNotify(alert: Alert): boolean {
  return SEVERITY_RANK[alert.severity ?? 'MEDIUM'] >= SEVERITY_RANK.MEDIUM;
}

async function fetchAlertsSince(token: string, after: string): Promise<Alert[]> {
  const res = await fetch(`${baseUrl}/alerts/since?after=${encodeURIComponent(after)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

async function fetchUnreadCount(token: string): Promise<number> {
  const res = await fetch(`${baseUrl}/alerts/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return 0;
  const data = (await res.json()) as { count?: number };
  return data.count ?? 0;
}

export function useAlertNotifications() {
  const token = useAppSelector((s) => s.auth.token);
  const router = useRouter();
  const seenRef = useRef(getSeenAlertIds());
  const lastAtRef = useRef(getLastAlertAt());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token || typeof window === 'undefined') return;

    const poll = async () => {
      if (!getNotificationsEnabled()) {
        const count = await fetchUnreadCount(token);
        sendUnreadCountToDesktop(count);
        return;
      }

      const newAlerts = await fetchAlertsSince(token, lastAtRef.current);
      const unseen = newAlerts.filter(
        (a) => !seenRef.current.has(a.id) && shouldNotify(a),
      );

      for (const alert of unseen) {
        showBrowserNotification(alert.title, alert.message, alert.id);
        seenRef.current.add(alert.id);
      }

      if (unseen.length > 0) {
        addSeenAlertIds(unseen.map((a) => a.id));
        const latest = newAlerts[newAlerts.length - 1];
        if (latest) {
          lastAtRef.current = latest.createdAt;
          setLastAlertAt(latest.createdAt);
        }
      }

      const count = await fetchUnreadCount(token);
      sendUnreadCountToDesktop(count);
    };

    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const delay = document.visibilityState === 'visible' ? POLL_ACTIVE_MS : POLL_HIDDEN_MS;
      timerRef.current = setTimeout(async () => {
        await poll();
        schedule();
      }, delay);
    };

    poll();
    schedule();

    const onVisibility = () => schedule();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [token, router]);
}
