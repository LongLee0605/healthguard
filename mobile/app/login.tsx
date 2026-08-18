import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { MEDICAL_DISCLAIMER } from '@/types';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('demo@healthguard.vn');
  const [password, setPassword] = useState('Demo@123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Image
          source={require('../assets/icon.png')}
          style={styles.logo}
          accessibilityLabel="HealthGuard"
        />
        <Text style={styles.title}>HealthGuard</Text>
        <Text style={styles.subtitle}>Quản lý sức khỏe với AI</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>{MEDICAL_DISCLAIMER}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f0fdfa' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  logo: { width: 64, height: 64, borderRadius: 16, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#0d9488', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disclaimer: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 16, fontStyle: 'italic' },
});
