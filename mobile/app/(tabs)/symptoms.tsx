import { useCallback, useEffect, useState } from 'react';

import {

  View, Text, TextInput, TouchableOpacity, StyleSheet,

  ScrollView, Alert, ActivityIndicator, RefreshControl,

} from 'react-native';

import { authApi } from '../../lib/api';

import type { SymptomLog } from '@/types';



export default function SymptomsScreen() {

  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);

  const [description, setDescription] = useState('');

  const [severity, setSeverity] = useState(5);

  const [bodyPart, setBodyPart] = useState('');

  const [loading, setLoading] = useState(false);

  const [fetching, setFetching] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');



  const load = useCallback(async () => {

    try {

      setError('');

      const data = await authApi<SymptomLog[]>('/symptoms');

      setSymptoms(data);

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

    if (!description.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập mô tả triệu chứng');

    setLoading(true);

    try {

      await authApi('/symptoms', {

        method: 'POST',

        body: JSON.stringify({ description: description.trim(), severity, bodyPart: bodyPart.trim() || undefined }),

      });

      setDescription('');

      setSeverity(5);

      setBodyPart('');

      load();

      Alert.alert('Thành công', 'Đã lưu triệu chứng');

    } catch (err) {

      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể lưu');

    } finally {

      setLoading(false);

    }

  };



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

        <Text style={styles.label}>Mô tả triệu chứng</Text>

        <TextInput

          style={[styles.input, styles.textarea]}

          multiline

          value={description}

          onChangeText={setDescription}

          placeholder="Ví dụ: Đau đầu nhẹ, căng thẳng..."

        />

        <Text style={styles.label}>Mức độ: {severity}/10</Text>

        <View style={styles.severityRow}>

          {[1, 3, 5, 7, 10].map((v) => (

            <TouchableOpacity

              key={v}

              style={[styles.severityBtn, severity === v && styles.severityActive]}

              onPress={() => setSeverity(v)}

            >

              <Text style={[styles.severityText, severity === v && styles.severityTextActive]}>{v}</Text>

            </TouchableOpacity>

          ))}

        </View>

        <Text style={styles.label}>Vị trí cơ thể</Text>

        <TextInput style={styles.input} value={bodyPart} onChangeText={setBodyPart} placeholder="Đầu, ngực..." />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>

          <Text style={styles.buttonText}>{loading ? 'Đang lưu...' : 'Lưu triệu chứng'}</Text>

        </TouchableOpacity>

      </View>



      <Text style={styles.sectionTitle}>Lịch sử ({symptoms.length})</Text>

      {symptoms.length === 0 ? (

        <View style={styles.emptyBox}>

          <Text style={styles.emptyTitle}>Chưa có triệu chứng</Text>

          <Text style={styles.emptyDesc}>Ghi nhận triệu chứng để theo dõi sức khỏe</Text>

        </View>

      ) : (

        symptoms.map((s) => (

          <View key={s.id} style={styles.historyItem}>

            <Text style={styles.historyDesc}>{s.description}</Text>

            <Text style={styles.historyMeta}>

              Mức {s.severity}/10{s.bodyPart ? ` • ${s.bodyPart}` : ''} • {new Date(s.recordedAt).toLocaleDateString('vi-VN')}

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

  textarea: { minHeight: 80, textAlignVertical: 'top' },

  severityRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },

  severityBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },

  severityActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },

  severityText: { fontSize: 14, color: '#64748b' },

  severityTextActive: { color: '#fff', fontWeight: 'bold' },

  button: { backgroundColor: '#0d9488', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 16 },

  buttonDisabled: { opacity: 0.6 },

  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#0f172a' },

  historyItem: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, elevation: 1 },

  historyDesc: { fontSize: 15, fontWeight: '500', color: '#0f172a' },

  historyMeta: { fontSize: 12, color: '#64748b', marginTop: 4 },

  emptyBox: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 16 },

  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#334155' },

  emptyDesc: { fontSize: 13, color: '#94a3b8', marginTop: 4, textAlign: 'center' },

  errorBox: { backgroundColor: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#fecaca' },

  errorText: { color: '#b91c1c', fontSize: 14 },

  retryText: { color: '#0d9488', fontWeight: '600', marginTop: 6, fontSize: 14 },

});


