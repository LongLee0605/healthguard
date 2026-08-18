import { createHash } from 'crypto';
import type { VitalSignType } from '../common/constants';

export interface NormalizedVitalReading {
  type: VitalSignType;
  value: number;
  valueSecondary?: number;
  recordedAt: string;
  externalId: string;
  note?: string;
}

export type ImportFormat =
  | 'generic'
  | 'omron_csv'
  | 'withings_json'
  | 'apple_health'
  | 'fitbit_json'
  | 'health_connect';

function hashId(parts: string[]): string {
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32);
}

function parseDate(raw: string): Date | null {
  const d = new Date(raw.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Canonical JSON: [{ type, value, valueSecondary?, recordedAt, externalId?, note? }] */
function parseGeneric(data: unknown): NormalizedVitalReading[] {
  const rows = Array.isArray(data) ? data : (data as { readings?: unknown[] })?.readings ?? [];
  const out: NormalizedVitalReading[] = [];

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const type = String(r.type ?? '').toUpperCase() as VitalSignType;
    const value = num(r.value ?? r.systolic ?? r.sys);
    if (!value || !type) continue;

    const recordedAt =
      r.recordedAt ?? r.date ?? r.timestamp ?? r.time ?? new Date().toISOString();
    const d = parseDate(String(recordedAt));
    if (!d) continue;

    const valueSecondary = num(r.valueSecondary ?? r.diastolic ?? r.dia) ?? undefined;
    const externalId =
      String(r.externalId ?? r.id ?? '') ||
      hashId([type, String(value), String(valueSecondary ?? ''), d.toISOString()]);

    out.push({
      type,
      value,
      valueSecondary,
      recordedAt: d.toISOString(),
      externalId,
      note: r.note ? String(r.note) : undefined,
    });
  }
  return out;
}

/** Omron / máy đo CSV: date,systolic,diastolic,pulse hoặc có header tiếng Việt */
function parseOmronCsv(text: string): NormalizedVitalReading[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const hasHeader =
    header.includes('sys') ||
    header.includes('tâm thu') ||
    header.includes('systolic') ||
    header.includes('date');

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const out: NormalizedVitalReading[] = [];

  for (const line of dataLines) {
    const cols = line.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 3) continue;

    let dateStr: string;
    let sys: number | null;
    let dia: number | null;
    let pulse: number | null = null;

    if (cols[0].match(/\d{4}/) || cols[0].includes('/')) {
      dateStr = cols[0];
      sys = num(cols[1]);
      dia = num(cols[2]);
      pulse = num(cols[3]);
    } else {
      sys = num(cols[0]);
      dia = num(cols[1]);
      pulse = num(cols[2]);
      dateStr = cols[3] ?? new Date().toISOString();
    }

    if (!sys || !dia) continue;
    const d = parseDate(dateStr);
    if (!d) continue;

    const externalId = hashId(['BP', String(sys), String(dia), d.toISOString()]);
    out.push({
      type: 'BLOOD_PRESSURE',
      value: sys,
      valueSecondary: dia,
      recordedAt: d.toISOString(),
      externalId,
      note: pulse ? `Nhịp tim ${pulse} bpm` : undefined,
    });

    if (pulse && pulse >= 30 && pulse <= 220) {
      out.push({
        type: 'HEART_RATE',
        value: pulse,
        recordedAt: d.toISOString(),
        externalId: hashId(['HR', String(pulse), d.toISOString()]),
      });
    }
  }
  return out;
}

/** Withings / Health Mate export */
function parseWithingsJson(data: unknown): NormalizedVitalReading[] {
  const body = data as { body?: { measuregrps?: unknown[] }; measuregrps?: unknown[] };
  const groups = body?.body?.measuregrps ?? body?.measuregrps ?? [];
  const out: NormalizedVitalReading[] = [];

  for (const grp of groups as Record<string, unknown>[]) {
    const measures = (grp.measures as Record<string, unknown>[]) ?? [];
    const date = grp.date
      ? new Date(Number(grp.date) * 1000)
      : grp.created
        ? new Date(String(grp.created))
        : null;
    if (!date) continue;

    let sys: number | null = null;
    let dia: number | null = null;
    let hr: number | null = null;
    let weight: number | null = null;
    let spo2: number | null = null;

    for (const m of measures) {
      const type = Number(m.type);
      const val = num(m.value);
      if (val === null) continue;
      const scaled = m.unit === -3 ? val / 1000 : m.unit === 0 ? val : val;

      if (type === 9) sys = scaled;
      else if (type === 10) dia = scaled;
      else if (type === 11) hr = scaled;
      else if (type === 1) weight = scaled;
      else if (type === 54) spo2 = scaled;
    }

    const ts = date.toISOString();
    const grpId = String(grp.grpid ?? grp.id ?? hashId([ts, String(sys)]));

    if (sys && dia) {
      out.push({
        type: 'BLOOD_PRESSURE',
        value: sys,
        valueSecondary: dia,
        recordedAt: ts,
        externalId: `withings-bp-${grpId}`,
      });
    }
    if (hr) {
      out.push({
        type: 'HEART_RATE',
        value: hr,
        recordedAt: ts,
        externalId: `withings-hr-${grpId}`,
      });
    }
    if (weight) {
      out.push({
        type: 'WEIGHT',
        value: weight,
        recordedAt: ts,
        externalId: `withings-wt-${grpId}`,
      });
    }
    if (spo2) {
      out.push({
        type: 'SPO2',
        value: spo2,
        recordedAt: ts,
        externalId: `withings-spo2-${grpId}`,
      });
    }
  }
  return out;
}

/** Apple Health simplified export (array of samples) */
function parseAppleHealth(data: unknown): NormalizedVitalReading[] {
  const samples = Array.isArray(data) ? data : (data as { samples?: unknown[] })?.samples ?? [];
  const out: NormalizedVitalReading[] = [];

  const typeMap: Record<string, VitalSignType | 'BP'> = {
    HKQuantityTypeIdentifierBloodPressureSystolic: 'BLOOD_PRESSURE',
    HKQuantityTypeIdentifierBloodPressureDiastolic: 'BLOOD_PRESSURE',
    HKQuantityTypeIdentifierHeartRate: 'HEART_RATE',
    HKQuantityTypeIdentifierOxygenSaturation: 'SPO2',
    HKQuantityTypeIdentifierBodyMass: 'WEIGHT',
    HKQuantityTypeIdentifierBloodGlucose: 'BLOOD_SUGAR',
    HKQuantityTypeIdentifierBodyTemperature: 'TEMPERATURE',
    bloodPressureSystolic: 'BLOOD_PRESSURE',
    bloodPressureDiastolic: 'BLOOD_PRESSURE',
    heartRate: 'HEART_RATE',
    oxygenSaturation: 'SPO2',
    bodyMass: 'WEIGHT',
    bloodGlucose: 'BLOOD_SUGAR',
    bodyTemperature: 'TEMPERATURE',
  };

  const bpPairs = new Map<string, { sys?: number; dia?: number; at: string }>();

  for (const s of samples as Record<string, unknown>[]) {
    const rawType = String(s.type ?? s.quantityType ?? s.identifier ?? '');
    const mapped = typeMap[rawType] ?? (Object.keys(typeMap).find((k) => rawType.includes(k))
      ? typeMap[Object.keys(typeMap).find((k) => rawType.includes(k))!]
      : null);
    if (!mapped) continue;

    const value = num(s.value ?? s.quantity);
    if (value === null) continue;
    const at = String(s.startDate ?? s.date ?? s.recordedAt ?? new Date().toISOString());
    const d = parseDate(at);
    if (!d) continue;
    const ts = d.toISOString();
    const uuid = String(s.uuid ?? s.id ?? hashId([rawType, String(value), ts]));

    if (mapped === 'BLOOD_PRESSURE') {
      const key = String(s.correlationId ?? s.groupId ?? ts.slice(0, 16));
      const pair = bpPairs.get(key) ?? { at: ts };
      if (rawType.toLowerCase().includes('diastolic') || rawType.includes('Diastolic')) {
        pair.dia = value;
      } else {
        pair.sys = value;
      }
      bpPairs.set(key, pair);
      continue;
    }

    const vitalType = mapped as VitalSignType;
  const scaled = vitalType === 'SPO2' && value <= 1 ? Math.round(value * 100) : value;

    out.push({
      type: vitalType,
      value: scaled,
      recordedAt: ts,
      externalId: `apple-${uuid}`,
    });
  }

  for (const [key, pair] of bpPairs) {
    if (pair.sys && pair.dia) {
      out.push({
        type: 'BLOOD_PRESSURE',
        value: pair.sys,
        valueSecondary: pair.dia,
        recordedAt: pair.at,
        externalId: `apple-bp-${key}`,
      });
    }
  }

  return out;
}

/** Fitbit blood pressure / vitals JSON */
function parseFitbitJson(data: unknown): NormalizedVitalReading[] {
  const root = data as Record<string, unknown>;
  const bpList =
    (root['blood-pressure'] as unknown[]) ??
    (root.bloodPressure as unknown[]) ??
    (root.readings as unknown[]) ??
    [];
  const out: NormalizedVitalReading[] = [];

  for (const row of bpList) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const sys = num(r.systolic ?? r.sys);
    const dia = num(r.diastolic ?? r.dia);
    const at = String(r.dateTime ?? r.time ?? r.loggedAt ?? '');
    const d = parseDate(at);
    if (!sys || !dia || !d) continue;
    out.push({
      type: 'BLOOD_PRESSURE',
      value: sys,
      valueSecondary: dia,
      recordedAt: d.toISOString(),
      externalId: `fitbit-bp-${String(r.logId ?? hashId([String(sys), String(dia), d.toISOString()]))}`,
    });
  }
  return out;
}

export function parseDevicePayload(
  format: ImportFormat,
  payload: string | unknown,
): NormalizedVitalReading[] {
  if (format === 'omron_csv') {
    return parseOmronCsv(typeof payload === 'string' ? payload : String(payload));
  }

  let parsed: unknown = payload;
  if (typeof payload === 'string') {
    try {
      parsed = JSON.parse(payload);
    } catch {
      if (format !== 'generic') return parseOmronCsv(payload);
    }
  }

  switch (format) {
    case 'withings_json':
      return parseWithingsJson(parsed);
    case 'apple_health':
      return parseAppleHealth(parsed);
    case 'fitbit_json':
      return parseFitbitJson(parsed);
    case 'health_connect':
    case 'generic':
    default:
      return parseGeneric(parsed);
  }
}
