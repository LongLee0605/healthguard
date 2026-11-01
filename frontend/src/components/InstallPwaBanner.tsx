'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import BrandMark from '@/components/BrandMark';
import { isDesktopApp } from '@/lib/desktop';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'hg:pwa-install-dismissed';

export default function InstallPwaBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || isDesktopApp()) return;
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true');

    const handler = (e: Event) => {
      if (localStorage.getItem(DISMISS_KEY) === 'true') return;
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (dismissed || !deferred) return null;

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
    setDeferred(null);
  };

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-sm z-40 animate-slide-up">
      <div className="card p-4 flex items-start gap-3 shadow-lg border border-teal-500/30">
        <BrandMark size={40} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-heading text-sm">Cài đặt HealthGuard</p>
          <p className="text-caption text-xs mt-0.5">Thêm vào màn hình chính để truy cập nhanh như ứng dụng.</p>
          <div className="flex gap-2 mt-3">
            <button onClick={install} className="btn-primary text-xs py-1.5 px-3">Cài đặt</button>
            <button onClick={dismiss} className="btn-ghost text-xs py-1.5 px-3">Bỏ qua</button>
          </div>
        </div>
        <button onClick={dismiss} className="btn-ghost p-1 shrink-0" aria-label="Đóng">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
