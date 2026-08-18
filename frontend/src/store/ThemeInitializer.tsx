'use client';

import { useEffect } from 'react';
import { useAppSelector } from './hooks';

export function ThemeInitializer() {
  const theme = useAppSelector((s) => s.ui.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return null;
}
