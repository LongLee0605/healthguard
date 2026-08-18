import { URGENCY_LABELS, type UrgencyLevel } from '@/types';

export function UrgencyBadge({ level }: { level: UrgencyLevel | string }) {
  const map: Record<string, string> = {
    LOW: 'badge-low',
    MEDIUM: 'badge-medium',
    HIGH: 'badge-high',
  };
  return (
    <span className={map[level] ?? 'badge-low'}>
      {URGENCY_LABELS[level as UrgencyLevel] ?? level}
    </span>
  );
}
