export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
  },
  ai: {
    provider: process.env.AI_PROVIDER ?? 'ollama',
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
    ollamaModel: process.env.OLLAMA_MODEL ?? 'qwen2.5:7b-instruct',
    ollamaModelCandidates:
      process.env.OLLAMA_MODEL_CANDIDATES ??
      'qwen2.5:7b-instruct',
    ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text',
    ollamaTimeoutMs: process.env.OLLAMA_TIMEOUT_MS ?? '60000',
  },
});
