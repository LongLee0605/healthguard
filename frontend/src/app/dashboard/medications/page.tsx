'use client';

import { useState } from 'react';
import { Pill, Clock, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  useGetMedicationsQuery,
  useCreateMedicationMutation,
  useUpdateMedicationMutation,
  useDeleteMedicationMutation,
  useGetMedicationTodayQuery,
  useGetMedicationAdherenceQuery,
  useLogMedicationDoseMutation,
} from '@/store/api/baseApi';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default function MedicationsPage() {
  const { toast } = useToast();
  const { data: items = [] } = useGetMedicationsQuery();
  const { data: today = [] } = useGetMedicationTodayQuery();
  const { data: adherence } = useGetMedicationAdherenceQuery(7);
  const [createMedication, { isLoading }] = useCreateMedicationMutation();
  const [updateMedication] = useUpdateMedicationMutation();
  const [deleteMedication] = useDeleteMedicationMutation();
  const [logDose] = useLogMedicationDoseMutation();
  const [form, setForm] = useState({ medicationName: '', dosage: '', schedule: '08:00' });
  const [extraTime, setExtraTime] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const times = [form.schedule.trim()];
    if (extraTime.trim()) times.push(extraTime.trim());
    const schedule = times.join(', ');
    if (!/\d{1,2}:\d{2}/.test(schedule)) {
      toast('Lịch uống phải theo định dạng HH:mm (vd: 08:00, 20:00)', 'error');
      return;
    }
    try {
      await createMedication({ ...form, schedule }).unwrap();
      setForm({ medicationName: '', dosage: '', schedule: '08:00' });
      setExtraTime('');
      toast('Đã thêm nhắc uống thuốc', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Lỗi', 'error');
    }
  };

  const markDose = async (medicationId: string, scheduledTime: string, status: 'TAKEN' | 'MISSED') => {
    try {
      await logDose({ medicationId, scheduledTime, status }).unwrap();
      toast(status === 'TAKEN' ? 'Đã ghi nhận uống thuốc' : 'Đã ghi nhận bỏ lỡ', status === 'TAKEN' ? 'success' : 'info');
    } catch {
      toast('Không thể ghi nhận', 'error');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await updateMedication({ id, isActive: !isActive });
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa nhắc nhở này?')) return;
    await deleteMedication(id);
    toast('Đã xóa', 'info');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Nhắc uống thuốc"
        subtitle="Theo dõi lịch uống, ghi nhận tuân thủ và nhận nhắc đúng giờ"
      />

      {adherence && (
        <div className="card section grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-2">
            <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{adherence.adherenceRate}%</p>
            <p className="text-xs text-caption">Tuân thủ 7 ngày</p>
          </div>
          <div className="text-center p-2">
            <p className="text-2xl font-bold text-green-600">{adherence.taken}</p>
            <p className="text-xs text-caption">Đã uống</p>
          </div>
          <div className="text-center p-2">
            <p className="text-2xl font-bold text-red-500">{adherence.missed}</p>
            <p className="text-xs text-caption">Bỏ lỡ</p>
          </div>
          <div className="text-center p-2 flex flex-col items-center justify-center">
            <TrendingUp className="w-5 h-5 text-teal-600 mb-1" />
            <p className="text-xs text-caption">Mục tiêu ≥ 80%</p>
          </div>
        </div>
      )}

      {today.length > 0 && (
        <div className="card section">
          <h2 className="section-title flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" /> Lịch hôm nay
          </h2>
          <div className="stack gap-2">
            {today.map((dose) => (
              <div
                key={`${dose.medicationId}-${dose.scheduledTime}`}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  dose.status === 'TAKEN'
                    ? 'border-green-200 bg-green-50/50 dark:bg-green-900/20'
                    : dose.status === 'MISSED'
                      ? 'border-red-200 bg-red-50/50 dark:bg-red-900/20'
                      : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-heading">{dose.medicationName}</p>
                  <p className="text-xs text-caption">{dose.dosage} • {dose.scheduledTime}</p>
                </div>
                {dose.status === 'PENDING' ? (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => markDose(dose.medicationId, dose.scheduledTime, 'TAKEN')}
                      className="btn-primary text-xs px-2 py-1 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Uống
                    </button>
                    <button
                      type="button"
                      onClick={() => markDose(dose.medicationId, dose.scheduledTime, 'MISSED')}
                      className="btn-secondary text-xs px-2 py-1"
                    >
                      Bỏ
                    </button>
                  </div>
                ) : (
                  <span className={`text-xs font-medium flex items-center gap-1 ${
                    dose.status === 'TAKEN' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {dose.status === 'TAKEN' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {dose.status === 'TAKEN' ? 'Đã uống' : 'Bỏ lỡ'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 grid-gap">
        <form onSubmit={handleSubmit} className="card lg:col-span-1 stack h-fit">
          <h2 className="section-title mb-0 flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" /> Thêm thuốc mới
          </h2>
          <div>
            <label className="input-label">Tên thuốc</label>
            <input className="input" value={form.medicationName} onChange={(e) => setForm({ ...form, medicationName: e.target.value })} placeholder="Paracetamol..." required />
          </div>
          <div>
            <label className="input-label">Liều lượng</label>
            <input className="input" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="500mg, 1 viên..." required />
          </div>
          <div>
            <label className="input-label">Giờ uống chính</label>
            <input type="time" className="input" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} required />
          </div>
          <div>
            <label className="input-label">Giờ uống thêm (tùy chọn)</label>
            <input type="time" className="input" value={extraTime} onChange={(e) => setExtraTime(e.target.value)} />
            <p className="text-caption text-xs mt-1">Hỗ trợ nhiều giờ: 08:00, 20:00</p>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isLoading}>{isLoading ? 'Đang lưu...' : 'Thêm nhắc nhở'}</button>
        </form>

        <div className="lg:col-span-2 stack">
          {items.length === 0 ? (
            <div className="card">
              <EmptyState IconComponent={Pill} icon="" title="Chưa có thuốc nào" description="Thêm thuốc để nhận nhắc uống đúng giờ" />
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className={`card-compact ${!item.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.isActive ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <Pill className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-heading text-sm">{item.medicationName}</p>
                    <p className="text-caption text-sm">{item.dosage}</p>
                    <p className="text-xs text-teal-700 dark:text-teal-400 mt-0.5 font-medium flex items-center gap-1 flex-wrap">
                      <Clock className="w-3 h-3 shrink-0" />
                      {(item.scheduleTimes ?? item.schedule.split(',')).map((t) => t.trim()).join(' • ')}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button onClick={() => toggleActive(item.id, item.isActive)} className="btn-secondary text-sm touch-target">{item.isActive ? 'Tạm dừng' : 'Kích hoạt'}</button>
                  <button onClick={() => remove(item.id)} className="btn-danger text-sm touch-target">Xóa</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
