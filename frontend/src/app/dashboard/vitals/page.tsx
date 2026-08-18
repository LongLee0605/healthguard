'use client';



import { useState } from 'react';

import { Trash2 } from 'lucide-react';

import { useToast } from '@/context/ToastContext';

import type { VitalSign } from '@/types';

import { VITAL_LABELS, VITAL_SOURCE_LABELS } from '@/types';

import {

  useGetVitalsQuery,

  useCreateVitalMutation,

  useDeleteVitalMutation,

} from '@/store/api/baseApi';

import VitalChart from '@/components/VitalChart';
import DeviceSyncPanel from '@/components/DeviceSyncPanel';
import PageHeader from '@/components/PageHeader';

import EmptyState from '@/components/EmptyState';

import QueryError from '@/components/QueryError';

import LoadingSkeleton from '@/components/LoadingSkeleton';

import { HeartPulse } from 'lucide-react';



const TYPES: VitalSign['type'][] = ['BLOOD_PRESSURE', 'BLOOD_SUGAR', 'WEIGHT', 'HEART_RATE', 'TEMPERATURE', 'SPO2'];

const CHART_DAYS = [7, 30, 90] as const;



export default function VitalsPage() {

  const { toast } = useToast();

  const { data: vitals = [], isLoading, isError, refetch } = useGetVitalsQuery();

  const [createVital, { isLoading: saving }] = useCreateVitalMutation();

  const [deleteVital] = useDeleteVitalMutation();

  const [chartType, setChartType] = useState<VitalSign['type']>('BLOOD_PRESSURE');

  const [chartDays, setChartDays] = useState<number>(30);

  const [form, setForm] = useState({ type: 'BLOOD_PRESSURE' as VitalSign['type'], value: '', valueSecondary: '', note: '' });



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    const num = parseFloat(form.value);

    if (Number.isNaN(num) || num <= 0) {

      toast('Giá trị không hợp lệ', 'error');

      return;

    }

    if (form.type === 'BLOOD_PRESSURE' && (!form.valueSecondary || parseFloat(form.valueSecondary) <= 0)) {

      toast('Vui lòng nhập tâm trương', 'error');

      return;

    }

    try {

      await createVital({

        type: form.type,

        value: num,

        valueSecondary: form.valueSecondary ? parseFloat(form.valueSecondary) : undefined,

        note: form.note || undefined,

      }).unwrap();

      setForm({ type: form.type, value: '', valueSecondary: '', note: '' });

      setChartType(form.type);

      toast('Đã lưu chỉ số', 'success');

    } catch (err) {

      toast(err instanceof Error ? err.message : 'Lỗi', 'error');

    }

  };



  const handleDelete = async (id: string) => {

    if (!confirm('Xóa chỉ số này?')) return;

    try {

      await deleteVital(id).unwrap();

      toast('Đã xóa chỉ số', 'success');

    } catch (err) {

      toast(err instanceof Error ? err.message : 'Không thể xóa', 'error');

    }

  };



  const selectType = (t: VitalSign['type']) => {

    setForm({ ...form, type: t });

    setChartType(t);

  };



  if (isLoading) return <LoadingSkeleton />;



  return (

    <div className="animate-fade-in">

      <PageHeader title="Chỉ số sinh hiệu" subtitle="Theo dõi huyết áp, đường huyết và cân nặng" />

      {isError && <QueryError onRetry={refetch} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 grid-gap section">

        <div className="lg:col-span-1 stack">
          <form onSubmit={handleSubmit} className="card stack h-fit">

          <h2 className="section-title mb-0">Ghi nhận chỉ số</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

            {TYPES.map((t) => (

              <button key={t} type="button" onClick={() => selectType(t)} className={`chip text-xs sm:text-sm ${form.type === t ? 'chip-active' : ''}`}>{VITAL_LABELS[t]}</button>

            ))}

          </div>

          <div>

            <label className="input-label">{form.type === 'BLOOD_PRESSURE' ? 'Tâm thu (mmHg)' : 'Giá trị'}</label>

            <input className="input text-base" type="number" inputMode="decimal" step="0.1" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />

          </div>

          {form.type === 'BLOOD_PRESSURE' && (

            <div>

              <label className="input-label">Tâm trương (mmHg)</label>

              <input className="input text-base" type="number" value={form.valueSecondary} onChange={(e) => setForm({ ...form, valueSecondary: e.target.value })} required />

            </div>

          )}

          <div>

            <label className="input-label">Ghi chú</label>

            <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Tùy chọn — sau ăn, buổi sáng..." />

          </div>

          <button type="submit" className="btn-primary w-full touch-target" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu chỉ số'}</button>

          </form>

          <DeviceSyncPanel />
        </div>

        <div className="card lg:col-span-2 min-w-0">

          <div className="flex flex-wrap gap-2 mb-3">

            {TYPES.map((t) => (

              <button key={t} type="button" onClick={() => setChartType(t)} className={`filter-pill ${chartType === t ? 'filter-pill-active' : 'filter-pill-inactive'}`}>{VITAL_LABELS[t]}</button>

            ))}

          </div>

          <div className="flex gap-2 mb-3">

            {CHART_DAYS.map((d) => (

              <button key={d} type="button" onClick={() => setChartDays(d)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${chartDays === d ? 'bg-teal-700 text-white border-teal-700' : 'border-[var(--border-subtle)] text-caption'}`}>

                {d} ngày

              </button>

            ))}

          </div>

          <VitalChart type={chartType} days={chartDays} />

        </div>

      </div>

      <div className="card">

        <h2 className="section-title">Lịch sử</h2>

        {vitals.length === 0 ? (

          <EmptyState icon="" title="Chưa có chỉ số" description="Bắt đầu ghi nhận chỉ số sinh hiệu" IconComponent={HeartPulse} />

        ) : (

          <>

            <div className="cards-mobile">

              {vitals.map((v) => (

                <div key={v.id} className="data-card flex justify-between items-start gap-2">

                  <div>

                    <p className="font-semibold text-heading text-sm">{VITAL_LABELS[v.type]}</p>

                    <p className="text-teal-700 dark:text-teal-400 font-bold text-sm">{v.valueSecondary ? `${v.value}/${v.valueSecondary}` : v.value} {v.unit}</p>

                    <p className="text-caption text-xs mt-1">{new Date(v.recordedAt).toLocaleString('vi-VN')}</p>
                    {v.source && v.source !== 'MANUAL' && (
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">
                        {VITAL_SOURCE_LABELS[v.source] ?? v.source}
                        {v.deviceName ? ` · ${v.deviceName}` : ''}
                      </span>
                    )}

                  </div>

                  <button type="button" onClick={() => handleDelete(v.id)} className="p-1.5 text-red-600 opacity-60 hover:opacity-100" aria-label="Xóa">

                    <Trash2 className="w-4 h-4" />

                  </button>

                </div>

              ))}

            </div>

            <div className="overflow-safe">

              <table className="table-desktop">

                <thead><tr className="border-b text-left text-caption"><th className="pb-3">Loại</th><th className="pb-3">Giá trị</th><th className="pb-3">Nguồn</th><th className="pb-3">Thời gian</th><th className="pb-3">Ghi chú</th><th className="pb-3 w-10" /></tr></thead>

                <tbody>

                  {vitals.map((v) => (

                    <tr key={v.id} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>

                      <td className="py-2.5 font-medium text-heading">{VITAL_LABELS[v.type]}</td>

                      <td className="py-2.5 text-teal-700 dark:text-teal-400 font-semibold">{v.valueSecondary ? `${v.value}/${v.valueSecondary}` : v.value} {v.unit}</td>

                      <td className="py-2.5 text-caption text-xs">
                        {v.source && v.source !== 'MANUAL'
                          ? `${VITAL_SOURCE_LABELS[v.source] ?? v.source}${v.deviceName ? ` (${v.deviceName})` : ''}`
                          : 'Nhập tay'}
                      </td>

                      <td className="py-2.5 text-caption">{new Date(v.recordedAt).toLocaleString('vi-VN')}</td>

                      <td className="py-2.5 text-caption">{v.note ?? '—'}</td>

                      <td className="py-2.5">

                        <button type="button" onClick={() => handleDelete(v.id)} className="text-red-600 hover:opacity-80" aria-label="Xóa"><Trash2 className="w-4 h-4" /></button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </>

        )}

      </div>

    </div>

  );

}


