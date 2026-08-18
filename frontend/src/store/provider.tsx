'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from './index';
import { AuthInitializer } from './AuthInitializer';
import { ThemeInitializer } from './ThemeInitializer';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <ThemeInitializer />
      <AuthInitializer />
      {children}
    </Provider>
  );
}
