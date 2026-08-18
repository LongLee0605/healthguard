const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function api<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('accessToken');
}

export async function setToken(token: string) {
  await AsyncStorage.setItem('accessToken', token);
}

export async function clearToken() {
  await AsyncStorage.removeItem('accessToken');
}

export async function authApi<T>(path: string, options: RequestInit = {}) {
  const token = await getToken();
  return api<T>(path, options, token);
}
