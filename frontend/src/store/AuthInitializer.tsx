'use client';

import { useEffect } from 'react';
import { useGetMeQuery } from './api/baseApi';
import { logout, setInitialized, setUser } from './slices/authSlice';
import { useAppDispatch, useAppSelector } from './hooks';

export function AuthInitializer() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const { data, error, isLoading } = useGetMeQuery(undefined, { skip: !token });

  useEffect(() => {
    if (!token) {
      dispatch(setInitialized(true));
      return;
    }
    if (data) {
      dispatch(setUser(data));
      dispatch(setInitialized(true));
    }
    if (error) {
      dispatch(logout());
      dispatch(setInitialized(true));
    }
  }, [token, data, error, dispatch]);

  useEffect(() => {
    if (token && !data && !error && isLoading) return;
    if (token && !data && !error && !isLoading) {
      dispatch(setInitialized(true));
    }
  }, [token, data, error, isLoading, dispatch]);

  return null;
}
