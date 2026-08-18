export type Urgency = 'LOW' | 'MEDIUM' | 'HIGH';

export interface VitalSnapshot {
  type: string;
  value: number;
  valueSecondary?: number | null;
  unit?: string;
}

export interface ClinicalAssessment {
  urgency: Urgency;
  specialty: string;
  redFlags: string[];
  differentials: string[];
  action: string;
  analysis: string;
  matchedRules: string[];
}

const RANK: Record<Urgency, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };

export function maxUrgency(a: Urgency, b: Urgency): Urgency {
  return RANK[a] >= RANK[b] ? a : b;
}

export function fold(text: string): string {
  return text
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function has(haystack: string, patterns: string[]): boolean {
  const h = fold(haystack);
  return patterns.some((p) => h.includes(fold(p)));
}

interface Rule {
  id: string;
  patterns: string[];
  /** Match if any group has ALL terms (AND). Used with or instead of OR-patterns. */
  allOf?: string[][];
  urgency: Urgency | ((severity: number, text: string) => Urgency);
  specialty: string;
  redFlag: string;
  differentials: string[];
  action: string;
}

function ruleMatches(text: string, rule: Rule): boolean {
  if (rule.allOf?.some((group) => group.every((p) => has(text, [p])))) return true;
  return rule.patterns.length > 0 && has(text, rule.patterns);
}

const RULES: Rule[] = [
  {
    id: 'acs',
    patterns: ['dau nguc', 'tuc nguc', 'nguc', 'nhoi mau', 'lan tay trai', 'lan ham', 'ep nguc'],
    urgency: (sev, text) =>
      sev >= 6 || has(text, ['va mo hoi', 'kho tho', 'lan tay', 'lan ham', 'non']) ? 'HIGH' : 'MEDIUM',
    specialty: 'Tim mạch / Cấp cứu',
    redFlag: 'Đau/tức ngực — loại trừ hội chứng vành cấp',
    differentials: ['Hội chứng vành cấp / nhồi máu', 'Thuyên tắc phổi', 'Đau thành ngực', 'Trào ngược'],
    action: 'Nếu lan tay/hàm, vã mồ hôi, khó thở: gọi 115, không tự dùng NSAID.',
  },
  {
    id: 'stroke',
    patterns: ['meo mieng', 'liet', 'yeu nua nguoi', 'noi kho', 'dot quy', 'meo moi', 'yeu tay'],
    urgency: 'HIGH',
    specialty: 'Cấp cứu / Thần kinh',
    redFlag: 'FAST — nghi đột quỵ',
    differentials: ['Đột quỵ thiếu máu / xuất huyết', 'Hạ đường huyết', 'Co giật', 'Liệt Bell (mếu miệng đơn thuần)'],
    action: 'Gọi 115 ngay, ghi giờ khởi phát, không cho ăn uống.',
  },
  {
    id: 'anaphylaxis',
    patterns: ['phan ve', 'phu mat', 'phu hong', 'phu luoi', 'kho tho di ung'],
    urgency: 'HIGH',
    specialty: 'Cấp cứu',
    redFlag: 'Nghi phản vệ',
    differentials: ['Phản vệ', 'Hen cấp', 'Phù mạch'],
    action: 'Gọi 115. Dùng bút adrenaline nếu bác sĩ đã chỉ định.',
  },
  {
    id: 'suicide',
    patterns: ['tu tu', 'tu hai', 'muon chet', 'ket lieu', 'tu van tu sat'],
    urgency: 'HIGH',
    specialty: 'Cấp cứu / Tâm thần',
    redFlag: 'Nguy cơ tự hại',
    differentials: ['Khủng hoảng tâm thần', 'Trầm cảm nặng'],
    action: 'Không để một mình. Đến cơ sở y tế / gọi 115.',
  },
  {
    id: 'dyspnea',
    patterns: ['kho tho', 'tim moi', 'thở khong het', 'tho gap'],
    urgency: (sev) => (sev >= 6 ? 'HIGH' : 'MEDIUM'),
    specialty: 'Hô hấp / Cấp cứu',
    redFlag: 'Khó thở',
    differentials: ['Hen/COPD cấp', 'Suy tim', 'Viêm phổi', 'Thuyên tắc phổi'],
    action: 'Nói không hết câu, tím môi, SpO2 <92%: cấp cứu.',
  },
  {
    id: 'gi-bleed',
    patterns: ['non ra mau', 'oi ra mau', 'ba ca phe', 'mao ca phe', 'phan nhu hac', 'di ngoai ra mau'],
    allOf: [
      ['phan den', 'di ngoai'],
      ['phan den', 'non'],
    ],
    urgency: 'HIGH',
    specialty: 'Cấp cứu / Tiêu hóa',
    redFlag: 'Xuất huyết tiêu hóa',
    differentials: ['Loét dạ dày tá tràng', 'Giãn tĩnh mạch thực quản', 'Trĩ (máu đỏ tươi cuối bãi)'],
    action: 'Đến viện. Không NSAID, không ăn uống nếu choáng.',
  },
  {
    id: 'meningism',
    patterns: ['cung co'],
    allOf: [
      ['sot', 'cung co'],
      ['sot', 'lo mo'],
      ['sot', 'phat ban', 'cung co'],
    ],
    urgency: 'HIGH',
    specialty: 'Cấp cứu / Thần kinh',
    redFlag: 'Sốt + cứng cổ / lơ mơ',
    differentials: ['Viêm màng não', 'Xuất huyết dưới nhện', 'Sốt xuất huyết nặng'],
    action: 'Cấp cứu ngay, không tự theo dõi.',
  },
  {
    id: 'seizure',
    patterns: ['co giat', 'dong kinh', 'can rang', 'tuon trang'],
    urgency: 'HIGH',
    specialty: 'Cấp cứu / Thần kinh',
    redFlag: 'Co giật',
    differentials: ['Động kinh', 'Hạ đường huyết', 'Sốt cao (trẻ)', 'Đột quỵ'],
    action: 'Để nằm nghiêng, không nhét gì vào miệng. Cơn >5 phút hoặc tái: 115.',
  },
  {
    id: 'hemoptysis',
    patterns: ['ho ra mau', 'ho ra bot hong'],
    urgency: 'HIGH',
    specialty: 'Cấp cứu / Hô hấp',
    redFlag: 'Ho ra máu',
    differentials: ['Viêm phổi / lao', 'Ung thư phổi', 'Thuyên tắc phổi', 'Viêm phế quản'],
    action: 'Đến viện. Lượng nhiều, khó thở: 115.',
  },
  {
    id: 'syncope',
    patterns: ['bi ngat', 'ngat xiu', 'mat y thuc', 'te xiu', 'ngat luc'],
    urgency: (sev, text) =>
      has(text, ['dau nguc', 'kho tho', 'meo mieng', 'liet']) || sev >= 7 ? 'HIGH' : 'MEDIUM',
    specialty: 'Cấp cứu / Tim mạch',
    redFlag: 'Ngất / mất ý thức',
    differentials: ['Ngất tim', 'Hạ huyết áp tư thế', 'Hạ đường', 'Động kinh'],
    action: 'Ngất kèm đau ngực/khó thở/thần kinh: cấp cứu. Không lái xe cho đến khi được khám.',
  },
  {
    id: 'pregnancy-emergency',
    patterns: [],
    allOf: [
      ['mang thai', 'dau bung'],
      ['mang thai', 'ra mau'],
      ['ba bau', 'ra mau'],
      ['thai ky', 'nhin mo'],
      ['giam cu dong thai'],
    ],
    urgency: 'HIGH',
    specialty: 'Cấp cứu / Sản khoa',
    redFlag: 'Thai kỳ + dấu hiệu nguy',
    differentials: ['Dọa sẩy / nhau bong', 'Tiền sản giật', 'Chửa ngoài tử cung'],
    action: 'Khám sản / cấp cứu ngay. Không tự dùng thuốc.',
  },
  {
    id: 'cauda',
    patterns: ['te yen ngua', 'bi tieu', 'son tieu'],
    allOf: [['yeu chan', 'te yen'], ['dau lung', 'bi tieu']],
    urgency: 'HIGH',
    specialty: 'Cấp cứu / Ngoại thần kinh',
    redFlag: 'Hội chứng đuôi ngựa / chèn ép tủy',
    differentials: ['Chèn ép tủy', 'Hội chứng đuôi ngựa', 'Đau lưng cơ học'],
    action: 'Yếu chân, tê yên ngựa, bí tiểu: cấp cứu — cửa sổ phẫu thuật hẹp.',
  },
  {
    id: 'dengue',
    patterns: ['sot xuat huyet', 'dengue', 'cham xuat huyet'],
    urgency: (sev) => (sev >= 6 ? 'HIGH' : 'MEDIUM'),
    specialty: 'Nhiệt đới / Nội khoa',
    redFlag: 'Sốt xuất huyết — giai đoạn nguy ngày 3–7',
    differentials: ['Dengue', 'Cúm', 'Sốt virus khác', 'Nhiễm khuẩn'],
    action: 'Không aspirin/ibuprofen. Viện nếu đau bụng, nôn, lạnh đầu chi khi sốt hạ.',
  },
  {
    id: 'hypoglycemia-text',
    patterns: ['ha duong', 'duong huyet thap', 'run va mo hoi tieu duong'],
    urgency: 'HIGH',
    specialty: 'Nội tiết / Cấp cứu',
    redFlag: 'Hạ đường huyết',
    differentials: ['Hạ đường huyết', 'Lo âu', 'Rối loạn nhịp'],
    action: '15g đường nhanh, đo lại 15 phút. Lơ mơ: 115. Không tăng insulin.',
  },
  {
    id: 'appendicitis',
    patterns: ['ho chau phai', 'dau bung du doi', 'bung cung'],
    urgency: (sev) => (sev >= 6 ? 'HIGH' : 'MEDIUM'),
    specialty: 'Ngoại / Cấp cứu',
    redFlag: 'Đau bụng khu trú / bụng cứng',
    differentials: ['Viêm ruột thừa', 'Sỏi mật', 'Sỏi tiết niệu', 'Viêm dạ dày'],
    action: 'Không giảm đau mạnh trước khám cấp cứu.',
  },
  {
    id: 'thunderclap',
    patterns: ['dau dau sam set', 'dau dau dot ngot du doi', 'dau dau du doi dot ngot'],
    urgency: 'HIGH',
    specialty: 'Cấp cứu / Thần kinh',
    redFlag: 'Đau đầu sấm sét',
    differentials: ['Xuất huyết dưới nhện', 'Migraine', 'Tăng HA khẩn'],
    action: 'Cấp cứu ngay.',
  },
  {
    id: 'cervicogenic',
    patterns: ['dau co', 'vai gay', 'co gay', 'cervical'],
    allOf: [
      ['dau dau', 'dau co'],
      ['dau dau', 'vai gay'],
      ['chong mat', 'dau co'],
      ['chong mat', 'vai gay'],
      ['met moi', 'dau co', 'chong mat'],
    ],
    urgency: (sev, text) =>
      has(text, ['yeu liet', 'noi kho', 'te bi', 'ngat', 'non']) ? 'HIGH' : sev >= 6 ? 'MEDIUM' : 'LOW',
    specialty: 'Thần kinh / Cơ xương khớp',
    redFlag: 'Đau cổ-vai-gáy kèm chóng mặt',
    differentials: [
      'Hội chứng cổ vai gáy / căng cơ cổ',
      'Chóng mặt do cổ (cervicogenic)',
      'Đau đầu căng thẳng',
      'Rối loạn tiền đình',
      'Tăng huyết áp',
    ],
    action: 'Tránh xoay cổ gắt, nghỉ ngơi, giữ tư thế đúng. Khám nếu chóng mặt tăng, yếu tay chân, nói khó, hoặc đau đầu dữ dội đột ngột.',
  },
  {
    id: 'headache',
    patterns: ['dau dau', 'nhuc dau', 'migraine'],
    urgency: (sev, text) =>
      sev >= 8 || has(text, ['cung co', 'yeu liet', 'sot']) ? 'HIGH' : sev >= 5 ? 'MEDIUM' : 'LOW',
    specialty: 'Thần kinh',
    redFlag: 'Đau đầu — loại trừ dấu hiệu đỏ',
    differentials: ['Căng thẳng / thiếu ngủ', 'Migraine', 'Viêm xoang', 'Tăng huyết áp'],
    action: 'Nghỉ, uống nước. Sấm sét / cứng cổ / yếu liệt: 115.',
  },
  {
    id: 'fever',
    patterns: ['sot', 'nong lanh'],
    urgency: (sev) => (sev >= 8 ? 'HIGH' : sev >= 6 ? 'MEDIUM' : 'LOW'),
    specialty: 'Nội khoa',
    redFlag: 'Sốt',
    differentials: ['Nhiễm virus', 'Dengue (VN)', 'Viêm phổi', 'UTI'],
    action: 'Bù nước, paracetamol nếu phù hợp. >3 ngày hoặc khó thở/lơ mơ: khám.',
  },
  {
    id: 'uti',
    patterns: ['tieu buot', 'tieu dat', 'nuoc tieu duc'],
    urgency: (sev, text) => (has(text, ['sot', 'dau hong lung', 'non']) || sev >= 7 ? 'HIGH' : 'MEDIUM'),
    specialty: 'Nội khoa / Tiết niệu',
    redFlag: 'Triệu chứng đường tiểu',
    differentials: ['Viêm bàng quang', 'Viêm đài bể thận', 'Sỏi'],
    action: 'Uống nhiều nước. Sốt + đau hông: khám sớm. Không tự kháng sinh.',
  },
];

export function assessVitals(vitals: VitalSnapshot[] = []): { urgency: Urgency; notes: string[] } {
  const notes: string[] = [];
  let urgency: Urgency = 'LOW';

  const bump = (u: Urgency, note: string) => {
    urgency = maxUrgency(urgency, u);
    notes.push(note);
  };

  for (const v of vitals) {
    const t = v.type.toUpperCase();
    if (t === 'SPO2' && v.value < 92) bump('HIGH', `SpO2 ${v.value}% (<92%) — cấp cứu`);
    else if (t === 'SPO2' && v.value < 95) bump('MEDIUM', `SpO2 ${v.value}% thấp nhẹ`);

    if (t === 'BLOOD_PRESSURE') {
      const sys = v.value;
      const dia = v.valueSecondary ?? 0;
      if (sys >= 180 || dia >= 120) bump('HIGH', `Huyết áp ${sys}/${dia} — ngưỡng cấp cứu nếu có triệu chứng`);
      else if (sys >= 160 || dia >= 100) bump('MEDIUM', `Huyết áp ${sys}/${dia} — cần khám sớm`);
    }

    if (t === 'BLOOD_SUGAR') {
      if (v.value < 70) bump('HIGH', `Đường huyết ${v.value} — hạ đường huyết`);
      else if (v.value >= 300) bump('HIGH', `Đường huyết ${v.value} rất cao`);
      else if (v.value >= 200) bump('MEDIUM', `Đường huyết ${v.value} cao`);
    }

    if (t === 'HEART_RATE') {
      if (v.value >= 140 || v.value <= 40) bump('HIGH', `Nhịp tim ${v.value} bpm bất thường`);
      else if (v.value >= 120 || v.value < 50) bump('MEDIUM', `Nhịp tim ${v.value} bpm cần theo dõi`);
    }

    if (t === 'TEMPERATURE' && v.value >= 40) bump('HIGH', `Nhiệt độ ${v.value}°C`);
    else if (t === 'TEMPERATURE' && v.value >= 39) bump('MEDIUM', `Sốt ${v.value}°C`);
  }

  return { urgency, notes };
}

export function assessTriage(
  description: string,
  severity: number,
  bodyPart?: string,
  vitals: VitalSnapshot[] = [],
): ClinicalAssessment {
  const text = `${description} ${bodyPart ?? ''}`.trim();
  const vital = assessVitals(vitals);

  let urgency: Urgency = severity >= 9 ? 'HIGH' : severity >= 6 ? 'MEDIUM' : 'LOW';
  let specialty = 'Đa khoa';
  const redFlags: string[] = [...vital.notes];
  const differentials: string[] = [];
  const matchedRules: string[] = [];
  const actions: string[] = [];

  let best: Rule | undefined;

  for (const rule of RULES) {
    if (!ruleMatches(text, rule)) continue;
    matchedRules.push(rule.id);
    const u = typeof rule.urgency === 'function' ? rule.urgency(severity, text) : rule.urgency;
    urgency = maxUrgency(urgency, u);
    if (!best || RANK[u] > RANK[(typeof best.urgency === 'function' ? best.urgency(severity, text) : best.urgency)]) {
      best = rule;
    }
    redFlags.push(rule.redFlag);
    differentials.push(...rule.differentials);
    actions.push(rule.action);
  }

  if (best) specialty = best.specialty;

  urgency = maxUrgency(urgency, vital.urgency);

  const uniq = (arr: string[]) => [...new Set(arr)];
  const diffs = uniq(differentials).slice(0, 5);
  const flags = uniq(redFlags);
  const action = actions[0] || (urgency === 'HIGH'
    ? 'Cần được nhân viên y tế đánh giá ngay.'
    : urgency === 'MEDIUM'
      ? 'Nên khám trong 24–72 giờ nếu không đỡ.'
      : 'Theo dõi tại nhà, ghi chép triệu chứng, khám nếu nặng hơn.');

  const analysis = [
    `Triệu chứng "${description}" mức ${severity}/10 được phân tầng ${urgency}.`,
    flags.length
      ? `Dấu hiệu cần chú ý:\n- ${flags.join('\n- ')}`
      : 'Chưa thấy cụm dấu hiệu đỏ điển hình trên mô tả.',
    diffs.length
      ? `Chẩn đoán phân biệt (tham khảo, không khẳng định):\n- ${diffs.join('\n- ')}`
      : '',
    action,
    'Thông tin này chỉ mang tính tham khảo, không thay thế tư vấn y khoa chuyên nghiệp.',
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    urgency,
    specialty,
    redFlags: flags,
    differentials: diffs,
    action,
    analysis,
    matchedRules,
  };
}

export function mergeAssessments(
  rule: ClinicalAssessment,
  llm: { analysis?: string; suggestedSpecialty?: string; urgencyLevel?: string },
): ClinicalAssessment {
  const llmU = String(llm.urgencyLevel || '').toUpperCase();
  const llmUrgency: Urgency =
    llmU === 'HIGH' || llmU === 'MEDIUM' || llmU === 'LOW' ? llmU : rule.urgency;
  const urgency = maxUrgency(rule.urgency, llmUrgency);
  const specialty =
    rule.urgency === 'HIGH' ? rule.specialty : llm.suggestedSpecialty || rule.specialty;
  const llmText = (llm.analysis || '').trim();
  const analysis = [
    llmText.length >= 40 ? llmText : rule.analysis,
    rule.differentials.length
      ? `Chẩn đoán phân biệt (tham khảo):\n- ${rule.differentials.join('\n- ')}`
      : '',
    rule.redFlags.length ? `Dấu hiệu đỏ / chỉ số:\n- ${rule.redFlags.join('\n- ')}` : '',
    urgency === 'HIGH' ? rule.action : '',
    'Thông tin này chỉ mang tính tham khảo, không thay thế tư vấn y khoa chuyên nghiệp.',
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();

  return { ...rule, urgency, specialty, analysis };
}
