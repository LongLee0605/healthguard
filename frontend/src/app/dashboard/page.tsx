'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  MessageCircle,
  HeartPulse,
  FileText,
  Bot,
  Flame,
  Sparkles,
  Trophy,
  ClipboardList,
  CheckCircle2,
  Pill,
  Target,
} from 'lucide-react';
import {
  useGetDashboardStatsQuery,
  useGetActivityQuery,
  useGetWeeklyInsightQuery,
  useGetAlertsQuery,
  useGetGoalsQuery,
  useIncrementGoalMutation,
} from '@/store/api/baseApi';
import StatCard from '@/components/StatCard';
import { HealthScoreRing } from '@/components/HealthScoreRing';
import { UrgencyBadge } from '@/components/UrgencyBadge';
import PageHeader from '@/components/PageHeader';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import QueryError from '@/components/QueryError';

const VitalChart = dynamic(() => import('@/components/VitalChart'), {
  ssr: false,
  loading: () => <div className="h-[200px] skeleton rounded-xl" />,
});

const QUICK_ACTIONS = [
  { href: '/dashboard/chat', label: 'AI Chat', Icon: MessageCircle, color: 'from-violet-600 to-indigo-700' },
  { href: '/dashboard/vitals', label: 'Ghi chỉ số', Icon: HeartPulse, color: 'from-rose-600 to-pink-600' },
  { href: '/dashboard/symptoms', label: 'Ghi triệu chứng', Icon: FileText, color: 'from-blue-600 to-indigo-600' },
  { href: '/dashboard/ai', label: 'Phân tích AI', Icon: Bot, color: 'from-purple-600 to-violet-600' },
];

const ACTIVITY_ICONS: Record<string, typeof FileText> = {
  symptom: FileText,
  vital: HeartPulse,
  ai: Bot,
  alert: ClipboardList,
  medication: Pill,
};

const CHART_DAYS = 30;

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useGetDashboardStatsQuery();
  const { data: alerts = [] } = useGetAlertsQuery({ unreadOnly: true });
  const { data: activity = [] } = useGetActivityQuery();
  const { data: weeklyInsight, isLoading: insightLoading } = useGetWeeklyInsightQuery(undefined, {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
  });
  const { data: goals = [] } = useGetGoalsQuery();
  const [incrementGoal] = useIncrementGoalMutation();

  if (statsLoading) return <LoadingSkeleton />;
  if (statsError) return <QueryError onRetry={refetchStats} />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Tổng quan sức khỏe" subtitle="Theo dõi chỉ số, triệu chứng và phân tích AI tại một nơi" />

      {(stats?.streak ?? 0) >= 3 && (
        <div className="section bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-md animate-slide-up">
          <Flame className="w-7 h-7 shrink-0" />
          <div>
            <p className="font-bold">Streak {stats?.streak} ngày liên tiếp!</p>
            <p className="text-orange-50 text-sm mt-0.5">Tiếp tục ghi nhận sức khỏe để mở khóa thành tựu mới</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 grid-gap section">
        <div className="card xl:col-span-1 flex flex-col items-center justify-center py-4">
          <p className="text-caption font-medium mb-3">Điểm sức khỏe</p>
          <HealthScoreRing score={stats?.healthScore ?? 0} />
        </div>
        <div className="xl:col-span-3 grid stat-grid-mobile lg:grid-cols-4 grid-gap">
          <StatCard label="Triệu chứng" value={stats?.totalSymptoms ?? 0} icon="" color="text-blue-700 dark:text-blue-400" bg="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" IconComponent={FileText} />
          <StatCard label="Chỉ số" value={stats?.totalVitals ?? 0} icon="" color="text-teal-700 dark:text-teal-400" bg="bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400" IconComponent={HeartPulse} />
          <StatCard label="Streak" value={stats?.streak ?? 0} icon="" color="text-orange-700 dark:text-orange-400" bg="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400" IconComponent={Flame} />
          <StatCard label="Cảnh báo" value={stats?.unreadAlerts ?? 0} icon="" color="text-red-700 dark:text-red-400" bg="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400" IconComponent={ClipboardList} />
        </div>
      </div>

      <div className="card section bg-teal-50/60 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-teal-700 dark:text-teal-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="section-title">AI Weekly Insight — {weeklyInsight?.period ?? '7 ngày qua'}</h2>
            {insightLoading ? (
              <div className="h-4 skeleton w-3/4" />
            ) : (
              <p className="text-body text-sm leading-relaxed">{weeklyInsight?.insight ?? 'Đang tạo báo cáo tuần...'}</p>
            )}
            {weeklyInsight?.stats && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-xs text-caption">
                <span>📝 {weeklyInsight.stats.symptomCount} triệu chứng</span>
                <span>💓 {weeklyInsight.stats.vitalCount} chỉ số</span>
                <span>🤖 {weeklyInsight.stats.analysisCount} phân tích AI</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {goals.length > 0 && (
        <div className="section">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title mb-0 flex items-center gap-2"><Target className="w-5 h-5 text-teal-600" /> Mục tiêu tuần này</h2>
            <Link href="/dashboard/timeline" className="text-xs text-teal-700 dark:text-teal-400 font-medium hover:underline">Xem nhật ký</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 grid-gap">
            {goals.map((g) => (
              <div key={g.id} className={`card-compact ${g.isCompleted ? 'opacity-75' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-heading">{g.title}</p>
                    <p className="text-xs text-caption mt-0.5">{g.currentCount}/{g.targetCount} {g.unit}</p>
                  </div>
                  {g.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => incrementGoal(g.id)}
                      className="btn-primary text-xs px-2 py-1 shrink-0"
                    >
                      +1
                    </button>
                  )}
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2">
                  <div className="h-1.5 rounded-full bg-teal-600 transition-all" style={{ width: `${g.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.achievements && stats.achievements.length > 0 && (
        <div className="section">
          <h2 className="section-title flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Thành tựu</h2>
          <div className="flex flex-wrap gap-2">
            {stats.achievements.map((a) => (
              <div key={a.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${a.unlocked ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-200' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50 grayscale dark:bg-slate-800 dark:border-slate-600'}`}>
                <span>{a.icon}</span>
                <span className="font-medium">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 grid-gap section">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.href} href={action.href} className={`group bg-gradient-to-br ${action.color} text-white rounded-xl px-3 py-4 hover:brightness-110 hover:scale-[1.02] transition-all min-h-[80px] flex flex-col justify-center shadow-md`}>
            <action.Icon className="w-6 h-6 opacity-90 group-hover:scale-110 transition-transform" />
            <p className="font-semibold mt-2 text-sm">{action.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 grid-gap section">
        <div className="card"><h2 className="section-title">Huyết áp ({CHART_DAYS} ngày)</h2><VitalChart type="BLOOD_PRESSURE" days={CHART_DAYS} /></div>
        <div className="card"><h2 className="section-title">Đường huyết ({CHART_DAYS} ngày)</h2><VitalChart type="BLOOD_SUGAR" days={CHART_DAYS} /></div>
        <div className="card md:col-span-2 xl:col-span-1"><h2 className="section-title">Cân nặng ({CHART_DAYS} ngày)</h2><VitalChart type="WEIGHT" days={CHART_DAYS} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 grid-gap">
        {stats?.lastAnalysis && (
          <div className="card border-teal-200 dark:border-teal-800">
            <h2 className="section-title">Phân tích AI gần nhất</h2>
            <p className="text-caption text-sm mb-1.5">{stats.lastAnalysis.inputSummary}</p>
            <p className="text-body text-sm leading-relaxed mb-2.5 line-clamp-4">{stats.lastAnalysis.analysis}</p>
            <div className="flex flex-wrap gap-2 items-center">
              <UrgencyBadge level={stats.lastAnalysis.urgencyLevel} />
              {stats.lastAnalysis.suggestedSpecialty && (
                <span className="text-xs px-2 py-0.5 rounded-full border text-caption" style={{ borderColor: 'var(--border-subtle)' }}>{stats.lastAnalysis.suggestedSpecialty}</span>
              )}
            </div>
          </div>
        )}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title mb-0">Cảnh báo mới</h2>
            <Link href="/dashboard/alerts" className="text-xs text-teal-700 dark:text-teal-400 font-medium hover:underline">Xem tất cả</Link>
          </div>
          {alerts.length === 0 ? (
            <EmptyState icon="" title="Không có cảnh báo" description="Mọi thứ đang ổn định" IconComponent={CheckCircle2} />
          ) : (
            <ul className="space-y-2.5">
              {alerts.slice(0, 4).map((a) => (
                <li key={a.id} className="border-l-[3px] border-orange-500 pl-2.5 py-0.5">
                  <p className="font-medium text-sm text-heading">{a.title}</p>
                  <p className="text-caption text-xs mt-0.5 line-clamp-2">{a.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h2 className="section-title">Hoạt động gần đây</h2>
          {activity.length === 0 ? (
            <EmptyState icon="" title="Chưa có hoạt động" description="Bắt đầu ghi nhận sức khỏe của bạn" IconComponent={ClipboardList} />
          ) : (
            <ul className="space-y-2.5">
              {activity.slice(0, 6).map((item) => {
                const ActivityIcon = ACTIVITY_ICONS[item.type] ?? ClipboardList;
                return (
                <li key={`${item.type}-${item.id}`} className="flex gap-2.5 items-start">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                    <ActivityIcon className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-heading truncate">{item.title}</p>
                    <p className="text-caption text-xs">{item.subtitle}</p>
                    <p className="text-caption text-xs opacity-75">{new Date(item.timestamp).toLocaleString('vi-VN')}</p>
                  </div>
                  {item.meta && <UrgencyBadge level={item.meta} />}
                </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
