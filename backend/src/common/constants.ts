export type VitalSignType =
  | 'BLOOD_PRESSURE'
  | 'BLOOD_SUGAR'
  | 'WEIGHT'
  | 'HEART_RATE'
  | 'TEMPERATURE'
  | 'SPO2';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export const VITAL_TYPES: VitalSignType[] = [
  'BLOOD_PRESSURE',
  'BLOOD_SUGAR',
  'WEIGHT',
  'HEART_RATE',
  'TEMPERATURE',
  'SPO2',
];

export const VITAL_UNITS: Record<VitalSignType, string> = {
  BLOOD_PRESSURE: 'mmHg',
  BLOOD_SUGAR: 'mg/dL',
  WEIGHT: 'kg',
  HEART_RATE: 'bpm',
  TEMPERATURE: '°C',
  SPO2: '%',
};

export const VITAL_LABELS: Record<VitalSignType, string> = {
  BLOOD_PRESSURE: 'Huyết áp',
  BLOOD_SUGAR: 'Đường huyết',
  WEIGHT: 'Cân nặng',
  HEART_RATE: 'Nhịp tim',
  TEMPERATURE: 'Nhiệt độ',
  SPO2: 'SpO2',
};

export const MEDICAL_DISCLAIMER =
  'Thông tin này chỉ mang tính tham khảo, không thay thế tư vấn y khoa chuyên nghiệp.';

/** Nguồn dữ liệu chỉ số — thiết bị / nền tảng sức khỏe */
export const VITAL_SOURCES = [
  'MANUAL',
  'OMRON',
  'WITHINGS',
  'FITBIT',
  'GARMIN',
  'APPLE_HEALTH',
  'GOOGLE_FIT',
  'SAMSUNG_HEALTH',
  'XIAOMI',
  'HUAWEI',
  'BLE_MONITOR',
  'CSV_IMPORT',
  'JSON_IMPORT',
] as const;

export type VitalSource = (typeof VITAL_SOURCES)[number];

export const VITAL_SOURCE_LABELS: Record<VitalSource, string> = {
  MANUAL: 'Nhập tay',
  OMRON: 'Omron',
  WITHINGS: 'Withings',
  FITBIT: 'Fitbit',
  GARMIN: 'Garmin',
  APPLE_HEALTH: 'Apple Health',
  GOOGLE_FIT: 'Google Fit',
  SAMSUNG_HEALTH: 'Samsung Health',
  XIAOMI: 'Xiaomi / Mi Fit',
  HUAWEI: 'Huawei Health',
  BLE_MONITOR: 'Máy đo Bluetooth',
  CSV_IMPORT: 'File CSV',
  JSON_IMPORT: 'File JSON',
};
