'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  useLoginMutation,
  useRegisterMutation,
} from '@/store/api/baseApi';
import { setCredentials, logout as logoutAction } from '@/store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, token, initialized } = useAppSelector((s) => s.auth);
  const [loginMutation, { isLoading: loginLoading }] = useLoginMutation();
  const [registerMutation, { isLoading: registerLoading }] = useRegisterMutation();

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await loginMutation({ email, password }).unwrap();
      dispatch(setCredentials({ user: res.user, token: res.accessToken, refreshToken: res.refreshToken }));
    },
    [dispatch, loginMutation],
  );

  const register = useCallback(
    async (data: { email: string; password: string; fullName: string }) => {
      const res = await registerMutation(data).unwrap();
      dispatch(setCredentials({ user: res.user, token: res.accessToken, refreshToken: res.refreshToken }));
    },
    [dispatch, registerMutation],
  );

  const logout = useCallback(() => {
    dispatch(logoutAction());
    router.push('/login');
  }, [dispatch, router]);

  return {
    user,
    token,
    loading: !initialized,
    loginLoading,
    registerLoading,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user,
  };
}
