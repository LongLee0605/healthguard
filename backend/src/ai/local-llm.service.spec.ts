import { ConfigService } from '@nestjs/config';
import { LocalLlmService } from './local-llm.service';

describe('LocalLlmService', () => {
  const config = {
    get: (key: string, defaultValue?: string) => {
      const map: Record<string, string> = {
        OLLAMA_BASE_URL: 'http://localhost:11434/v1',
        OLLAMA_MODEL: 'qwen2.5:7b-instruct',
        OLLAMA_MODEL_CANDIDATES: 'qwen2.5:7b-instruct',
        OLLAMA_TIMEOUT_MS: '5000',
      };
      return map[key] ?? defaultValue;
    },
  } as ConfigService;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('isAvailable returns false when Ollama is down', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('connection refused'));
    const service = new LocalLlmService(config);
    await expect(service.isAvailable()).resolves.toBe(false);
  });

  it('chatCompletion returns null on failure (mock fallback path)', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'unavailable',
    } as Response);

    const service = new LocalLlmService(config);
    const result = await service.chatCompletion({
      messages: [{ role: 'user', content: 'test' }],
    });
    expect(result).toBeNull();
  });

  it('chatCompletion parses successful response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"analysis":"ok"}' } }],
      }),
    } as Response);

    const service = new LocalLlmService(config);
    const result = await service.chatCompletion({
      messages: [{ role: 'user', content: 'test' }],
    });
    expect(result).toBe('{"analysis":"ok"}');
  });

  it('uses the configured single model', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [{ name: 'qwen2.5:7b-instruct' }],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'ok' } }],
        }),
      } as Response);

    const service = new LocalLlmService(config);
    await service.chatCompletion({
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(global.fetch).toHaveBeenLastCalledWith(
      'http://localhost:11434/v1/chat/completions',
      expect.objectContaining({
        body: expect.stringContaining('"model":"qwen2.5:7b-instruct"'),
      }),
    );
  });

  it('rejects extra concurrent LLM calls immediately', async () => {
    let started = 0;
    jest.spyOn(global, 'fetch').mockImplementation(
      (input: string | URL | Request) => {
        const url = input.toString();
        if (url.endsWith('/api/tags')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ models: [{ name: 'qwen2.5:7b-instruct' }] }),
          } as Response);
        }

        return new Promise((resolve) => {
          started += 1;
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
            } as Response);
          }, 40);
        });
      },
    );

    const service = new LocalLlmService(config);
    const [a, b] = await Promise.all([
      service.chatCompletion({ messages: [{ role: 'user', content: '1' }] }),
      service.chatCompletion({ messages: [{ role: 'user', content: '2' }] }),
    ]);

    expect([a, b].filter(Boolean)).toHaveLength(1);
    expect(started).toBe(1);
  });
});
