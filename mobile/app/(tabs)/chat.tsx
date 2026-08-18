import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { authApi } from '../../lib/api';
import type { ChatMessage } from '@/types';
import { MEDICAL_DISCLAIMER } from '@/types';
import { theme } from '../../lib/theme';

const SUGGESTIONS = ['Tôi bị đau đầu', 'Huyết áp cao có sao?', 'Cách ngủ ngon?'];

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await authApi<ChatMessage[]>('/ai/chat');
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải chat');
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { id: `t-${Date.now()}`, role: 'user', content: text, createdAt: new Date().toISOString() };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const reply = await authApi<ChatMessage>('/ai/chat', { method: 'POST', body: JSON.stringify({ message: text }) });
      setMessages((p) => [...p.filter((m) => m.id !== userMsg.id), userMsg, reply]);
    } catch {
      setMessages((p) => [...p, { id: 'e', role: 'assistant', content: 'Lỗi kết nối AI. Vui lòng thử lại.', createdAt: new Date().toISOString() }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Đang tải lịch sử chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={theme.colors.primary} />}
      >
        {error && (
          <TouchableOpacity style={styles.errorBox} onPress={load}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Chạm để thử lại</Text>
          </TouchableOpacity>
        )}
        {messages.length === 0 && !error && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>HealthGuard AI Chat</Text>
            <Text style={styles.emptySub}>Hỏi bất cứ điều gì về sức khỏe</Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity key={s} style={styles.sugBtn} onPress={() => send(s)}>
                  <Text style={styles.sugText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {messages.map((m) => (
          <View key={m.id} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            {m.role === 'assistant' && <Text style={styles.aiLabel}>HealthGuard AI</Text>}
            <Text style={[styles.bubbleText, m.role === 'user' && styles.userText]}>{m.content}</Text>
          </View>
        ))}
        {loading && <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 12 }} />}
      </ScrollView>
      <View style={styles.inputBar}>
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Nhập câu hỏi..." multiline />
        <TouchableOpacity style={styles.sendBtn} onPress={() => send(input)} disabled={loading}>
          <Text style={styles.sendText}>Gửi</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.disclaimer}>{MEDICAL_DISCLAIMER}</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  loadingText: { marginTop: 12, color: theme.colors.textSecondary },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 8 },
  errorBox: { backgroundColor: '#fef2f2', padding: 12, borderRadius: 8, marginBottom: 12 },
  errorText: { color: '#b91c1c', fontSize: 14 },
  retryText: { color: theme.colors.primary, fontSize: 12, marginTop: 4, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptySub: { color: theme.colors.textSecondary, marginTop: 4 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  sugBtn: { backgroundColor: theme.colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  sugText: { color: theme.colors.primaryDark, fontSize: 12, fontWeight: '500' },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: 16, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface, borderBottomLeftRadius: 4, elevation: 1 },
  aiLabel: { fontSize: 11, color: theme.colors.primary, fontWeight: '700', marginBottom: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20, color: theme.colors.text },
  userText: { color: '#fff' },
  inputBar: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border },
  input: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, fontSize: 15 },
  sendBtn: { paddingHorizontal: 16, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  disclaimer: { fontSize: 10, color: theme.colors.textMuted, textAlign: 'center', padding: 8, fontStyle: 'italic' },
});
