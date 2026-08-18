import { useCallback, useEffect, useState } from 'react';

import {

  View, Text, TextInput, TouchableOpacity, StyleSheet,

  ScrollView, Alert, ActivityIndicator, RefreshControl,

} from 'react-native';

import { authApi } from '../../lib/api';

import type { VitalSign } from '@/types';

import { VITAL_LABELS } from '@/types';



type VitalType = VitalSign['type'];



export default function VitalsScreen() {

  const [vitals, setVitals] = useState<VitalSign[]>([]);

  const [type, setType] = useState<VitalType>('BLOOD_PRESSURE');

  const [value, setValue] = useState('');

  const [valueSecondary, setValueSecondary] = useState('');

  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(false);

  const [fetching, setFetching] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');



  const load = useCallback(async () => {

    try {

      setError('');

      const data = await authApi<VitalSign[]>('/vitals');

      setVitals(data);

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');

    } finally {

      setFetching(false);

      setRefreshing(false);

    }

  }, []);



  useEffect(() => { load(); }, [load]);



  const onRefresh = () => {

    setRefreshing(true);

    load();

  };



  const handleSubmit = async () => {

    const num = parseFloat(value);

    if (!value || Number.isNaN(num) || num <= 0) {

      return Alert.alert('Lỗi', 'Vui lòng nhập giá trị hợp lệ');

    }

    if (type === 'BLOOD_PRESSURE') {

      const dia = parseFloat(valueSecondary);

      if (!valueSecondary || Number.isNaN(dia) || dia <= 0) {

        return Alert.alert('Lỗi', 'Vui lòng nhập tâm trương');

      }

      if (num <= dia) {

        return Alert.alert('Lỗi', 'Tâm thu phải lớn hơn tâm trương');

      }

    }

    setLoading(true);

    try {

      await authApi('/vitals', {

        method: 'POST',

        body: JSON.stringify({

          type,

          value: num,

          valueSecondary: valueSecondary ? parseFloat(valueSecondary) : undefined,

          note: note.trim() || undefined,

        }),

      });

      setValue('');

      setValueSecondary('');

      setNote('');

      load();

      Alert.alert('Thành công', 'Đã lưu chỉ số');

    } catch (err) {

      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể lưu');

    } finally {

      setLoading(false);

    }

  };



  const types: VitalType[] = ['BLOOD_PRESSURE', 'BLOOD_SUGAR', 'WEIGHT'];



  if (fetching) {

    return (

      <View style={styles.centered}>

        <ActivityIndicator size="large" color="#0d9488" />

        <Text style={styles.loadingText}>Đang tải...</Text>

      </View>

    );

  }



  return (

    <ScrollView

      style={styles.container}

      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d9488']} />}

    >

      {error ? (

        <View style={styles.errorBox}>

          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity onPress={load}><Text style={styles.retryText}>Thử lại</Text></TouchableOpacity>

        </View>

      ) : null}



      <View style={styles.form}>

        <Text style={styles.label}>Loại chỉ số</Text>

        <View style={styles.typeRow}>

          {types.map((t) => (

            <TouchableOpacity

              key={t}

              style={[styles.typeBtn, type === t && styles.typeActive]}

              onPress={() => setType(t)}

            >

              <Text style={[styles.typeText, type === t && styles.typeTextActive]}>

                {VITAL_LABELS[t]}

              </Text>

            </TouchableOpacity>

          ))}

        </View>



        <Text style={styles.label}>

          {type === 'BLOOD_PRESSURE' ? 'Tâm thu (mmHg)' : 'Giá trị'}

        </Text>

        <TextInput style={styles.input} value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder={type === 'WEIGHT' ? '68.5' : type === 'BLOOD_SUGAR' ? '95' : '120'} />



        {type === 'BLOOD_PRESSURE' && (

          <>

            <Text style={styles.label}>Tâm trương (mmHg)</Text>

            <TextInput style={styles.input} value={valueSecondary} onChangeText={setValueSecondary} keyboardType="decimal-pad" placeholder="80" />

          </>

        )}



        <Text style={styles.label}>Ghi chú (tùy chọn)</Text>

        <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="Sau ăn, buổi sáng..." />



        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>

          <Text style={styles.buttonText}>{loading ? 'Đang lưu...' : 'Lưu chỉ số'}</Text>

        </TouchableOpacity>

      </View>



      <Text style={styles.sectionTitle}>Lịch sử gần đây ({vitals.length})</Text>

      {vitals.length === 0 ? (

        <View style={styles.emptyBox}>

          <Text style={styles.emptyTitle}>Chưa có chỉ số</Text>

          <Text style={styles.emptyDesc}>Bắt đầu ghi nhận chỉ số sinh hiệu</Text>

        </View>

      ) : (

        vitals.slice(0, 15).map((v) => (

          <View key={v.id} style={styles.historyItem}>

            <View style={styles.historyLeft}>

              <Text style={styles.historyType}>{VITAL_LABELS[v.type]}</Text>

              {v.note ? <Text style={styles.historyNote}>{v.note}</Text> : null}

              <Text style={styles.historyDate}>{new Date(v.recordedAt).toLocaleString('vi-VN')}</Text>

            </View>

            <Text style={styles.historyValue}>

              {v.valueSecondary ? `${v.value}/${v.valueSecondary}` : v.value} {v.unit}

            </Text>

          </View>

        ))

      )}

    </ScrollView>

  );

}



const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: '#f1f5f9', padding: 16 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },

  loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },

  form: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },

  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 8 },

  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff' },

  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },

  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1' },

  typeActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },

  typeText: { fontSize: 13, color: '#64748b' },

  typeTextActive: { color: '#fff', fontWeight: '600' },

  button: { backgroundColor: '#0d9488', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 16 },

  buttonDisabled: { opacity: 0.6 },

  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#0f172a' },

  historyItem: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, elevation: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  historyLeft: { flex: 1, marginRight: 8 },

  historyType: { fontSize: 14, fontWeight: '500', color: '#0f172a' },

  historyNote: { fontSize: 12, color: '#64748b', marginTop: 2 },

  historyValue: { fontSize: 16, fontWeight: 'bold', color: '#0d9488' },

  historyDate: { fontSize: 11, color: '#94a3b8', marginTop: 4 },

  emptyBox: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 16 },

  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#334155' },

  emptyDesc: { fontSize: 13, color: '#94a3b8', marginTop: 4, textAlign: 'center' },

  errorBox: { backgroundColor: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#fecaca' },

  errorText: { color: '#b91c1c', fontSize: 14 },

  retryText: { color: '#0d9488', fontWeight: '600', marginTop: 6, fontSize: 14 },

});


