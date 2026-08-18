'use client';

import { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import type { AIAnalysis } from '@/types';
import { SYMPTOM_TEMPLATES, MEDICAL_DISCLAIMER } from '@/types';
import { useGetAiHistoryQuery, useAnalyzeSymptomMutation } from '@/store/api/baseApi';
import { UrgencyBadge } from '@/components/UrgencyBadge';
import VoiceInput from '@/components/VoiceInput';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default function AIPage() {
  const { toast } = useToast();
  const { data: history = [] } = useGetAiHistoryQuery();
  const [analyzeSymptom, { isLoading }] = useAnalyzeSymptomMutation();
  const [form, setForm] = useState({ description: '', severity: 5, bodyPart: '' });
  const [result, setResult] = useState<AIAnalysis | null>(null);

  const applyTemplate = (t: typeof SYMPTOM_TEMPLATES[0]) => {
    setForm({ description: t.description, severity: 5, bodyPart: t.bodyPart });
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    try {
      const analysis = await analyzeSymptom(form).unwrap();
      setResult(analysis);
      toast('Phân tích hoàn tất', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Lỗi phân tích', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Phân tích AI" subtitle={MEDICAL_DISCLAIMER} />

      <div className="grid grid-cols-1 lg:grid-cols-2 grid-gap">
        <div className="stack">
          <form onSubmit={handleAnalyze} className="card stack">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="section-title mb-0">Mô tả triệu chứng</h2>
              <VoiceInput onResult={(text) => setForm({ ...form, description: form.description ? `${form.description} ${text}` : text })} />
            </div>

            <div className="flex flex-wrap gap-2">
              {SYMPTOM_TEMPLATES.map((t) => (
                <button key={t.label} type="button" onClick={() => applyTemplate(t)} className="chip text-xs sm:text-sm">{t.label}</button>
              ))}
            </div>

            <textarea className="input min-h-[120px] text-base" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả chi tiết triệu chứng..." required />

            <div>
              <label className="input-label">Mức độ: {form.severity}/10</label>
              <input type="range" min={1} max={10} value={form.severity} onChange={(e) => setForm({ ...form, severity: parseInt(e.target.value) })} className="w-full accent-teal-600" />
              <div className="flex justify-between text-xs text-slate-400 mt-1"><span>Nhẹ</span><span>Trung bình</span><span>Nặng</span></div>
            </div>

            <div>
              <label className="input-label">Vị trí cơ thể</label>
              <input className="input" value={form.bodyPart} onChange={(e) => setForm({ ...form, bodyPart: e.target.value })} placeholder="Đầu, ngực, bụng..." />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI đang phân tích...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Bot className="w-4 h-4" />
                  Phân tích với AI
                </span>
              )}
            </button>
          </form>
        </div>

        <div className="stack">
          {result && (
            <div className="card border-2 border-teal-300 dark:border-teal-700 animate-fade-in">
              <h2 className="section-title text-teal-800 dark:text-teal-300 flex items-center gap-2"><Sparkles className="w-5 h-5" /> Kết quả phân tích</h2>
              <p className="text-body text-sm leading-relaxed mb-3 whitespace-pre-line">{result.analysis}</p>
              {result.differentials && result.differentials.length > 0 && (
                <div className="mb-3">
                  <p className="text-caption text-xs mb-1.5">Chẩn đoán phân biệt (tham khảo)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.differentials.map((d) => (
                      <span key={d} className="text-xs px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.redFlags && result.redFlags.length > 0 && result.urgencyLevel !== 'LOW' && (
                <ul className="text-xs text-amber-800 dark:text-amber-200 mb-3 list-disc pl-4 space-y-0.5">
                  {result.redFlags.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2 items-center">
                <UrgencyBadge level={result.urgencyLevel} />
                {result.suggestedSpecialty && <span className="text-sm bg-white px-3 py-1 rounded-full border">→ {result.suggestedSpecialty}</span>}
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="section-title">Lịch sử phân tích</h2>
            {history.length === 0 ? (
              <EmptyState IconComponent={Bot} icon="" title="Chưa có phân tích" description="Nhập triệu chứng để AI phân tích" />
            ) : (
              <ul className="space-y-2.5 max-h-96 overflow-y-auto">
                {history.map((a) => (
                  <li key={a.id} className="pb-2.5 border-b last:border-0" style={{ borderColor: 'var(--border-subtle)' }}>
                    <p className="text-sm font-medium text-heading">{a.inputSummary}</p>
                    <p className="text-caption text-xs mt-0.5 line-clamp-2">{a.analysis}</p>
                    <div className="flex gap-2 mt-1.5 items-center">
                      <UrgencyBadge level={a.urgencyLevel} />
                      <span className="text-caption text-xs">{new Date(a.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
