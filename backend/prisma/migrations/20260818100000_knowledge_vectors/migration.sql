-- Enable pgvector for semantic RAG
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  embedding vector(768),
  created_at TIMESTAMP DEFAULT NOW()
);
