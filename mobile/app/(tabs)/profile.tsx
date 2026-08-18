import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { MEDICAL_DISCLAIMER } from '@/types';
import {
  getNotificationsEnabled,
  registerForNotifications,
  setNotificationsEnabled,
  showTestNotification,
} from '../../lib/notifications';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    getNotificationsEnabled().then(setNotifEnabled);
  }, []);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleEnableNotifications = async () => {
    const granted = await registerForNotifications();
    setPermissionGranted(granted);
    if (granted) {
      await setNotificationsEnabled(true);
      setNotifEnabled(true);
      Alert.alert('Thành công', 'Đã bật thông báo');
    } else {
      Alert.alert('Lỗi', 'Không thể bật thông báo. Hãy cấp quyền trong cài đặt thiết bị.');
    }
  };

  const handleToggle = async (value: boolean) => {
    await setNotificationsEnabled(value);
    setNotifEnabled(value);
    if (value) await registerForNotifications();
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.fullName?.charAt(0) ?? 'U'}</Text>
      </View>
      <Text style={styles.name}>{user?.fullName}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Giới tính</Text>
        <Text style={styles.infoValue}>{user?.gender === 'male' ? 'Nam' : user?.gender ?? '—'}</Text>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Ngày sinh</Text>
        <Text style={styles.infoValue}>
          {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : '—'}
        </Text>
      </View>

      <View style={styles.notifCard}>
        <Text style={styles.notifTitle}>Thông báo cảnh báo</Text>
        <View style={styles.notifRow}>
          <Text style={styles.notifLabel}>Bật thông báo</Text>
          <Switch
            value={notifEnabled}
            onValueChange={handleToggle}
            trackColor={{ false: '#cbd5e1', true: '#99f6e4' }}
            thumbColor={notifEnabled ? '#0d9488' : '#f1f5f9'}
          />
        </View>
        {!permissionGranted && (
          <TouchableOpacity style={styles.notifBtn} onPress={handleEnableNotifications}>
            <Text style={styles.notifBtnText}>Cấp quyền thông báo</Text>
          </TouchableOpacity>
        )}
        {notifEnabled && (
          <TouchableOpacity style={styles.notifBtnSecondary} onPress={showTestNotification}>
            <Text style={styles.notifBtnSecondaryText}>Thử thông báo</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.disclaimer}>{MEDICAL_DISCLAIMER}</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0d9488', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', marginTop: 16, color: '#0f172a' },
  email: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  infoCard: { width: '100%', backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', elevation: 1 },
  infoLabel: { color: '#64748b', fontSize: 14 },
  infoValue: { fontWeight: '600', fontSize: 14 },
  notifCard: { width: '100%', backgroundColor: '#fff', borderRadius: 8, padding: 16, marginTop: 8, elevation: 1 },
  notifTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  notifRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifLabel: { fontSize: 14, color: '#334155' },
  notifBtn: { marginTop: 12, backgroundColor: '#0d9488', padding: 12, borderRadius: 8, alignItems: 'center' },
  notifBtnText: { color: '#fff', fontWeight: '600' },
  notifBtnSecondary: { marginTop: 8, padding: 12, alignItems: 'center' },
  notifBtnSecondaryText: { color: '#0d9488', fontWeight: '600' },
  disclaimer: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginTop: 24, paddingHorizontal: 16 },
  logoutBtn: { marginTop: 32, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ef4444' },
  logoutText: { color: '#ef4444', fontWeight: '600', fontSize: 16 },
});
