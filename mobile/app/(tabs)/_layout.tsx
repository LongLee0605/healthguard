import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { theme } from '../../lib/theme';
import { authApi } from '../../lib/api';
import type { Alert } from '@/types';
import { useAlertNotifications } from '../../hooks/useAlertNotifications';
import { getNotificationsEnabled } from '../../lib/notifications';

function NotificationWatcher() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    getNotificationsEnabled().then(setEnabled);
  }, []);

  useAlertNotifications(enabled);
  return null;
}

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = () =>
      authApi<Alert[]>('/alerts?unreadOnly=true')
        .then((alerts) => setUnreadCount(alerts.length))
        .catch(() => {});

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <NotificationWatcher />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarLabel: 'Trang chủ' }} />
        <Tabs.Screen name="chat" options={{ title: 'AI Chat', tabBarLabel: 'Chat' }} />
        <Tabs.Screen name="symptoms" options={{ title: 'Triệu chứng', tabBarLabel: 'Triệu chứng' }} />
        <Tabs.Screen name="vitals" options={{ title: 'Chỉ số', tabBarLabel: 'Chỉ số' }} />
        <Tabs.Screen name="ai" options={{ title: 'AI', tabBarLabel: 'AI' }} />
        <Tabs.Screen name="medications" options={{ title: 'Thuốc', tabBarLabel: 'Thuốc' }} />
        <Tabs.Screen
          name="alerts"
          options={{
            title: 'Cảnh báo',
            tabBarLabel: 'Cảnh báo',
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          }}
        />
        <Tabs.Screen name="profile" options={{ title: 'Hồ sơ', tabBarLabel: 'Hồ sơ' }} />
      </Tabs>
    </>
  );
}
