export const theme = {
  colors: {
    primary: '#0d9488',
    primaryDark: '#0f766e',
    primaryLight: '#ccfbf1',
    background: '#f1f5f9',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    danger: '#ef4444',
    warning: '#f59e0b',
    success: '#22c55e',
    border: '#e2e8f0',
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 20 },
  spacing: { sm: 8, md: 16, lg: 24 },
};

export const urgencyColors: Record<string, { bg: string; text: string }> = {
  LOW: { bg: '#d1fae5', text: '#065f46' },
  MEDIUM: { bg: '#fef3c7', text: '#92400e' },
  HIGH: { bg: '#fee2e2', text: '#991b1b' },
};
