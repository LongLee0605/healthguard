'use client';

import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { VITAL_LABELS, MEDICAL_DISCLAIMER } from '@/types';
import { useGetHealthReportQuery } from '@/store/api/baseApi';
import { useToast } from '@/context/ToastContext';
import PageHeader from '@/components/PageHeader';
import { UrgencyBadge } from '@/components/UrgencyBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import QueryError from '@/components/QueryError';
import EmptyState from '@/components/EmptyState';

export default function ReportsPage() {
  const { toast } = useToast();
  const { data: report, isLoading, isError, refetch } = useGetHealthReportQuery();
  const [exporting, setExporting] = useState(false);

  const handlePrint = () => window.print();

  const handleExportPdf = async () => {
    const desktopApi = (
      window as Window & {
        healthguard?: {
          exportReportPdf?: () => Promise<{
            success: boolean;
            cancelled?: boolean;
            filePath?: string;
            message?: string;
          }>;
        };
      }
    ).healthguard;

    if (!desktopApi?.exportReportPdf) {
      toast('Xuất PDF file hiện chỉ hỗ trợ trong app PC. Trên trình duyệt, hãy dùng In > Save as PDF.', 'info');
      return;
    }

    setExporting(true);
    try {
      const result = await desktopApi.exportReportPdf();
      if (result.success) {
        toast(`Đã xuất PDF: ${result.filePath}`, 'success');
      } else if (!result.cancelled) {
        toast(result.message ?? 'Không thể xuất PDF', 'error');
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Không thể xuất PDF', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <QueryError onRetry={refetch} />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Báo cáo sức khỏe"
        subtitle="Tổng hợp dữ liệu để in hoặc chia sẻ với bác sĩ"
        action={
          <div className="flex flex-wrap gap-2 no-print">
            <button onClick={handlePrint} className="btn-secondary touch-target flex items-center gap-2">
              <Printer className="w-4 h-4" />
              In
            </button>
            <button onClick={handleExportPdf} disabled={exporting} className="btn-primary touch-target flex items-center gap-2">
              <Download className="w-4 h-4" />
              {exporting ? 'Đang xuất...' : 'Xuất PDF'}
            </button>
          </div>
        }
      />

      {!report ? (
        <div className="card"><EmptyState icon="" title="Chưa có dữ liệu báo cáo" description="Ghi nhận triệu chứng và chỉ số để tạo báo cáo" /></div>
      ) : (
        <div className="card-flat space-y-6 sm:space-y-8 print:shadow-none">
          <div className="border-b pb-5" style={{ borderColor: 'var(--border-subtle)' }}>
            <h2 className="text-lg sm:text-xl font-bold text-teal-700 dark:text-teal-400">HealthGuard — Báo cáo sức khỏe</h2>
            <p className="text-caption mt-1">Ngày tạo: {new Date(report.generatedAt).toLocaleString('vi-VN')}</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <p className="text-body"><strong className="text-heading">Họ tên:</strong> {report.user.fullName}</p>
              <p className="text-body break-all"><strong className="text-heading">Email:</strong> {report.user.email}</p>
              <p className="text-body"><strong className="text-heading">Điểm sức khỏe:</strong> {report.summary.healthScore}/100</p>
              <p className="text-body"><strong className="text-heading">Cảnh báo chưa đọc:</strong> {report.summary.unreadAlerts}</p>
            </div>
          </div>

          <section>
            <h3 className="section-title">Triệu chứng gần đây</h3>
            {report.recentSymptoms.length === 0 ? (
              <p className="text-caption text-sm">Không có dữ liệu</p>
            ) : (
              <>
                <div className="cards-mobile">
                  {report.recentSymptoms.map((s) => (
                    <div key={s.id} className="data-card">
                      <p className="text-sm font-medium text-heading">{s.description}</p>
                      <p className="text-caption text-xs mt-1">Mức {s.severity}/10 · {new Date(s.recordedAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  ))}
                </div>
                <div className="overflow-safe hidden md:block">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-caption border-b"><th className="pb-2">Mô tả</th><th>Mức</th><th>Thời gian</th></tr></thead>
                    <tbody>
                      {report.recentSymptoms.map((s) => (
                        <tr key={s.id} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                          <td className="py-2">{s.description}</td>
                          <td>{s.severity}/10</td>
                          <td>{new Date(s.recordedAt).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <section>
            <h3 className="section-title">Chỉ số sinh hiệu</h3>
            {report.recentVitals.length === 0 ? (
              <p className="text-caption text-sm">Chưa có chỉ số nào được ghi nhận</p>
            ) : (
            <>
            <div className="cards-mobile">
              {report.recentVitals.map((v) => (
                <div key={v.id} className="data-card">
                  <p className="text-sm font-medium text-heading">{VITAL_LABELS[v.type]}</p>
                  <p className="text-teal-700 dark:text-teal-400 font-semibold text-sm mt-0.5">{v.valueSecondary ? `${v.value}/${v.valueSecondary}` : v.value} {v.unit}</p>
                  <p className="text-caption text-xs">{new Date(v.recordedAt).toLocaleDateString('vi-VN')}</p>
                </div>
              ))}
            </div>
            <div className="overflow-safe hidden md:block">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-caption border-b"><th className="pb-2">Loại</th><th>Giá trị</th><th>Thời gian</th></tr></thead>
                <tbody>
                  {report.recentVitals.map((v) => (
                    <tr key={v.id} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                      <td className="py-2">{VITAL_LABELS[v.type]}</td>
                      <td>{v.valueSecondary ? `${v.value}/${v.valueSecondary}` : v.value} {v.unit}</td>
                      <td>{new Date(v.recordedAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
            )}
          </section>

          <section>
            <h3 className="section-title">Phân tích AI</h3>
            {report.recentAnalyses.length === 0 ? (
              <p className="text-caption text-sm">Chưa có phân tích AI</p>
            ) : (
            report.recentAnalyses.map((a) => (
              <div key={a.id} className="mb-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg)' }}>
                <p className="font-medium text-sm text-heading">{a.inputSummary}</p>
                <p className="text-body text-sm mt-1">{a.analysis}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <UrgencyBadge level={a.urgencyLevel} />
                  {a.suggestedSpecialty && <span className="text-caption text-xs">{a.suggestedSpecialty}</span>}
                </div>
              </div>
            ))
            )}
          </section>

          <p className="text-caption italic border-t pt-4 text-xs">{MEDICAL_DISCLAIMER}</p>
        </div>
      )}
    </div>
  );
}
