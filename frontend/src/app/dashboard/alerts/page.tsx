'use client';

import { useState, useMemo } from 'react';
import { HeartPulse, Bot, Pill, Info, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useGetAlertsQuery, useMarkAlertReadMutation, useMarkAllAlertsReadMutation } from '@/store/api/baseApi';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import type { AlertSeverity, AlertType } from '@/types';

const TYPE_CONFIG: Record<string, { label: string; Icon: LucideIcon; color: string }> = {
  VITAL_ANOMALY: { label: 'Chỉ số bất thường', Icon: HeartPulse, color: 'border-red-500 bg-red-50/50 dark:bg-red-950/20' },
  AI_SUGGESTION: { label: 'Gợi ý AI', Icon: Bot, color: 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20' },
  MEDICATION: { label: 'Thuốc', Icon: Pill, color: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20' },
  SYSTEM: { label: 'Hệ thống', Icon: Info, color: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' },
};

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; className: string }> = {
  HIGH: { label: 'Cao', className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
  MEDIUM: { label: 'Trung bình', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  LOW: { label: 'Thấp', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
};

export default function AlertsPage() {
  const { toast } = useToast();
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const { data: alerts = [] } = useGetAlertsQuery(readFilter === 'unread' ? { unreadOnly: true } : undefined);
  const [markRead] = useMarkAlertReadMutation();
  const [markAllRead] = useMarkAllAlertsReadMutation();

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      if (severityFilter !== 'all' && (a.severity ?? 'MEDIUM') !== severityFilter) return false;
      return true;
    });
  }, [alerts, typeFilter, severityFilter]);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const handleMarkAll = async () => {
    await markAllRead();
    toast('Đã đánh dấu tất cả đã đọc', 'success');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Cảnh báo"
        subtitle={`${unreadCount} cảnh báo chưa đọc`}
        action={unreadCount > 0 ? <button onClick={handleMarkAll} className="btn-secondary text-sm no-print touch-target">Đánh dấu tất cả đã đọc</button> : undefined}
      />

      <div className="flex flex-wrap gap-2 section">
        {(['all', 'unread'] as const).map((f) => (
          <button key={f} onClick={() => setReadFilter(f)} className={`filter-pill ${readFilter === f ? 'filter-pill-active' : 'filter-pill-inactive'}`}>
            {f === 'all' ? 'Tất cả' : 'Chưa đọc'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 section-sm">
        <select className="input text-sm py-1.5 w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as AlertType | 'all')}>
          <option value="all">Tất cả loại</option>
          <option value="VITAL_ANOMALY">Chỉ số bất thường</option>
          <option value="AI_SUGGESTION">Gợi ý AI</option>
          <option value="MEDICATION">Thuốc</option>
          <option value="SYSTEM">Hệ thống</option>
        </select>
        <select className="input text-sm py-1.5 w-auto" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | 'all')}>
          <option value="all">Tất cả mức độ</option>
          <option value="HIGH">Cao</option>
          <option value="MEDIUM">Trung bình</option>
          <option value="LOW">Thấp</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card">
            <EmptyState IconComponent={CheckCircle2} icon="" title="Không có cảnh báo" description="Mọi thứ đang ổn định" />
          </div>
        ) : (
          filtered.map((a) => {
            const cfg = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.SYSTEM;
            const sev = SEVERITY_CONFIG[a.severity ?? 'MEDIUM'];
            const { Icon } = cfg;
            return (
              <div key={a.id} className={`card border-l-4 ${cfg.color} ${!a.isRead ? 'shadow-sm' : 'opacity-80'}`}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--surface)' }}>
                      <Icon className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--surface)' }}>{cfg.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sev.className}`}>{sev.label}</span>
                        {!a.isRead && <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">Mới</span>}
                      </div>
                      <p className="font-semibold text-heading">{a.title}</p>
                      <p className="text-body text-sm mt-1 break-words">{a.message}</p>
                      <p className="text-caption text-xs mt-2">{new Date(a.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  {!a.isRead && (
                    <button onClick={() => markRead(a.id)} className="btn-secondary text-sm shrink-0 w-full sm:w-auto touch-target">Đã đọc</button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
