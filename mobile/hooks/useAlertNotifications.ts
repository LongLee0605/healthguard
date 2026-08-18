import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { pollAlertsAndNotify, registerForNotifications } from '../lib/notifications';

const POLL_MS = 30000;

export function useAlertNotifications(enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    registerForNotifications().then(() => pollAlertsAndNotify());

    timerRef.current = setInterval(() => {
      if (AppState.currentState === 'active') {
        pollAlertsAndNotify();
      }
    }, POLL_MS);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') pollAlertsAndNotify();
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      sub.remove();
    };
  }, [enabled]);
}
