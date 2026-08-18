import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { authApi } from '../../lib/api';
import type { AIAnalysis } from '@/types';
import { SYMPTOM_TEMPLATES, URGENCY_LABELS, MEDICAL_DISCLAIMER } from '@/types';
import { theme, urgencyColors } from '../../lib/theme';

export default function AIScreen() {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(5);
  const [bodyPart, setBodyPart] = useState('');
  const [result, setResult] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!description.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập triệu chứng');
    setLoading(true);
    setResult(null);
    try {
      const analysis = await authApi<AIAnalysis>('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({ description, severity, bodyPart: bodyPart || undefined }),
      });
      setResult(analysis);
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Phân tích thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.disclaimer}>{MEDICAL_DISCLAIMER}</Text>

      <View style={styles.templates}>
        {SYMPTOM_TEMPLATES.map((t) => (
          <TouchableOpacity
            key={t.label}
            style={styles.templateBtn}
            onPress={() => { setDescription(t.description); setBodyPart(t.bodyPart); setSeverity(5); }}
          >
            <Text style={styles.templateText}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, styles.textarea]}
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder="Mô tả chi tiết triệu chứng..."
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
        <TextInput style={styles.input} value={bodyPart} onChangeText={setBodyPart} placeholder="Vị trí (Đầu, ngực...)" />
        <TouchableOpacity style={styles.button} onPress={handleAnalyze} disabled={loading}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.buttonText}>  AI đang phân tích...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>🤖 Phân tích với AI</Text>
          )}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>✨ Kết quả phân tích</Text>
          <Text style={styles.resultText}>{result.analysis}</Text>
          <View style={styles.resultMeta}>
            <View style={[styles.badge, { backgroundColor: urgencyColors[result.urgencyLevel]?.bg }]}>
              <Text style={[styles.badgeText, { color: urgencyColors[result.urgencyLevel]?.text }]}>
                {URGENCY_LABELS[result.urgencyLevel]}
              </Text>
            </View>
            {result.suggestedSpecialty && (
              <Text style={styles.specialty}>→ {result.suggestedSpecialty}</Text>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  disclaimer: { fontSize: 11, color: theme.colors.textMuted, fontStyle: 'italic', marginBottom: 12, textAlign: 'center' },
  templates: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  templateBtn: { backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border },
  templateText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
  form: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, elevation: 2 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 12, fontSize: 15, backgroundColor: '#fafafa' },
  textarea: { minHeight: 100, textAlignVertical: 'top', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 8 },
  severityRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  severityBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  severityActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  severityText: { fontSize: 14, color: theme.colors.textSecondary },
  severityTextActive: { color: '#fff', fontWeight: 'bold' },
  button: { backgroundColor: '#7c3aed', borderRadius: theme.radius.md, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  result: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, marginTop: 16, borderWidth: 2, borderColor: theme.colors.primaryLight, elevation: 2 },
  resultTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.primary, marginBottom: 8 },
  resultText: { fontSize: 15, color: theme.colors.text, lineHeight: 22 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  specialty: { fontSize: 13, color: theme.colors.textSecondary },
});
