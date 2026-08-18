'use client';

import { toggleTheme } from '@/store/slices/uiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function useTheme() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.ui.theme);

  return {
    theme,
    toggle: () => dispatch(toggleTheme()),
  };
}
