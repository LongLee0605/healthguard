import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Alert, AlertSeverity, MedicationReminder } from '@/types';
import { authApi } from './api';

const NOTIFICATIONS_KEY = 'hg:notifications';
const LAST_ALERT_AT_KEY = 'hg:lastAlertAt';
const SEEN_ALERT_IDS_KEY = 'hg:seenAlertIds';

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function getNotificationsEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
  return val !== 'false';
}

export async function setNotificationsEnabled(enabled: boolean) {
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, enabled ? 'true' : 'false');
}

export async function registerForNotifications(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Cảnh báo sức khỏe',
      importance: Notifications.AndroidImportance.HIGH,
    });
    await Notifications.setNotificationChannelAsync('medications', {
      name: 'Nhắc uống thuốc',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return true;
}

async function getLastAlertAt(): Promise<string> {
  return (await AsyncStorage.getItem(LAST_ALERT_AT_KEY)) ?? new Date(0).toISOString();
}

async function setLastAlertAt(iso: string) {
  await AsyncStorage.setItem(LAST_ALERT_AT_KEY, iso);
}

async function getSeenAlertIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_ALERT_IDS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

async function addSeenAlertIds(ids: string[]) {
  const seen = await getSeenAlertIds();
  ids.forEach((id) => seen.add(id));
  const trimmed = [...seen].slice(-200);
  await AsyncStorage.setItem(SEEN_ALERT_IDS_KEY, JSON.stringify(trimmed));
}

function shouldNotify(alert: Alert): boolean {
  return SEVERITY_RANK[alert.severity ?? 'MEDIUM'] >= SEVERITY_RANK.MEDIUM;
}

export async function pollAlertsAndNotify() {
  if (!(await getNotificationsEnabled())) return;

  try {
    const after = await getLastAlertAt();
    const newAlerts = await authApi<Alert[]>(`/alerts/since?after=${encodeURIComponent(after)}`);
    const seen = await getSeenAlertIds();
    const unseen = newAlerts.filter((a) => !seen.has(a.id) && shouldNotify(a));

    for (const alert of unseen) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: alert.title,
          body: alert.message,
          data: { alertId: alert.id },
        },
        trigger: null,
      });
    }

    if (unseen.length > 0) {
      await addSeenAlertIds(unseen.map((a) => a.id));
      const latest = newAlerts[newAlerts.length - 1];
      if (latest) await setLastAlertAt(latest.createdAt);
    }
  } catch {
    // ignore polling errors when offline
  }
}

function parseScheduleTime(schedule: string): { hour: number; minute: number } | null {
  const match = schedule.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export async function scheduleMedicationNotifications(medications: MedicationReminder[]) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!(await getNotificationsEnabled())) return;

  for (const med of medications) {
    if (!med.isActive) continue;
    const time = parseScheduleTime(med.schedule);
    if (!time) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nhắc uống thuốc',
        body: `${med.medicationName}${med.dosage ? ` — ${med.dosage}` : ''}`,
        data: { medicationId: med.id },
      },
      trigger: {
        hour: time.hour,
        minute: time.minute,
        repeats: true,
        ...(Platform.OS === 'android' ? { channelId: 'medications' } : {}),
      },
    });
  }
}

export async function showTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'HealthGuard',
      body: 'Thông báo thử nghiệm — mọi thứ hoạt động bình thường!',
    },
    trigger: null,
  });
}
