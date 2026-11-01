# HealthGuard Backend



API NestJS độc lập — deploy riêng trên Railway/Docker. AI chạy local qua Ollama, không cần API key ngoài.



## Chạy nhanh



```bash

cd backend

npm install

cp .env.example .env

docker compose up -d postgres ollama

npm run db:setup

npm run dev            # http://localhost:3001

```



Lần đầu pull model (cần internet 1 lần):



```bash

# Từ thư mục gốc repo

npm run dev:ollama

```



Swagger: http://localhost:3001/api/docs



## Scripts



| Lệnh | Mô tả |

|------|-------|

| `npm run dev` | Chạy development (hot reload) |

| `npm run build` | Build production |

| `npm run start` | Chạy bản build |

| `npm run db:setup` | Migrate + seed database |

| `npm run test:e2e` | E2E tests (auth, symptoms, vitals, alerts, ai, ...) |



## Docker Compose



```bash

docker compose up -d    # postgres + ollama + api

```



Services:

- **postgres** — PostgreSQL 16 + pgvector

- **ollama** — LLM local (port 11434)

- **api** — NestJS backend (port 3001)



## Biến môi trường (`.env`)



| Biến | Bắt buộc | Ghi chú |

|------|----------|---------|

| `DATABASE_URL` | ✅ | PostgreSQL connection string |

| `JWT_SECRET` | ✅ | ≥32 ký tự, **không commit** |

| `AI_PROVIDER` | ✅ | `ollama` (mặc định) hoặc `mock` (offline rule-based) |

| `OLLAMA_BASE_URL` | ✅ | `http://localhost:11434/v1` |

| `OLLAMA_MODEL` | ✅ | `qwen2.5:3b-instruct` |

| `OLLAMA_EMBED_MODEL` | ⚠️ | `nomic-embed-text` cho RAG vector |

| `CORS_ORIGIN` | ✅ | URL frontend |



## AI Architecture



- **LocalLlmService** — gọi Ollama OpenAI-compatible API

- **RagService** — pgvector semantic search + keyword fallback

- **Mock fallback** — rule-based khi Ollama down (`AI_PROVIDER=mock`)



## Deploy



- **Railway/VPS:** backend + PostgreSQL; Ollama trên cùng VPS hoặc GPU server riêng

- Health check: `GET /api/health` (includes Ollama status)



## Demo



- Email: `demo@healthguard.vn`

- Password: `Demo@123`

