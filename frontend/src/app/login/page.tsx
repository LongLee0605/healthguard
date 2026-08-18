'use client';



import { useState } from 'react';

import { useRouter } from 'next/navigation';

import Link from 'next/link';

import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

import { useAuth } from '@/features/auth/hooks/useAuth';

import { MEDICAL_DISCLAIMER } from '@/types';

import AppLogo from '@/components/AppLogo';



export default function LoginPage() {

  const { login, loginLoading } = useAuth();

  const router = useRouter();

  const [email, setEmail] = useState('demo@healthguard.vn');

  const [password, setPassword] = useState('Demo@123');

  const [error, setError] = useState('');

  const [showPassword, setShowPassword] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    setError('');

    try {

      await login(email, password);

      router.push('/dashboard');

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');

    }

  };



  return (

    <div className="min-h-screen flex">

      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 p-12 flex-col justify-between text-white relative overflow-hidden">

        <div className="absolute inset-0 pointer-events-none">

          <div className="absolute top-20 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

          <div className="absolute bottom-20 left-10 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl" />

        </div>

        <div className="relative">

          <AppLogo size="lg" variant="light" />

          <h2 className="text-4xl font-bold leading-tight mt-10">Quản lý sức khỏe<br />thông minh với AI</h2>

          <p className="mt-4 text-teal-100 text-lg max-w-md leading-relaxed">Theo dõi triệu chứng, chỉ số sinh hiệu và nhận phân tích AI — mọi lúc, mọi nơi.</p>

        </div>

        <ul className="relative space-y-3 text-teal-100 text-sm">

          {['Biểu đồ xu hướng sức khỏe', 'Phân tích AI local', 'Nhắc uống thuốc', 'Cảnh báo tự động'].map((f) => (

            <li key={f} className="flex items-center gap-2">

              <span className="w-1.5 h-1.5 rounded-full bg-teal-300" />

              {f}

            </li>

          ))}

        </ul>

      </div>



      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full" style={{ backgroundColor: 'var(--bg)' }}>

        <div className="w-full max-w-md animate-slide-up">

          <div className="lg:hidden text-center mb-8">

            <AppLogo size="lg" href="/" className="justify-center" />

          </div>



          <div className="card shadow-md">

            <h2 className="text-xl font-bold text-heading">Đăng nhập</h2>

            <p className="text-caption mb-6 mt-1">Chào mừng trở lại HealthGuard</p>



            <form onSubmit={handleSubmit} className="stack">

              {error && (

                <div className="alert-error">

                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

                  <span>{error}</span>

                </div>

              )}

              <div>

                <label className="input-label">Email</label>

                <input type="email" className="input text-base" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />

              </div>

              <div>

                <label className="input-label">Mật khẩu</label>

                <div className="relative">

                  <input

                    type={showPassword ? 'text' : 'password'}

                    className="input text-base pr-12"

                    value={password}

                    onChange={(e) => setPassword(e.target.value)}

                    required

                  />

                  <button

                    type="button"

                    className="absolute right-3 top-1/2 -translate-y-1/2 text-caption hover:text-heading transition-colors touch-target"

                    onClick={() => setShowPassword(!showPassword)}

                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}

                  >

                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}

                  </button>

                </div>

              </div>

              <button type="submit" className="btn-primary w-full touch-target" disabled={loginLoading}>

                {loginLoading ? (

                  <>

                    <Loader2 className="w-4 h-4 animate-spin" />

                    Đang đăng nhập...

                  </>

                ) : (

                  'Đăng nhập'

                )}

              </button>

            </form>



            <div className="mt-4 p-3 rounded-lg text-xs text-caption" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>

              <span className="font-medium text-heading">Demo:</span> demo@healthguard.vn / Demo@123

            </div>



            <p className="text-center text-caption mt-5">

              Chưa có tài khoản?{' '}

              <Link href="/register" className="text-teal-700 dark:text-teal-400 hover:underline font-semibold">Đăng ký ngay</Link>

            </p>

            <p className="text-center text-caption mt-2">

              <Link href="/" className="hover:text-teal-700 dark:hover:text-teal-400 transition-colors">← Về trang chủ</Link>

            </p>

          </div>



          <p className="text-caption mt-4 text-center italic text-xs">{MEDICAL_DISCLAIMER}</p>

        </div>

      </div>

    </div>

  );

}


