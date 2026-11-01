'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Monitor, Moon, Search, Sun, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/features/ui/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSidebarOpen } from '@/store/slices/uiSlice';
import { MEDICAL_DISCLAIMER } from '@/types';
import AppLogo from '@/components/AppLogo';
import FloatingChat from '@/components/FloatingChat';
import NotificationBell from '@/components/NotificationBell';
import MobileBottomNav from '@/components/MobileBottomNav';
import InstallPwaBanner from '@/components/InstallPwaBanner';
import CommandPalette from '@/components/CommandPalette';
import { NAV_GROUPS } from '@/components/navItems';
import { isDesktopApp } from '@/lib/desktop';
import { useAlertNotifications } from '@/hooks/useAlertNotifications';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  const router = useRouter();
  const pathname = usePathname();
  useAlertNotifications();

  const [greeting, setGreeting] = useState('Xin chào');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [desktopApp, setDesktopApp] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối');
    setDesktopApp(isDesktopApp());
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <AppLogo size="lg" showText={false} />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            <p className="text-teal-700 dark:text-teal-400 font-medium text-sm">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => dispatch(setSidebarOpen(false))} />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 w-64 h-screen flex flex-col transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ backgroundColor: 'var(--surface)', borderRight: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="px-4 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <AppLogo size="md" href="/dashboard" />
        </div>

        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={() => {
              dispatch(setSidebarOpen(false));
              setPaletteOpen(true);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-caption border"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg)' }}
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Tìm trang</span>
            <kbd className="kbd">Ctrl K</kbd>
          </button>
        </div>

        <nav className="flex-1 min-h-0 px-3 py-2 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="nav-label">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => dispatch(setSidebarOpen(false))}
                      className={`nav-item relative ${active ? 'nav-active' : ''}`}
                    >
                      {active && <span className="nav-active-indicator" />}
                      <item.Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5 mb-2.5 px-1 py-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {user.fullName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-heading truncate">{user.fullName}</p>
              <p className="text-xs text-caption truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={logout} className="btn-danger w-full text-left text-sm flex items-center gap-2 justify-center sm:justify-start">
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="lg:pl-64 min-h-screen flex flex-col">
        <header
          className="px-4 py-3 flex items-center justify-between no-print sticky top-0 z-30 backdrop-blur-md"
          style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 90%, transparent)', borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden btn-ghost p-2 rounded-xl" onClick={() => dispatch(setSidebarOpen(true))} aria-label="Mở menu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="min-w-0">
              <p className="text-xs text-caption">{greeting},</p>
              <p className="font-semibold text-heading text-sm truncate">{user.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {desktopApp && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border text-teal-800 dark:text-teal-200" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg)' }}>
                <Monitor className="w-3.5 h-3.5" />
                App PC
              </span>
            )}
            <button type="button" onClick={() => setPaletteOpen(true)} className="btn-ghost p-2 rounded-xl lg:hidden" aria-label="Tìm trang">
              <Search className="w-5 h-5" />
            </button>
            <NotificationBell />
            <button onClick={toggle} className="btn-ghost p-2 rounded-xl" title="Dark mode" aria-label="Đổi theme">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <p className="hidden xl:block text-xs text-caption italic max-w-sm truncate ml-1">{MEDICAL_DISCLAIMER}</p>
          </div>
        </header>

        <main className="flex-1 page-main w-full max-w-7xl mx-auto">{children}</main>
      </div>
      <MobileBottomNav onMenuOpen={() => dispatch(setSidebarOpen(true))} />
      {!desktopApp && <InstallPwaBanner />}
      <FloatingChat />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
