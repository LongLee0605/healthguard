'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, Download, Lock, Target } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useUpdateProfileMutation, useChangePasswordMutation } from '@/store/api/baseApi';
import { useToast } from '@/context/ToastContext';
import PageHeader from '@/components/PageHeader';
import {
  getNotificationPermission,
  getNotificationsEnabled,
  requestNotificationPermission,
  setNotificationsEnabled,
  showBrowserNotification,
} from '@/lib/notifications';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPw }] = useChangePasswordMutation();
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    height: '',
    bloodType: '',
    allergies: '',
    chronicConditions: '',
    emergencyContact: '',
    emergencyPhone: '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName,
        dateOfBirth: user.dateOfBirth?.split('T')[0] ?? '',
        gender: user.gender ?? '',
        height: user.height ? String(user.height) : '',
        bloodType: user.bloodType ?? '',
        allergies: user.allergies ?? '',
        chronicConditions: user.chronicConditions ?? '',
        emergencyContact: user.emergencyContact ?? '',
        emergencyPhone: user.emergencyPhone ?? '',
      });
    }
  }, [user]);

  useEffect(() => {
    setNotifEnabled(getNotificationsEnabled());
    setPermission(getNotificationPermission());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        height: form.height ? parseFloat(form.height) : undefined,
        bloodType: form.bloodType || undefined,
        allergies: form.allergies || undefined,
        chronicConditions: form.chronicConditions || undefined,
        emergencyContact: form.emergencyContact || undefined,
        emergencyPhone: form.emergencyPhone || undefined,
      }).unwrap();
      toast('Đã cập nhật hồ sơ', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Lỗi', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    try {
      await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      }).unwrap();
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      toast('Đã đổi mật khẩu', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Mật khẩu hiện tại không đúng', 'error');
    }
  };

  const handleExport = async () => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/me/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `healthguard-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Đã tải xuống dữ liệu', 'success');
    } catch {
      toast('Không thể xuất dữ liệu', 'error');
    }
  };

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      setNotificationsEnabled(true);
      setNotifEnabled(true);
      toast('Đã bật thông báo', 'success');
    } else if (result === 'denied') {
      toast('Quyền thông báo bị từ chối', 'error');
    }
  };

  const permissionLabel =
    permission === 'unsupported' ? 'Trình duyệt không hỗ trợ'
    : permission === 'granted' ? 'Đã cấp quyền'
    : permission === 'denied' ? 'Bị từ chối'
    : 'Chưa cấp quyền';

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Hồ sơ cá nhân" subtitle="Thông tin y tế, bảo mật và xuất dữ liệu" />

      <div className="card section">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-xl bg-teal-700 text-white flex items-center justify-center text-xl font-bold">{user?.fullName.charAt(0)}</div>
          <div>
            <p className="font-bold text-heading">{user?.fullName}</p>
            <p className="text-caption text-sm">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="stack">
          <h3 className="font-semibold text-heading text-sm flex items-center gap-2"><Target className="w-4 h-4" /> Thông tin cơ bản</h3>
          <div>
            <label className="input-label">Họ và tên</label>
            <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Ngày sinh</label>
              <input type="date" className="input" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Giới tính</label>
              <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Chọn</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          <h3 className="font-semibold text-heading text-sm mt-2">Thông tin y tế</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Chiều cao (cm)</label>
              <input type="number" className="input" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} placeholder="170" />
            </div>
            <div>
              <label className="input-label">Nhóm máu</label>
              <select className="input" value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value })}>
                <option value="">Chọn</option>
                {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Dị ứng</label>
            <input className="input" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="Penicillin, hải sản..." />
          </div>
          <div>
            <label className="input-label">Bệnh nền / bệnh mạn tính</label>
            <input className="input" value={form.chronicConditions} onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })} placeholder="Tiểu đường, cao huyết áp..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Liên hệ khẩn cấp</label>
              <input className="input" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="input-label">SĐT khẩn cấp</label>
              <input className="input" value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} placeholder="0901234567" />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={isLoading}>{isLoading ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>
        </form>
      </div>

      <div className="card section mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-teal-600" />
          <h2 className="font-semibold text-heading">Đổi mật khẩu</h2>
        </div>
        <form onSubmit={handleChangePassword} className="stack">
          <input type="password" className="input" placeholder="Mật khẩu hiện tại" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
          <input type="password" className="input" placeholder="Mật khẩu mới (≥6 ký tự)" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={6} />
          <input type="password" className="input" placeholder="Xác nhận mật khẩu mới" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required />
          <button type="submit" className="btn-secondary" disabled={changingPw}>{changingPw ? 'Đang đổi...' : 'Đổi mật khẩu'}</button>
        </form>
      </div>

      <div className="card section mt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-heading flex items-center gap-2"><Download className="w-5 h-5 text-teal-600" /> Xuất dữ liệu</h2>
            <p className="text-xs text-caption mt-1">Tải toàn bộ nhật ký sức khỏe dạng JSON để sao lưu hoặc mang đi khám</p>
          </div>
          <button type="button" onClick={handleExport} className="btn-primary text-sm shrink-0">Tải JSON</button>
        </div>
      </div>

      <div className="card section mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-teal-600" />
          <h2 className="font-semibold text-heading">Cài đặt thông báo</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-heading">Thông báo cảnh báo</p>
              <p className="text-xs text-caption">Trạng thái: {permissionLabel}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={notifEnabled} onChange={(e) => { setNotificationsEnabled(e.target.checked); setNotifEnabled(e.target.checked); }} disabled={permission !== 'granted'} />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:bg-teal-600 peer-disabled:opacity-50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
          {permission !== 'granted' && permission !== 'unsupported' && (
            <button type="button" onClick={handleEnableNotifications} className="btn-primary text-sm">Bật thông báo</button>
          )}
          {permission === 'granted' && notifEnabled && (
            <button type="button" onClick={() => { showBrowserNotification('HealthGuard', 'Thông báo thử nghiệm OK!'); toast('Đã gửi thông báo thử', 'success'); }} className="btn-secondary text-sm flex items-center gap-2">
              <BellRing className="w-4 h-4" /> Thử thông báo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
