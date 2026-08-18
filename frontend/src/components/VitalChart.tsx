'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import type { VitalSignType } from '@/types';
import { VITAL_LABELS } from '@/types';
import { useGetVitalChartQuery } from '@/store/api/baseApi';
import { useChartHeight } from '@/hooks/useChartHeight';
import QueryError from '@/components/QueryError';

interface Props {
  type: VitalSignType;
  days?: number;
}

const REFERENCE_LINES: Partial<Record<VitalSignType, { value: number; label: string; color: string }[]>> = {
  BLOOD_PRESSURE: [
    { value: 140, label: 'Cao (tâm thu)', color: '#ef4444' },
    { value: 90, label: 'Cao (tâm trương)', color: '#f97316' },
  ],
  BLOOD_SUGAR: [
    { value: 126, label: 'Tiểu đường', color: '#ef4444' },
    { value: 100, label: 'Tiền tiểu đường', color: '#f59e0b' },
  ],
};

export default function VitalChart({ type, days = 30 }: Props) {
  const { data = [], isLoading, isError, refetch } = useGetVitalChartQuery({ type, days });
  const height = useChartHeight(250);
  const tickSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12;

  if (isLoading) {
    return <div className="h-[200px] skeleton rounded-xl" />;
  }

  if (isError) {
    return <QueryError onRetry={refetch} />;
  }

  if (data.length === 0) {
    return <p className="text-caption text-sm py-8 text-center">Chưa có dữ liệu trong {days} ngày qua</p>;
  }

  const refs = REFERENCE_LINES[type] ?? [];

  if (type === 'BLOOD_PRESSURE') {
    return (
      <div className="w-full min-w-0">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
            <XAxis dataKey="date" tick={{ fontSize: tickSize }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: tickSize }} domain={[60, 160]} width={35} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: tickSize }} />
            {refs[0] && <ReferenceLine y={refs[0].value} stroke={refs[0].color} strokeDasharray="4 4" label={{ value: refs[0].label, fontSize: 10 }} />}
            <Line type="monotone" dataKey="value" name="Tâm thu" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="valueSecondary" name="Tâm trương" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
          <XAxis dataKey="date" tick={{ fontSize: tickSize }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: tickSize }} width={35} />
          <Tooltip />
          {refs.map((ref) => (
            <ReferenceLine key={ref.label} y={ref.value} stroke={ref.color} strokeDasharray="4 4" label={{ value: ref.label, fontSize: 10 }} />
          ))}
          <Line type="monotone" dataKey="value" name={VITAL_LABELS[type]} stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
