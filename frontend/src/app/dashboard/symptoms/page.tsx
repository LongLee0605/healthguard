'use client';

import { useState } from 'react';
import { Trash2, TrendingUp, AlertTriangle } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { SYMPTOM_TEMPLATES } from '@/types';
import {
  useGetSymptomsQuery,
  useCreateSymptomMutation,
  useDeleteSymptomMutation,
  useGetSymptomTrendsQuery,
} from '@/store/api/baseApi';
import VoiceInput from '@/components/VoiceInput';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import QueryError from '@/components/QueryError';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { FileText } from 'lucide-react';

function SeverityBar({ value }: { value: number }) {
  const color = value <= 3 ? 'bg-emerald-500' : value <= 6 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${value * 10}%` }} />
    </div>
  );
}

export default function SymptomsPage() {
  const { toast } = useToast();
  const { data: symptoms = [], isLoading, isError, refetch } = useGetSymptomsQuery();
  const { data: trends = [] } = useGetSymptomTrendsQuery(30);
  const [createSymptom, { isLoading: saving }] = useCreateSymptomMutation();
  const [deleteSymptom] = useDeleteSymptomMutation();
  const [form, setForm] = useState({ description: '', severity: 5, bodyPart: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSymptom({ description: form.description, severity: form.severity, bodyPart: form.bodyPart || undefined }).unwrap();
      setForm({ description: '', severity: 5, bodyPart: '' });
      toast('Đã lưu triệu chứng', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Lỗi', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa triệu chứng này?')) return;
    try {
      await deleteSymptom(id).unwrap();
      toast('Đã xóa triệu chứng', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không thể xóa', 'error');
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Triệu chứng" subtitle="Ghi nhận và theo dõi các triệu chứng sức khỏe" />
      {isError && <QueryError onRetry={refetch} />}

      {trends.length > 0 && (
        <div className="card section">
          <h2 className="section-title flex items-center gap-2"><TrendingUp className="w-5 h-5 text-teal-600" /> Xu hướng 30 ngày</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trends.slice(0, 6).map((t) => (
              <div key={t.bodyPart} className={`p-3 rounded-xl border ${t.trend === 'RECURRING' ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-heading">{t.bodyPart}</p>
                  {t.trend === 'RECURRING' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                </div>
                <p className="text-xs text-caption mt-1">{t.count} lần • TB mức {t.avgSeverity}/10</p>
                {t.trend === 'RECURRING' && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Triệu chứng lặp lại — nên theo dõi</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 grid-gap">
        <form onSubmit={handleSubmit} className="card stack h-fit">
          <h2 className="section-title mb-0">Ghi nhận triệu chứng</h2>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_TEMPLATES.map((t) => (
              <button key={t.label} type="button" onClick={() => setForm({ description: t.description, severity: 5, bodyPart: t.bodyPart })} className="chip text-xs sm:text-sm">{t.label}</button>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="input-label mb-0">Mô tả</label>
              <VoiceInput onResult={(text) => setForm({ ...form, description: form.description ? `${form.description} ${text}` : text })} />
            </div>
            <textarea className="input min-h-[100px] text-base" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div>
            <label className="input-label">Mức độ: {form.severity}/10</label>
            <input type="range" min={1} max={10} value={form.severity} onChange={(e) => setForm({ ...form, severity: parseInt(e.target.value) })} className="w-full accent-teal-600" />
            <SeverityBar value={form.severity} />
          </div>
          <div>
            <label className="input-label">Vị trí cơ thể</label>
            <input className="input" value={form.bodyPart} onChange={(e) => setForm({ ...form, bodyPart: e.target.value })} placeholder="Đầu, ngực, bụng..." />
          </div>
          <button type="submit" className="btn-primary w-full touch-target" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu triệu chứng'}</button>
        </form>
        <div className="card">
          <h2 className="section-title">Lịch sử ({symptoms.length})</h2>
          {symptoms.length === 0 ? (
            <EmptyState icon="" title="Chưa có triệu chứng" description="Ghi nhận triệu chứng để theo dõi" IconComponent={FileText} />
          ) : (
            <ul className="space-y-2.5 max-h-[480px] overflow-y-auto">
              {symptoms.map((s) => (
                <li key={s.id} className="p-3 rounded-lg group" style={{ backgroundColor: 'var(--bg)' }}>
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-medium text-sm text-heading flex-1">{s.description}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full border" style={{ borderColor: 'var(--border-subtle)' }}>{s.severity}/10</span>
                      <button type="button" onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-red-600 opacity-60 hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all" aria-label="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {s.bodyPart && <p className="text-caption text-xs mt-0.5">📍 {s.bodyPart}</p>}
                  <SeverityBar value={s.severity} />
                  <p className="text-caption text-xs mt-1.5">{new Date(s.recordedAt).toLocaleString('vi-VN')}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
