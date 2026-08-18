import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MEDICAL_DISCLAIMER } from '../common/constants';
import { LocalLlmService } from './local-llm.service';
import { RagService } from './rag.service';
import { ANALYSIS_SYSTEM_PROMPT, MEDICAL_SYSTEM_PROMPT } from './medical-prompt';
import {
  assessTriage,
  mergeAssessments,
  type VitalSnapshot,
} from './clinical-triage';

export interface AnalysisResult {
  analysis: string;
  suggestedSpecialty: string;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  differentials?: string[];
  redFlags?: string[];
}

@Injectable()
export class AiService {
  private readonly disclaimerPattern = new RegExp(
    `${MEDICAL_DISCLAIMER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    'g',
  );

  constructor(
    private readonly config: ConfigService,
    private readonly localLlm: LocalLlmService,
    private readonly rag: RagService,
  ) {}

  private normalizeChatReply(reply: string, includeDisclaimer: boolean): string {
    const compact = reply
      .replace(this.disclaimerPattern, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+\n/g, '\n')
      .trim();

    if (!includeDisclaimer) {
      return compact;
    }

    const base = compact.replace(/[.!?\s]+$/, '').trim();
    return `${base}\n\n${MEDICAL_DISCLAIMER}`;
  }

  private buildChatFallback(
    triage: ReturnType<typeof assessTriage>,
    message: string,
  ): string {
    const symptomText = message
      .replace(/\?+$/g, '')
      .replace(/^(tôi|mình|tui)\s+(bị|đang|có)\s+/i, '')
      .replace(/\s*(thì bị gì|là bị gì|có sao không|nguy hiểm không)\s*$/i, '')
      .trim();

    const urgencyLabel =
      triage.urgency === 'HIGH'
        ? 'cần đánh giá cấp cứu ngay'
        : triage.urgency === 'MEDIUM'
          ? 'nên khám trong 24–72 giờ nếu không đỡ'
          : 'có thể theo dõi tại nhà nhưng cần tái khám nếu nặng hơn';

    const diffs =
      triage.differentials.length > 0
        ? triage.differentials.slice(0, 3).map((d) => `- ${d}`).join('\n')
        : '- Cần thêm thông tin lâm sàng để thu hẹp nguyên nhân';

    const redFlags =
      triage.redFlags.length > 0
        ? triage.redFlags.map((f) => `- ${f}`).join('\n')
        : '- Chưa thấy dấu hiệu đỏ rõ trong mô tả hiện tại';

    const emergency =
      triage.urgency === 'HIGH'
        ? 'Gọi 115 hoặc đến cấp cứu ngay nếu triệu chứng đang diễn tiến.'
        : 'Đi cấp cứu ngay nếu xuất hiện: sốt cao + cứng cổ, yếu liệt/nói khó, đau ngực, khó thở nặng, ngất, hoặc triệu chứng tăng nhanh.';

    return [
      'Nhận định',
      symptomText
        ? `Bạn mô tả: ${symptomText}. Mức độ hiện tại ${urgencyLabel}.`
        : `Triệu chứng hiện tại ${urgencyLabel}.`,
      '',
      'Khả năng nhiều nhất',
      diffs,
      '',
      'Cần làm ngay',
      `- ${triage.action}`,
      '- Nghỉ ngơi, uống đủ nước, tránh tự dùng thuốc mạnh khi chưa được bác sĩ hướng dẫn.',
      '',
      'Khi nào đi cấp cứu / đi khám',
      redFlags,
      emergency,
      '',
      'Cần làm rõ thêm: triệu chứng bắt đầu từ khi nào, có kèm sốt/khó thở/đau ngực/yếu liệt không?',
    ].join('\n');
  }

  async analyzeSymptoms(params: {
    description: string;
    severity: number;
    bodyPart?: string;
    recentVitalsSummary: string;
    vitals?: VitalSnapshot[];
  }): Promise<AnalysisResult> {
    const rule = assessTriage(
      params.description,
      params.severity,
      params.bodyPart,
      params.vitals,
    );
    const ragQuery = [params.description, params.bodyPart, `mức ${params.severity}`]
      .filter(Boolean)
      .join(' ');
    const knowledge = await this.rag.retrieveRelevantKnowledge(ragQuery, 5);
    const fallback: AnalysisResult = {
      analysis: rule.analysis,
      suggestedSpecialty: rule.specialty,
      urgencyLevel: rule.urgency,
      differentials: rule.differentials,
      redFlags: rule.redFlags,
    };
    const provider = this.config.get<string>('AI_PROVIDER', 'ollama');

    if (provider === 'mock') {
      return fallback;
    }

    if (provider === 'ollama' && !this.localLlm.isSaturated()) {
      const result = await this.analyzeWithOllama(params, knowledge, fallback, rule.matchedRules);
      if (result) return result;
    }

    return fallback;
  }

  private toResult(
    merged: ReturnType<typeof mergeAssessments>,
  ): AnalysisResult {
    return {
      analysis: merged.analysis,
      suggestedSpecialty: merged.specialty,
      urgencyLevel: merged.urgency,
      differentials: merged.differentials,
      redFlags: merged.redFlags,
    };
  }

  private parseAnalysisResponse(content: string, fallback: AnalysisResult): AnalysisResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content) as AnalysisResult;
      const merged = mergeAssessments(
        {
          urgency: fallback.urgencyLevel,
          specialty: fallback.suggestedSpecialty,
          redFlags: fallback.redFlags ?? [],
          differentials: fallback.differentials ?? [],
          action:
            fallback.urgencyLevel === 'HIGH'
              ? 'Cần được nhân viên y tế đánh giá ngay. Gọi 115 nếu dấu hiệu cấp cứu.'
              : fallback.urgencyLevel === 'MEDIUM'
                ? 'Nên khám trong 24–72 giờ nếu không đỡ.'
                : 'Theo dõi tại nhà, ghi chép triệu chứng, khám nếu nặng hơn.',
          analysis: fallback.analysis,
          matchedRules: [],
        },
        parsed,
      );
      return this.toResult(merged);
    } catch {
      return fallback;
    }
  }

  private async analyzeWithOllama(
    params: {
      description: string;
      severity: number;
      bodyPart?: string;
      recentVitalsSummary: string;
    },
    knowledge: string[],
    fallback: AnalysisResult,
    matchedRules: string[],
  ): Promise<AnalysisResult | null> {
    const prompt = this.rag.buildAnalysisPrompt(
      params.description,
      params.severity,
      params.bodyPart,
      params.recentVitalsSummary,
      knowledge,
      {
        urgency: fallback.urgencyLevel,
        specialty: fallback.suggestedSpecialty,
        redFlags: fallback.redFlags ?? [],
        differentials: fallback.differentials ?? [],
        matchedRules,
      },
    );

    const content = await this.localLlm.chatCompletion({
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      jsonMode: true,
      maxTokens: 350,
    });

    if (content) {
      return this.parseAnalysisResponse(content, fallback);
    }
    return null;
  }

  async chat(params: {
    message: string;
    history: { role: string; content: string }[];
    vitalsSummary: string;
    profileContext?: string;
    vitals?: VitalSnapshot[];
  }): Promise<string> {
    const provider = this.config.get<string>('AI_PROVIDER', 'ollama');
    const triage = assessTriage(params.message, 5, undefined, params.vitals);
    const knowledge = await this.rag.retrieveRelevantKnowledge(
      `${params.message} ${triage.specialty}`,
      3,
    );
    const knowledgeBlock = knowledge.length
      ? `\nKiến thức nội bộ (ưu tiên khi khớp):\n- ${knowledge.join('\n- ')}`
      : '';
    const profileBlock = params.profileContext
      ? `\nHồ sơ người dùng: ${params.profileContext}.`
      : '';
    const triageBlock =
      triage.urgency === 'HIGH'
        ? `\n\nBẮT BUỘC: Sàng lọc nội bộ = HIGH (${triage.redFlags.join('; ') || triage.matchedRules.join(', ')}). Phải khuyên gọi 115 / đến viện ngay. KHÔNG hướng dẫn theo dõi tại nhà. KHÔNG hạ thấp mức độ.`
        : triage.urgency === 'MEDIUM'
          ? `\n\nSàng lọc nội bộ = MEDIUM. Khuyên khám trong 24–72 giờ nếu không đỡ. Không tối giản hóa.`
          : '';
    const memoryBlock = params.history.length
      ? `\nNgữ cảnh hội thoại gần đây (ưu tiên duy trì mạch trao đổi, không lặp lại máy móc):\n${params.history
          .slice(-8)
          .map((m) => `- ${m.role === 'user' ? 'Người dùng' : 'HealthGuard AI'}: ${m.content.replace(/\s+/g, ' ').trim().slice(0, 240)}`)
          .join('\n')}`
      : '';
    const responseFormatBlock =
      '\n\nBẮT BUỘC VỀ CẤU TRÚC TRẢ LỜI:\n- Dùng các nhãn ngắn: "Nhận định", "Khả năng nhiều nhất", "Cần làm ngay", "Khi nào đi cấp cứu / đi khám".\n- Nếu chưa đủ dữ liệu, trong mục "Khả năng nhiều nhất" phải nói rõ chưa thể kết luận và nêu 1-2 khả năng phù hợp nhất.\n- Nếu có dấu hiệu đỏ, mục "Khi nào đi cấp cứu / đi khám" phải ghi rõ "Gọi 115 ngay" hoặc "Đến cấp cứu ngay".\n- Không viết đoạn mở đầu xã giao.';
    const systemPrompt = `${MEDICAL_SYSTEM_PROMPT}

Chỉ số gần đây: ${params.vitalsSummary || 'Chưa có'}.${profileBlock}${knowledgeBlock}${triageBlock}${memoryBlock}${responseFormatBlock}`;

    const followUpQuestions =
      triage.urgency === 'HIGH'
        ? 'Bạn có đang gặp thêm một trong các dấu hiệu đỏ sau không: đau ngực kiểu tim lan tay/hàm, khó thở tăng nhanh, yếu liệt/nói khó, nổi mẩn/phù, hoặc ngất? (Nếu có, gọi 115 ngay.)'
        : 'Mình cần làm rõ 2 ý: bắt đầu từ khi nào, và hiện có kèm sốt/khó thở/đau ngực không?';

    const mockHigh = this.normalizeChatReply(this.buildChatFallback(triage, params.message), true);
    const mockOther = this.normalizeChatReply(this.buildChatFallback(triage, params.message), true);

    const mockReplies = [mockHigh, mockOther];

    if (provider === 'mock') {
      return triage.urgency === 'HIGH' ? mockReplies[0] : mockReplies[1];
    }

    if (provider === 'ollama') {
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...params.history.slice(-4).map((m) => ({
          role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: params.message },
      ];

      const reply = await this.localLlm.chatCompletion({
        messages,
        temperature: triage.urgency === 'HIGH' ? 0.1 : 0.25,
        maxTokens: 380,
        timeoutMs: 120_000,
      });

      if (reply) {
        return this.normalizeChatReply(reply, true);
      }
    }

    return triage.urgency === 'HIGH' ? mockReplies[0] : mockReplies[1];
  }

  async generateWeeklyInsight(params: {
    userName: string;
    summary: { symptomCount: number; vitalCount: number; analysisCount: number; topSymptoms: string[]; avgSeverity: string };
    vitals: { type: string; value: number; valueSecondary: number | null; unit: string }[];
    analyses: { inputSummary: string; urgencyLevel: string }[];
  }): Promise<string> {
    const dataText = JSON.stringify(params.summary, null, 2);
    const provider = this.config.get<string>('AI_PROVIDER', 'ollama');

    const mockInsight = `${params.userName} ơi, tuần qua bạn đã ghi ${params.summary.symptomCount} triệu chứng và ${params.summary.vitalCount} chỉ số. Mức độ triệu chứng trung bình ${params.summary.avgSeverity}/10. Hãy duy trì thói quen theo dõi sức khỏe đều đặn!`;

    if (provider === 'mock') {
      return mockInsight;
    }

    if (provider === 'ollama' && !this.localLlm.isSaturated()) {
      const prompt = `Bạn là HealthGuard AI. Viết tóm tắt sức khỏe 7 ngày (3–5 câu, tiếng Việt) cho ${params.userName}.
Dữ liệu: ${dataText}
Phân tích gần đây: ${params.analyses.map((a) => `${a.inputSummary} (${a.urgencyLevel})`).join('; ') || 'không có'}
Nêu xu hướng (tốt/cần chú ý), 1 việc nên làm tuần tới. Không chẩn đoán. Kết: ${MEDICAL_DISCLAIMER}`;

      const reply = await this.localLlm.chatCompletion({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        maxTokens: 220,
        timeoutMs: 12_000,
      });

      if (reply) return reply;
    }

    return mockInsight;
  }
}
