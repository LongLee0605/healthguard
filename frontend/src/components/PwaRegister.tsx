'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const skipSw =
      process.env.NODE_ENV !== 'production' || /Electron/i.test(navigator.userAgent);

    if (skipSw) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      }).catch(() => undefined);
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  }, []);

  return null;
}
