'use client';

import { useState } from 'react';
import {
  FileText,
  HeartPulse,
  Bot,
  Bell,
  Pill,
  Filter,
  History,
} from 'lucide-react';
import { useGetTimelineQuery } from '@/store/api/baseApi';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/LoadingSkeleton';

const TYPE_FILTERS = [
  { id: '', label: 'Tất cả' },
  { id: 'symptom', label: 'Triệu chứng' },
  { id: 'vital', label: 'Chỉ số' },
  { id: 'medication', label: 'Thuốc' },
  { id: 'ai', label: 'AI' },
  { id: 'alert', label: 'Cảnh báo' },
];

const TYPE_ICONS = {
  symptom: FileText,
  vital: HeartPulse,
  ai: Bot,
  alert: Bell,
  medication: Pill,
};

const TYPE_COLORS: Record<string, string> = {
  symptom: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  vital: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
  ai: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  alert: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  medication: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
};

export default function TimelinePage() {
  const [days, setDays] = useState(30);
  const [typeFilter, setTypeFilter] = useState('');
  const { data: items = [], isLoading } = useGetTimelineQuery({ days, type: typeFilter || undefined });

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Nhật ký sức khỏe"
        subtitle="Toàn bộ hoạt động sức khỏe theo thời gian — triệu chứng, chỉ số, thuốc, AI và cảnh báo"
      />

      <div className="flex flex-wrap gap-2 section">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              days === d ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-caption'
            }`}
          >
            {d} ngày
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 section">
        <Filter className="w-4 h-4 text-caption self-center" />
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setTypeFilter(f.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              typeFilter === f.id ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-caption'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            IconComponent={History}
            icon=""
            title="Chưa có hoạt động"
            description="Ghi triệu chứng, chỉ số hoặc uống thuốc để thấy nhật ký tại đây"
          />
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="stack gap-0">
            {items.map((item) => {
              const Icon = TYPE_ICONS[item.type as keyof typeof TYPE_ICONS] ?? FileText;
              const color = TYPE_COLORS[item.type] ?? TYPE_COLORS.symptom;
              const date = new Date(item.timestamp);
              return (
                <div key={`${item.type}-${item.id}`} className="relative pl-12 pb-6">
                  <div className={`absolute left-2.5 w-5 h-5 rounded-full flex items-center justify-center ${color}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="card-compact">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-heading truncate">{item.title}</p>
                        <p className="text-caption text-sm mt-0.5">{item.subtitle}</p>
                      </div>
                      <time className="text-xs text-caption shrink-0 whitespace-nowrap">
                        {date.toLocaleDateString('vi-VN')} {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
