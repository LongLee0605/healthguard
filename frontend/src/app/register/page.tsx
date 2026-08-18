'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { MEDICAL_DISCLAIMER } from '@/types';
import AppLogo from '@/components/AppLogo';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 p-10 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 right-8 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <AppLogo size="lg" variant="light" />
          <h2 className="text-3xl font-bold leading-tight mt-8">Tham gia HealthGuard</h2>
          <p className="mt-3 text-teal-100 max-w-md leading-relaxed">Theo dõi sức khỏe thông minh với AI local — miễn phí, đồng bộ web + mobile + desktop.</p>
        </div>
        <p className="relative text-sm text-teal-200">Hoặc dùng demo: demo@healthguard.vn / Demo@123</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden text-center mb-6">
            <AppLogo size="lg" href="/" className="justify-center" />
          </div>

          <div className="card shadow-md">
            <h2 className="text-xl font-bold text-heading">Tạo tài khoản</h2>
            <p className="text-caption mb-6 mt-1">Bắt đầu theo dõi sức khỏe ngay hôm nay</p>

            <form onSubmit={handleSubmit} className="stack">
              {error && (
                <div className="alert-error">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="input-label">Họ và tên</label>
                <input className="input text-base" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input type="email" className="input text-base" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
              </div>
              <div>
                <label className="input-label">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input text-base pr-12"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    minLength={6}
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-caption touch-target" onClick={() => setShowPassword(!showPassword)} aria-label="Hiện mật khẩu">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full touch-target" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  'Đăng ký'
                )}
              </button>
            </form>

            <p className="text-center text-caption mt-5">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-teal-700 dark:text-teal-400 hover:underline font-semibold">Đăng nhập</Link>
            </p>
            <p className="text-center text-caption mt-2">
              <Link href="/" className="hover:text-teal-700 dark:hover:text-teal-400 transition-colors">← Về trang chủ</Link>
            </p>
          </div>

          <p className="text-caption mt-4 text-center italic text-xs px-2">{MEDICAL_DISCLAIMER}</p>
        </div>
      </div>
    </div>
  );
}

