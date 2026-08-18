export type VitalSignType =
  | 'BLOOD_PRESSURE'
  | 'BLOOD_SUGAR'
  | 'WEIGHT'
  | 'HEART_RATE'
  | 'TEMPERATURE'
  | 'SPO2';

export type VitalSource =
  | 'MANUAL'
  | 'OMRON'
  | 'WITHINGS'
  | 'FITBIT'
  | 'GARMIN'
  | 'APPLE_HEALTH'
  | 'GOOGLE_FIT'
  | 'SAMSUNG_HEALTH'
  | 'XIAOMI'
  | 'HUAWEI'
  | 'BLE_MONITOR'
  | 'CSV_IMPORT'
  | 'JSON_IMPORT';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type AlertType = 'VITAL_ANOMALY' | 'AI_SUGGESTION' | 'MEDICATION' | 'SYSTEM';

export interface User {
  id: string;
  email: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  height?: number;
  bloodType?: string;
  allergies?: string;
  chronicConditions?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
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
  source?: VitalSource;
  deviceName?: string;
  syncedAt?: string;
  recordedAt: string;
  createdAt: string;
}

export interface HealthDevice {
  id: string;
  source: VitalSource;
  deviceName?: string;
  deviceModel?: string;
  lastSyncAt?: string;
  readingCount: number;
}

export interface ImportVitalsResult {
  imported: number;
  skipped: number;
  errors: string[];
  total: number;
  devices: HealthDevice[];
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
  differentials?: string[];
  redFlags?: string[];
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
  scheduleTimes?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface MedicationTodayItem {
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  status: 'PENDING' | 'TAKEN' | 'MISSED';
  logId?: string;
  loggedAt?: string;
}

export interface MedicationAdherence {
  days: number;
  taken: number;
  missed: number;
  adherenceRate: number;
}

export interface HealthGoal {
  id: string;
  title: string;
  description?: string;
  targetCount: number;
  currentCount: number;
  unit?: string;
  period: string;
  weekStart?: string;
  isCompleted: boolean;
  progress: number;
  createdAt: string;
}

export interface SymptomTrend {
  bodyPart: string;
  count: number;
  avgSeverity: number;
  lastRecordedAt: string;
  trend: 'NORMAL' | 'REPEAT' | 'RECURRING';
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

export interface WeeklyInsight {
  period: string;
  stats: { symptomCount: number; vitalCount: number; analysisCount: number; avgSeverity: string };
  insight: string;
  generatedAt: string;
}

export interface VitalChartData {
  date: string;
  value: number;
  valueSecondary?: number;
}

export interface ActivityItem {
  id: string;
  type: 'symptom' | 'vital' | 'ai' | 'alert' | 'medication';
  title: string;
  subtitle: string;
  timestamp: string;
  meta?: string;
}

export interface HealthReport {
  generatedAt: string;
  user: Pick<User, 'fullName' | 'email' | 'dateOfBirth' | 'gender'>;
  summary: DashboardStats;
  recentSymptoms: SymptomLog[];
  recentVitals: VitalSign[];
  recentAnalyses: AIAnalysis[];
  alerts: Alert[];
}

export const VITAL_LABELS: Record<VitalSignType, string> = {
  BLOOD_PRESSURE: 'Huyết áp',
  BLOOD_SUGAR: 'Đường huyết',
  WEIGHT: 'Cân nặng',
  HEART_RATE: 'Nhịp tim',
  TEMPERATURE: 'Nhiệt độ',
  SPO2: 'SpO2',
};

export const VITAL_SOURCE_LABELS: Record<VitalSource, string> = {
  MANUAL: 'Nhập tay',
  OMRON: 'Omron',
  WITHINGS: 'Withings',
  FITBIT: 'Fitbit',
  GARMIN: 'Garmin',
  APPLE_HEALTH: 'Apple Health',
  GOOGLE_FIT: 'Google Fit',
  SAMSUNG_HEALTH: 'Samsung Health',
  XIAOMI: 'Xiaomi',
  HUAWEI: 'Huawei',
  BLE_MONITOR: 'Bluetooth',
  CSV_IMPORT: 'CSV',
  JSON_IMPORT: 'JSON',
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
