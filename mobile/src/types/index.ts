export type VitalSignType = 'BLOOD_PRESSURE' | 'BLOOD_SUGAR' | 'WEIGHT';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type AlertType = 'VITAL_ANOMALY' | 'AI_SUGGESTION' | 'MEDICATION' | 'SYSTEM';

export interface User {
  id: string;
  email: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  createdAt: string;
}

export interface SymptomLog {
  id: string;
  userId: string;
  description: string;
  severity: number;
  bodyPart?: string;
  recordedAt: string;
  createdAt: string;
}

export interface VitalSign {
  id: string;
  userId: string;
  type: VitalSignType;
  value: number;
  valueSecondary?: number;
  unit: string;
  note?: string;
  recordedAt: string;
  createdAt: string;
}

export interface AIAnalysis {
  id: string;
  userId: string;
  symptomLogId?: string;
  inputSummary: string;
  analysis: string;
  suggestedSpecialty?: string;
  urgencyLevel: UrgencyLevel;
  createdAt: string;
}

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Alert {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: AlertType;
  severity: AlertSeverity;
  sourceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface MedicationReminder {
  id: string;
  userId: string;
  medicationName: string;
  dosage: string;
  schedule: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface DashboardStats {
  totalSymptoms: number;
  totalVitals: number;
  unreadAlerts: number;
  totalMedications: number;
  healthScore: number;
  streak: number;
  achievements: Achievement[];
  lastAnalysis?: AIAnalysis;
}

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export const VITAL_LABELS: Record<VitalSignType, string> = {
  BLOOD_PRESSURE: 'Huyết áp',
  BLOOD_SUGAR: 'Đường huyết',
  WEIGHT: 'Cân nặng',
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  LOW: 'Theo dõi tại nhà',
  MEDIUM: 'Nên khám trong vài ngày',
  HIGH: 'Cần khám sớm',
};

export const SYMPTOM_TEMPLATES = [
  { label: 'Đau đầu', description: 'Đau đầu, căng thẳng', bodyPart: 'Đầu' },
  { label: 'Đau ngực', description: 'Đau ngực, khó thở', bodyPart: 'Ngực' },
  { label: 'Sốt', description: 'Sốt, mệt mỏi, ớn lạnh', bodyPart: 'Toàn thân' },
  { label: 'Đau bụng', description: 'Đau bụng, buồn nôn', bodyPart: 'Bụng' },
  { label: 'Mất ngủ', description: 'Khó ngủ, mệt mỏi ban ngày', bodyPart: 'Toàn thân' },
];

export const MEDICAL_DISCLAIMER =
  'Thông tin này chỉ mang tính tham khảo, không thay thế tư vấn y khoa chuyên nghiệp.';
