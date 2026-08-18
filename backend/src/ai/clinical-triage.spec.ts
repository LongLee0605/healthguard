import { assessTriage, assessVitals, mergeAssessments, maxUrgency } from './clinical-triage';

describe('clinical-triage', () => {
  it('đau ngực mức 8 → HIGH, chuyên khoa tim mạch', () => {
    const r = assessTriage('đau ngực dữ dội lan tay trái, vã mồ hôi', 8, 'ngực');
    expect(r.urgency).toBe('HIGH');
    expect(r.specialty).toMatch(/Tim mạch/);
    expect(r.matchedRules).toContain('acs');
  });

  it('méo miệng + nói khó → HIGH đột quỵ', () => {
    const r = assessTriage('méo miệng, nói khó, yếu tay phải', 5);
    expect(r.urgency).toBe('HIGH');
    expect(r.specialty).toMatch(/Thần kinh|Cấp cứu/);
    expect(r.matchedRules).toContain('stroke');
  });

  it('SpO2 88% → HIGH dù triệu chứng nhẹ', () => {
    const r = assessTriage('hơi mệt', 3, undefined, [{ type: 'SPO2', value: 88, unit: '%' }]);
    expect(r.urgency).toBe('HIGH');
    expect(r.redFlags.some((f) => /SpO2/i.test(f))).toBe(true);
  });

  it('đau đầu nhẹ không ép cấp cứu', () => {
    const r = assessTriage('đau đầu nhẹ sau thức khuya', 3, 'đầu');
    expect(r.urgency).toBe('LOW');
    expect(r.matchedRules).toContain('headache');
    expect(r.matchedRules).not.toContain('acs');
  });

  it('sốt + cứng cổ → HIGH viêm màng não', () => {
    const r = assessTriage('sốt cao và cứng cổ', 6);
    expect(r.urgency).toBe('HIGH');
    expect(r.matchedRules).toContain('meningism');
  });

  it('HA 190/120 → HIGH', () => {
    const v = assessVitals([{ type: 'BLOOD_PRESSURE', value: 190, valueSecondary: 120, unit: 'mmHg' }]);
    expect(v.urgency).toBe('HIGH');
  });

  it('đường huyết 55 → HIGH', () => {
    const v = assessVitals([{ type: 'BLOOD_SUGAR', value: 55, unit: 'mg/dL' }]);
    expect(v.urgency).toBe('HIGH');
  });

  it('LLM không được hạ HIGH của luật', () => {
    const rule = assessTriage('đau ngực lan hàm, khó thở', 8);
    const merged = mergeAssessments(rule, {
      analysis: 'Có thể đau cơ, theo dõi tại nhà.',
      suggestedSpecialty: 'Cơ xương khớp',
      urgencyLevel: 'LOW',
    });
    expect(merged.urgency).toBe('HIGH');
    expect(merged.specialty).toMatch(/Tim mạch|Cấp cứu/);
  });

  it('maxUrgency chọn mức cao hơn', () => {
    expect(maxUrgency('LOW', 'HIGH')).toBe('HIGH');
    expect(maxUrgency('MEDIUM', 'LOW')).toBe('MEDIUM');
  });

  it('ngạt mũi không bị gắn nhầm ngất', () => {
    const r = assessTriage('ngạt mũi sổ mũi', 4);
    expect(r.matchedRules).not.toContain('syncope');
  });
});
