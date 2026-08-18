'use client';

import { useRef, useState } from 'react';
import { Upload, Smartphone, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useImportVitalsMutation, useGetHealthDevicesQuery } from '@/store/api/baseApi';

const DEVICE_SOURCES = [
  { value: 'OMRON', label: 'Omron (máy đo huyết áp)', format: 'omron_csv' as const },
  { value: 'WITHINGS', label: 'Withings / Health Mate', format: 'withings_json' as const },
  { value: 'FITBIT', label: 'Fitbit', format: 'fitbit_json' as const },
  { value: 'APPLE_HEALTH', label: 'Apple Health', format: 'apple_health' as const },
  { value: 'GOOGLE_FIT', label: 'Google Fit / Health Connect', format: 'health_connect' as const },
  { value: 'CSV_IMPORT', label: 'File CSV khác', format: 'omron_csv' as const },
  { value: 'JSON_IMPORT', label: 'File JSON tổng quát', format: 'generic' as const },
];

const SOURCE_LABELS: Record<string, string> = Object.fromEntries(
  DEVICE_SOURCES.map((s) => [s.value, s.label]),
);

export default function DeviceSyncPanel() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState(DEVICE_SOURCES[0].value);
  const [deviceName, setDeviceName] = useState('');
  const [importVitals, { isLoading }] = useImportVitalsMutation();
  const { data: devices = [] } = useGetHealthDevicesQuery();

  const selected = DEVICE_SOURCES.find((s) => s.value === source) ?? DEVICE_SOURCES[0];

  const handleFile = async (file: File) => {
    const text = await file.text();
    const isJson = file.name.endsWith('.json') || text.trim().startsWith('{') || text.trim().startsWith('[');
    const format = isJson && selected.format === 'omron_csv' ? 'generic' : selected.format;

    try {
      const result = await importVitals({
        source,
        deviceName: deviceName || file.name.replace(/\.[^.]+$/, ''),
        format,
        payload: isJson ? JSON.parse(text) : text,
      }).unwrap();

      toast(
        `Đồng bộ xong: ${result.imported} mới, ${result.skipped} đã có${result.errors.length ? `, ${result.errors.length} lỗi` : ''}`,
        result.imported > 0 ? 'success' : 'info',
      );
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Không thể đồng bộ', 'error');
    }
  };

  return (
    <div className="card stack">
      <div className="flex items-center gap-2">
        <Smartphone className="w-5 h-5 text-teal-700" />
        <h2 className="section-title mb-0">Đồng bộ từ thiết bị</h2>
      </div>
      <p className="text-caption text-sm">
        Tải file xuất từ máy đo Omron, Withings, Fitbit, Apple Health hoặc đồng hồ thông minh (CSV/JSON).
      </p>

      <div>
        <label className="input-label">Nguồn thiết bị</label>
        <select
          className="input"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          {DEVICE_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="input-label">Tên thiết bị (tùy chọn)</label>
        <input
          className="input"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          placeholder="VD: Omron M2, Apple Watch..."
        />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.json,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <button
        type="button"
        className="btn-secondary w-full touch-target flex items-center justify-center gap-2"
        disabled={isLoading}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="w-4 h-4" />
        {isLoading ? 'Đang đồng bộ...' : 'Chọn file CSV / JSON'}
      </button>

      {devices.length > 0 && (
        <div className="border-t pt-3 mt-1" style={{ borderColor: 'var(--border-subtle)' }}>
          <p className="text-xs font-medium text-caption mb-2">Thiết bị đã kết nối</p>
          <ul className="space-y-2">
            {devices.map((d) => (
              <li key={d.id} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-heading">
                    {SOURCE_LABELS[d.source] ?? d.source}
                    {d.deviceName ? ` — ${d.deviceName}` : ''}
                  </p>
                  <p className="text-caption text-xs">
                    {d.readingCount} chỉ số
                    {d.lastSyncAt
                      ? ` · Lần cuối ${new Date(d.lastSyncAt).toLocaleString('vi-VN')}`
                      : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
