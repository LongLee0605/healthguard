'use client';

import Link from 'next/link';
import { Check, Clock3, Pill } from 'lucide-react';
import { useGetMedicationTodayQuery, useLogMedicationDoseMutation } from '@/store/api/baseApi';
import { useToast } from '@/context/ToastContext';
import type { MedicationTodayItem } from '@/types';

function minutesNow() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function minutesOf(time: string) {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

export default function TodayMedications() {
  const { toast } = useToast();
  const { data: today = [], isLoading } = useGetMedicationTodayQuery();
  const [logDose, { isLoading: saving }] = useLogMedicationDoseMutation();

  const pending = today.filter((item) => item.status === 'PENDING').length;
  const taken = today.filter((item) => item.status === 'TAKEN').length;

  const markTaken = async (item: MedicationTodayItem) => {
    try {
      await logDose({
        medicationId: item.medicationId,
        scheduledTime: item.scheduledTime,
        status: 'TAKEN',
      }).unwrap();
      toast(`Đã ghi nhận ${item.medicationName} lúc ${item.scheduledTime}`, 'success');
    } catch {
      toast('Không ghi nhận được liều thuốc', 'error');
    }
  };

  return (
    <section className="card section">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="section-title mb-1 flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            Thuốc hôm nay
          </h2>
          <p className="text-xs text-caption">
            {isLoading
              ? 'Đang tải lịch uống...'
              : today.length === 0
                ? 'Chưa có lịch uống nào đang bật'
                : `${taken}/${today.length} liều đã uống${pending > 0 ? ` · còn ${pending} liều` : ''}`}
          </p>
        </div>
        <Link href="/dashboard/medications" className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline shrink-0">
          Quản lý thuốc
        </Link>
      </div>

      {!isLoading && today.length === 0 && (
        <Link href="/dashboard/medications" className="btn-secondary text-sm inline-flex">
          Thêm nhắc uống thuốc
        </Link>
      )}

      {today.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {today.map((item) => {
            const due = item.status === 'PENDING' && minutesNow() >= minutesOf(item.scheduledTime);
            return (
              <li
                key={`${item.medicationId}-${item.scheduledTime}`}
                className="data-card flex items-center gap-3"
                style={{ marginTop: 0, ...(due ? { borderColor: '#f59e0b' } : {}) }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-heading truncate">{item.medicationName}</p>
                  <p className="text-xs text-caption mt-0.5 flex items-center gap-1">
                    <Clock3 className="w-3.5 h-3.5" />
                    {item.scheduledTime} · {item.dosage}
                    {due && <span className="text-amber-700 dark:text-amber-300 font-medium">· đến giờ</span>}
                  </p>
                </div>
                {item.status === 'TAKEN' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <Check className="w-4 h-4" /> Đã uống
                  </span>
                ) : item.status === 'MISSED' ? (
                  <span className="text-xs font-semibold text-caption">Bỏ lỡ</span>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => markTaken(item)}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    Đã uống
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
