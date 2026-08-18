'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const STYLES = {
  success: 'bg-emerald-600 border-emerald-500',
  error: 'bg-red-600 border-red-500',
  info: 'bg-slate-800 border-slate-600',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed z-[100] flex flex-col gap-2 bottom-[calc(1rem+var(--bottom-nav-h)+var(--safe-bottom))] left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              className={`${STYLES[t.type]} text-white px-4 py-3 rounded-xl shadow-lg animate-slide-up border flex items-start gap-3`}
              role="status"
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
              <p className="text-sm font-medium flex-1 leading-snug">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 opacity-80 hover:opacity-100 transition-opacity"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
