export interface DesktopBridge {
  platform: string;
  isElectron: boolean;
  version?: string;
  showNotification: (payload: { title: string; body: string; alertId?: string }) => void;
  setUnreadCount: (count: number) => void;
  exportReportPdf?: () => Promise<{
    success: boolean;
    cancelled?: boolean;
    filePath?: string;
    message?: string;
  }>;
}

export function getDesktopBridge(): DesktopBridge | null {
  if (typeof window === 'undefined') return null;
  const bridge = (window as Window & { healthguard?: DesktopBridge }).healthguard;
  if (!bridge?.isElectron) return null;
  return bridge;
}

export function isDesktopApp(): boolean {
  return getDesktopBridge() !== null;
}
