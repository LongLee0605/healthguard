import { parseDevicePayload } from './device-vitals.adapter';

describe('device-vitals.adapter', () => {
  it('parses Omron CSV with header', () => {
    const csv = `Date,Systolic,Diastolic,Pulse
2026-01-15 08:30,120,80,72
2026-01-16 09:00,135,88,78`;
    const rows = parseDevicePayload('omron_csv', csv);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    const bp = rows.find((r) => r.type === 'BLOOD_PRESSURE' && r.value === 120);
    expect(bp).toBeDefined();
    expect(bp?.valueSecondary).toBe(80);
    expect(bp?.externalId).toBeTruthy();
  });

  it('parses generic JSON array', () => {
    const data = [
      {
        type: 'BLOOD_PRESSURE',
        value: 118,
        valueSecondary: 76,
        recordedAt: '2026-02-01T10:00:00.000Z',
      },
    ];
    const rows = parseDevicePayload('generic', data);
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe('BLOOD_PRESSURE');
    expect(rows[0].value).toBe(118);
  });

  it('parses Fitbit blood pressure JSON', () => {
    const data = {
      'blood-pressure': [
        { systolic: 122, diastolic: 81, dateTime: '2026-03-01T07:00:00', logId: 'abc123' },
      ],
    };
    const rows = parseDevicePayload('fitbit_json', data);
    expect(rows).toHaveLength(1);
    expect(rows[0].externalId).toContain('fitbit-bp-abc123');
  });
});
