import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { authApi } from '../../lib/api';
import type { MedicationReminder } from '@/types';
import { theme } from '../../lib/theme';

import { scheduleMedicationNotifications } from '../../lib/notifications';

export default function MedicationsScreen() {
  const [items, setItems] = useState<MedicationReminder[]>([]);
  const [form, setForm] = useState({ medicationName: '', dosage: '', schedule: '08:00' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const data = await authApi<MedicationReminder[]>('/medications');
    setItems(data);
    await scheduleMedicationNotifications(data);
  };
  useEffect(() => { load().catch(console.error); }, []);

  const handleSubmit = async () => {
    if (!form.medicationName.trim()) return Alert.alert('Lỗi', 'Nhập tên thuốc');
    if (!/^\d{1,2}:\d{2}$/.test(form.schedule.trim())) return Alert.alert('Lỗi', 'Lịch uống phải theo định dạng HH:mm (vd: 08:00)');
    setLoading(true);
    try {
      await authApi('/medications', { method: 'POST', body: JSON.stringify(form) });
      setForm({ medicationName: '', dosage: '', schedule: '08:00' });
      await load();
      Alert.alert('Thành công', 'Đã thêm nhắc uống thuốc');
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể lưu');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (item: MedicationReminder) => {
    await authApi(`/medications/${item.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !item.isActive }) });
    load();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.formTitle}>💊 Thêm thuốc mới</Text>
        <TextInput style={styles.input} placeholder="Tên thuốc" value={form.medicationName} onChangeText={(v) => setForm({ ...form, medicationName: v })} />
        <TextInput style={styles.input} placeholder="Liều lượng (500mg, 1 viên...)" value={form.dosage} onChangeText={(v) => setForm({ ...form, dosage: v })} />
        <TextInput style={styles.input} placeholder="Lịch uống (HH:mm, vd: 08:00)" value={form.schedule} onChangeText={(v) => setForm({ ...form, schedule: v })} keyboardType="numbers-and-punctuation" />
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Đang lưu...' : 'Thêm nhắc nhở'}</Text>
        </TouchableOpacity>
      </View>

      {items.map((item) => (
        <View key={item.id} style={[styles.item, !item.isActive && styles.itemInactive]}>
          <View style={styles.itemIcon}><Text style={{ fontSize: 24 }}>💊</Text></View>
          <View style={styles.itemContent}>
            <Text style={styles.itemName}>{item.medicationName}</Text>
            <Text style={styles.itemDosage}>{item.dosage}</Text>
            <Text style={styles.itemSchedule}>⏰ {item.schedule}</Text>
          </View>
          <TouchableOpacity style={styles.toggleBtn} onPress={() => toggleActive(item)}>
            <Text style={styles.toggleText}>{item.isActive ? '⏸' : '▶️'}</Text>
          </TouchableOpacity>
        </View>
      ))}
      {items.length === 0 && <Text style={styles.empty}>Chưa có thuốc nào</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  form: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, marginBottom: 16, elevation: 2 },
  formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: theme.colors.text },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 12, marginBottom: 10, fontSize: 15, backgroundColor: '#fafafa' },
  button: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, padding: 14, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  item: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  itemInactive: { opacity: 0.55 },
  itemIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemContent: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  itemDosage: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  itemSchedule: { fontSize: 12, color: theme.colors.primary, marginTop: 4, fontWeight: '500' },
  toggleBtn: { padding: 8 },
  toggleText: { fontSize: 20 },
  empty: { textAlign: 'center', color: theme.colors.textMuted, marginTop: 24, fontSize: 14 },
});
