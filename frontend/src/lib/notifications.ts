const NOTIFICATIONS_KEY = 'hg:notifications';
const LAST_ALERT_AT_KEY = 'hg:lastAlertAt';
const SEEN_ALERT_IDS_KEY = 'hg:seenAlertIds';

export function getNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(NOTIFICATIONS_KEY) !== 'false';
}

export function setNotificationsEnabled(enabled: boolean) {
  localStorage.setItem(NOTIFICATIONS_KEY, enabled ? 'true' : 'false');
}

export function getLastAlertAt(): string {
  if (typeof window === 'undefined') return new Date(0).toISOString();
  return localStorage.getItem(LAST_ALERT_AT_KEY) ?? new Date(0).toISOString();
}

export function setLastAlertAt(iso: string) {
  localStorage.setItem(LAST_ALERT_AT_KEY, iso);
}

export function getSeenAlertIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SEEN_ALERT_IDS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function addSeenAlertIds(ids: string[]) {
  const seen = getSeenAlertIds();
  ids.forEach((id) => seen.add(id));
  const trimmed = [...seen].slice(-200);
  localStorage.setItem(SEEN_ALERT_IDS_KEY, JSON.stringify(trimmed));
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function showBrowserNotification(title: string, body: string, alertId?: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (!getNotificationsEnabled()) return;

  const notification = new Notification(title, {
    body,
    icon: '/icon-192.png',
    tag: alertId ?? title,
  });

  notification.onclick = () => {
    window.focus();
    window.location.href = '/dashboard/alerts';
    notification.close();
  };

  const desktop = (window as Window & { healthguard?: { showNotification: (p: { title: string; body: string; alertId?: string }) => void; setUnreadCount: (n: number) => void } }).healthguard;
  if (desktop?.showNotification) {
    desktop.showNotification({ title, body, alertId });
  }
}

export function sendUnreadCountToDesktop(count: number) {
  const desktop = (window as Window & { healthguard?: { setUnreadCount: (n: number) => void } }).healthguard;
  desktop?.setUnreadCount?.(count);
}
