'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MEDICAL_DISCLAIMER } from '@/types';
import LandingChatDemo from '@/components/LandingChatDemo';
import AnimatedCounter from '@/components/AnimatedCounter';
import AppLogo from '@/components/AppLogo';

const FEATURES = [
  { icon: '🤖', title: 'AI Chat & Phân tích', desc: 'Trò chuyện đa lượt với AI local HealthGuard, phân tích triệu chứng thông minh với RAG vector', gradient: 'from-violet-500/20 to-indigo-500/20' },
  { icon: '📊', title: 'Dashboard trực quan', desc: 'Biểu đồ xu hướng huyết áp, đường huyết, cân nặng — theo dõi sức khỏe theo thời gian', gradient: 'from-teal-500/20 to-emerald-500/20' },
  { icon: '💊', title: 'Nhắc uống thuốc', desc: 'Quản lý lịch uống thuốc, không bỏ lỡ liều nào với thông báo thông minh', gradient: 'from-amber-500/20 to-orange-500/20' },
  { icon: '🔔', title: 'Cảnh báo thông minh', desc: 'Phát hiện chỉ số bất thường tự động — huyết áp cao, đường huyết vượt ngưỡng', gradient: 'from-red-500/20 to-rose-500/20' },
  { icon: '🔥', title: 'Streak & Thành tựu', desc: 'Gamification khuyến khích theo dõi sức khỏe mỗi ngày — điểm sức khỏe 0-100', gradient: 'from-orange-500/20 to-yellow-500/20' },
  { icon: '📱', title: 'Đa nền tảng', desc: 'Web + Desktop (Electron) + Mobile (Expo) đồng bộ real-time qua REST API', gradient: 'from-blue-500/20 to-cyan-500/20' },
];

const STEPS = [
  { step: '01', title: 'Ghi nhận dữ liệu', desc: 'Nhập triệu chứng, chỉ số sinh hiệu hoặc nói bằng giọng nói', icon: '📝' },
  { step: '02', title: 'AI phân tích', desc: 'AI local phân tích với RAG vector, đưa ra khuyến nghị và mức độ khẩn cấp', icon: '🤖' },
  { step: '03', title: 'Theo dõi & cảnh báo', desc: 'Dashboard, báo cáo PDF, cảnh báo tự động khi chỉ số bất thường', icon: '📊' },
];

const TECH = ['Next.js 15', 'NestJS 11', 'Prisma 6', 'PostgreSQL', 'Ollama AI', 'Expo', 'Electron', 'Tailwind 4', 'Redux Toolkit'];

const REVIEWS = [
  { name: 'Demo User', role: 'Người dùng thử', text: 'Giao diện đẹp, AI trả lời nhanh và có ngữ cảnh. Phù hợp demo đồ án!', avatar: '👨‍💻' },
  { name: 'HealthGuard', role: 'Hệ thống', text: 'Tích hợp RAG vector + AI local giúp phân tích triệu chứng chính xác hơn, hoàn toàn offline.', avatar: '🏥' },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <AppLogo size="lg" showText={false} />
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 max-w-7xl mx-auto">
        <AppLogo size="md" variant="light" href="/" />
        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-slate-300 hover:text-white transition-colors hidden sm:block">Đăng nhập</Link>
          <Link href="/login" className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 rounded-xl font-semibold transition-all shadow-lg shadow-teal-500/20">
            🚀 Demo ngay
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-10 pb-14 max-w-7xl mx-auto">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-500/20 border border-teal-400/40 rounded-full text-teal-200 text-sm font-medium mb-5">
              <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
              Đồ án tốt nghiệp CNTT — AI local tích hợp
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5">
              Quản lý sức khỏe
              <br />
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                thông minh với AI
              </span>
            </h1>
            <p className="text-base md:text-lg text-slate-300 max-w-lg mb-6 leading-relaxed">
              Theo dõi triệu chứng, chỉ số sinh hiệu, trò chuyện với AI local và nhận cảnh báo sớm — Web, Desktop và Mobile trong một nền tảng.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <Link href="/login" className="px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 rounded-xl font-bold transition-all shadow-lg shadow-teal-500/20 text-center">
                Dùng thử Demo →
              </Link>
              <Link href="/register" className="px-6 py-3.5 glass hover:bg-white/15 rounded-xl font-semibold transition-all text-center">
                Tạo tài khoản
              </Link>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>🔑 demo@healthguard.vn</span>
              <span>•</span>
              <span>Demo@123</span>
            </div>
          </div>

          <div className="relative animate-float max-w-full">
            <LandingChatDemo />
            <div className="absolute -bottom-2 left-0 sm:-bottom-4 sm:-left-4 glass rounded-xl px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3 hide-xs sm:flex">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-lg">💚</div>
              <div>
                <p className="text-xs text-slate-400">Điểm sức khỏe</p>
                <p className="font-bold text-emerald-400"><AnimatedCounter value={85} />/100</p>
              </div>
            </div>
            <div className="absolute -top-2 right-0 sm:-top-3 sm:-right-3 glass rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-2 hide-xs sm:flex">
              <span className="text-orange-400 font-bold"><AnimatedCounter value={7} />🔥</span>
              <span className="text-xs text-slate-400">Streak</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-700/80 bg-slate-900/70 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-6">
          {[
            { value: 6, label: 'Module chính', suffix: '' },
            { value: 100, label: 'Điểm sức khỏe', suffix: '' },
            { value: 24, label: 'Theo dõi', suffix: '/7' },
            { value: 4, label: 'Nền tảng', suffix: '' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-teal-400">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </p>
              <p className="text-sm text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Cách hoạt động</h2>
        <p className="text-slate-300 text-center mb-10 text-sm">3 bước đơn giản — từ ghi nhận đến phân tích AI</p>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.step} className="relative text-center group">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-teal-500/50 to-transparent" />
              )}
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {s.icon}
              </div>
              <span className="text-xs font-bold text-teal-500 tracking-widest">{s.step}</span>
              <h3 className="font-bold text-lg mt-2 mb-2">{s.title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Tính năng nổi bật</h2>
        <p className="text-slate-300 text-center mb-10 max-w-xl mx-auto text-sm">Mọi thứ bạn cần để quản lý sức khỏe cá nhân</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className={`group bg-gradient-to-br ${f.gradient} border border-slate-700 hover:border-teal-400/50 rounded-xl p-5 transition-all`}>
              <span className="text-2xl">{f.icon}</span>
              <h3 className="font-bold mt-3 mb-1.5 group-hover:text-teal-300 transition-colors">{f.title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-12 px-6 border-y border-slate-700/80">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">Công nghệ sử dụng</h3>
          <div className="flex flex-wrap justify-center gap-2.5">
            {TECH.map((t) => (
              <span key={t} className="px-3.5 py-1.5 glass rounded-full text-sm font-medium text-slate-200 hover:text-teal-300 transition-colors">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-14 px-6 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-5">
          {REVIEWS.map((r) => (
            <div key={r.name} className="glass rounded-xl p-5">
              <p className="text-slate-200 text-sm leading-relaxed mb-3">&ldquo;{r.text}&rdquo;</p>
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{r.avatar}</span>
                <div>
                  <p className="font-semibold text-sm text-white">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-teal-900/50 via-slate-900 to-emerald-900/40 border border-teal-500/30 rounded-2xl p-8 md:p-10 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3 relative">Sẵn sàng trình bày đồ án?</h2>
          <p className="text-slate-300 mb-6 relative text-sm">Đăng nhập demo và khám phá toàn bộ tính năng HealthGuard</p>
          <Link href="/login" className="relative inline-block px-8 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 rounded-xl font-bold transition-all shadow-lg shadow-teal-500/20">
            Bắt đầu Demo →
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-700/80 py-6 px-6 text-center text-xs text-slate-400">
        <p>HealthGuard © 2026 — Đồ án tốt nghiệp CNTT</p>
        <p className="mt-1.5 italic text-slate-500 max-w-2xl mx-auto">{MEDICAL_DISCLAIMER}</p>
      </footer>
    </div>
  );
}
