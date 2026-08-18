import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { authApi } from '../../lib/api';
import type { Alert } from '@/types';
import { theme } from '../../lib/theme';

const TYPE_ICONS: Record<string, string> = {
  VITAL_ANOMALY: '💓',
  AI_SUGGESTION: '🤖',
  MEDICATION: '💊',
  SYSTEM: 'ℹ️',
};

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => authApi<Alert[]>('/alerts').then(setAlerts).catch(console.error);
  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await authApi(`/alerts/${id}/read`, { method: 'PATCH' });
    load();
  };

  const markAllRead = async () => {
    await authApi('/alerts/read-all', { method: 'PATCH' });
    load();
  };

  const unread = alerts.filter((a) => !a.isRead).length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={theme.colors.primary} />}
    >
      {unread > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
          <Text style={styles.markAllText}>Đánh dấu tất cả đã đọc ({unread})</Text>
        </TouchableOpacity>
      )}

      {alerts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>Không có cảnh báo</Text>
          <Text style={styles.emptySub}>Mọi thứ đang ổn định</Text>
        </View>
      ) : (
        alerts.map((a) => (
          <View key={a.id} style={[styles.card, !a.isRead && styles.cardUnread]}>
            <View style={styles.cardRow}>
              <Text style={styles.icon}>{TYPE_ICONS[a.type] ?? 'ℹ️'}</Text>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>{a.title}</Text>
                  {!a.isRead && <View style={styles.dot} />}
                </View>
                <Text style={styles.message}>{a.message}</Text>
                <Text style={styles.time}>{new Date(a.createdAt).toLocaleString('vi-VN')}</Text>
              </View>
            </View>
            {!a.isRead && (
              <TouchableOpacity style={styles.readBtn} onPress={() => markRead(a.id)}>
                <Text style={styles.readBtnText}>Đã đọc</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  markAllBtn: { backgroundColor: theme.colors.primaryLight, padding: 12, borderRadius: theme.radius.md, marginBottom: 12, alignItems: 'center' },
  markAllText: { color: theme.colors.primaryDark, fontWeight: '600', fontSize: 14 },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginTop: 12 },
  emptySub: { fontSize: 14, color: theme.colors.textMuted, marginTop: 4 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 14, marginBottom: 10, elevation: 1 },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: theme.colors.warning },
  cardRow: { flexDirection: 'row', gap: 12 },
  icon: { fontSize: 24 },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: '700', color: theme.colors.text, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.warning },
  message: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },
  time: { fontSize: 11, color: theme.colors.textMuted, marginTop: 6 },
  readBtn: { alignSelf: 'flex-end', marginTop: 8, paddingHorizontal: 12, paddingVertical: 6 },
  readBtnText: { color: theme.colors.primary, fontWeight: '600', fontSize: 13 },
});
