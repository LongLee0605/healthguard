import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../lib/api';
import type { DashboardStats, Alert } from '@/types';
import { URGENCY_LABELS } from '@/types';
import { useAuth } from '../../context/AuthContext';
import { theme, urgencyColors } from '../../lib/theme';

const QUICK_ACTIONS = [
  { route: '/(tabs)/chat', label: 'AI Chat', icon: '💬', color: '#ede9fe' },
  { route: '/(tabs)/vitals', label: 'Ghi chỉ số', icon: '💓', color: '#fce7f3' },
  { route: '/(tabs)/symptoms', label: 'Triệu chứng', icon: '📝', color: '#dbeafe' },
  { route: '/(tabs)/ai', label: 'Phân tích AI', icon: '🤖', color: '#d1fae5' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [s, a] = await Promise.all([
        authApi<DashboardStats>('/dashboard/stats'),
        authApi<Alert[]>('/alerts?unreadOnly=true'),
      ]);
      setStats(s);
      setAlerts(a);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const scoreColor = (stats?.healthScore ?? 0) >= 80 ? theme.colors.success : (stats?.healthScore ?? 0) >= 60 ? theme.colors.warning : theme.colors.danger;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={theme.colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.name}>{user?.fullName} 👋</Text>
      </View>

      <View style={styles.scoreCard}>
        <View>
          <Text style={styles.scoreLabel}>Điểm sức khỏe</Text>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>{stats?.healthScore ?? '—'}</Text>
          <Text style={styles.scoreSub}>/100</Text>
          {(stats?.streak ?? 0) > 0 && (
            <Text style={styles.streakBadge}>🔥 {stats?.streak} ngày streak</Text>
          )}
        </View>
        <View style={styles.statsMini}>
          {[
            { label: 'Triệu chứng', value: stats?.totalSymptoms ?? 0 },
            { label: 'Chỉ số', value: stats?.totalVitals ?? 0 },
            { label: 'Cảnh báo', value: stats?.unreadAlerts ?? 0 },
          ].map((s) => (
            <View key={s.label} style={styles.miniItem}>
              <Text style={styles.miniValue}>{s.value}</Text>
              <Text style={styles.miniLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
      <View style={styles.actionsRow}>
        {QUICK_ACTIONS.map((a) => (
          <TouchableOpacity key={a.route} style={[styles.actionBtn, { backgroundColor: a.color }]} onPress={() => router.push(a.route as never)}>
            <Text style={styles.actionIcon}>{a.icon}</Text>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {stats?.lastAnalysis && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤖 Phân tích AI gần nhất</Text>
          <Text style={styles.cardSub}>{stats.lastAnalysis.inputSummary}</Text>
          <Text style={styles.cardText} numberOfLines={3}>{stats.lastAnalysis.analysis}</Text>
          <View style={[styles.badge, { backgroundColor: urgencyColors[stats.lastAnalysis.urgencyLevel]?.bg }]}>
            <Text style={[styles.badgeText, { color: urgencyColors[stats.lastAnalysis.urgencyLevel]?.text }]}>
              {URGENCY_LABELS[stats.lastAnalysis.urgencyLevel]}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>🔔 Cảnh báo ({alerts.length})</Text>
          {alerts.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/alerts' as never)}>
              <Text style={styles.link}>Xem tất cả</Text>
            </TouchableOpacity>
          )}
        </View>
        {alerts.length === 0 ? (
          <Text style={styles.empty}>✅ Không có cảnh báo mới</Text>
        ) : (
          alerts.slice(0, 3).map((a) => (
            <View key={a.id} style={styles.alertItem}>
              <Text style={styles.alertTitle}>{a.title}</Text>
              <Text style={styles.alertMsg} numberOfLines={2}>{a.message}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  header: { marginBottom: 20 },
  greeting: { fontSize: 14, color: theme.colors.textSecondary },
  name: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginTop: 2 },
  scoreCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 20, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
  scoreLabel: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
  scoreValue: { fontSize: 48, fontWeight: 'bold', lineHeight: 52 },
  scoreSub: { fontSize: 14, color: theme.colors.textMuted },
  streakBadge: { fontSize: 12, color: theme.colors.warning, fontWeight: '700', marginTop: 6 },
  statsMini: { justifyContent: 'space-around' },
  miniItem: { alignItems: 'center', marginLeft: 12 },
  miniValue: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary },
  miniLabel: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  actionBtn: { width: '47%', borderRadius: theme.radius.md, padding: 14, alignItems: 'center' },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.text, marginTop: 6 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  cardSub: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 4 },
  cardText: { fontSize: 14, color: theme.colors.text, lineHeight: 20 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  link: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },
  empty: { color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  alertItem: { borderLeftWidth: 3, borderLeftColor: theme.colors.warning, paddingLeft: 12, marginBottom: 12 },
  alertTitle: { fontWeight: '600', fontSize: 14 },
  alertMsg: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
});
