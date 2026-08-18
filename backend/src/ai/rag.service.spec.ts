import { RagService } from './rag.service';

describe('RagService (offline keyword fallback)', () => {
  const rag = Object.create(RagService.prototype) as RagService;

  beforeEach(() => {
    Object.assign(rag, {
      vectorReady: false,
      prisma: {},
      localLlm: { embed: jest.fn() },
    });
  });

  it('retrieveByKeywords matches headache', () => {
    const results = rag.retrieveByKeywords('tôi bị đau đầu và nhức đầu', 2);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toMatch(/đau đầu/i);
  });

  it('parseMockAnalysis returns HIGH for chest pain severity 8', () => {
    const result = rag.parseMockAnalysis('đau ngực dữ dội', 8);
    expect(result.urgencyLevel).toBe('HIGH');
    expect(result.suggestedSpecialty).toMatch(/Tim mạch/);
  });

  it('buildAnalysisPrompt includes symptom text', () => {
    const prompt = rag.buildAnalysisPrompt('sốt', 6, 'toàn thân', 'Huyết áp: 120/80', ['kiến thức test']);
    expect(prompt).toContain('sốt');
    expect(prompt).toContain('kiến thức test');
  });
});
