# Kiến trúc HealthGuard



## Tổng quan (3 client + 1 API + AI local)



```

healthguard/

├── backend/     NestJS 11 + Prisma 6 + PostgreSQL + Ollama

├── frontend/    Next.js 15 + Redux Toolkit + RTK Query

├── desktop/     Electron shell

├── mobile/      Expo React Native

├── ml/          Fine-tune pipeline (LoRA → Ollama)

└── docs/        Tài liệu đồ án

```



```mermaid

flowchart LR

  Web[frontend Web PC]

  Mobile[mobile Expo]

  Desktop[desktop Electron]

  BE[backend API]

  PG[(PostgreSQL pgvector)]

  Ollama[Ollama LLM local]

  Web --> BE

  Mobile --> BE

  Desktop --> BE

  BE --> PG

  BE -->|"OpenAI-compatible API"| Ollama

```



Mỗi client **standalone** — `npm install && npm run dev` riêng, cùng trỏ API.



## Backend



```

backend/src/

├── main.ts              Swagger, Helmet, CORS, global pipes/filters

├── config/              Env validation

├── common/              Guards, filters, constants

├── modules/health/      GET /api/health (+ Ollama status)

├── ai/

│   ├── local-llm.service.ts   Ollama client

│   ├── rag.service.ts         pgvector + keyword RAG

│   └── ai.service.ts          analyze / chat / insight

├── auth/ users/ symptoms/ vitals/ alerts/ dashboard/ medications/

└── prisma/

```



- Swagger: `/api/docs`

- Docker: `backend/docker-compose.yml` (postgres + ollama + api)



## AI Stack (offline-first)



| Component | Technology |

|-----------|------------|

| LLM inference | Ollama (`qwen2.5:3b-instruct`) |

| Embeddings | Ollama (`nomic-embed-text`) |

| Vector store | pgvector on PostgreSQL |

| Fallback | Rule-based mock (no external deps) |



Không cần `GEMINI_API_KEY` hay `OPENAI_API_KEY`.



## Frontend (Web PC)



```

frontend/src/

├── app/                 App Router

├── store/api/baseApi.ts RTK Query — all endpoints

└── types/

```



Frontend không gọi AI trực tiếp — mọi request qua `/api/ai/*`.



## Mobile



```

mobile/

├── app/                 Expo Router tabs

├── lib/api.ts           fetch + JWT header

```



## Kết nối giữa các app



| Client | Env var | Local value |

|--------|---------|-------------|

| Web | `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` |

| Mobile | `EXPO_PUBLIC_API_URL` | `http://localhost:3001/api` |

| Backend | `OLLAMA_BASE_URL` | `http://localhost:11434/v1` |

| Backend | `CORS_ORIGIN` | `http://localhost:3000,http://localhost:8081` |



## ML / Fine-tune (tương lai production)



```

ml/

├── export_dataset.py    PostgreSQL → JSONL

├── train_lora.py        LoRA fine-tune

└── Modelfile            Import vào Ollama

```



## Deploy



| App | Platform | Ghi chú |

|-----|----------|---------|

| Backend + DB | Railway / VPS | |

| Ollama | Cùng VPS hoặc GPU server | Đổi `OLLAMA_BASE_URL` |

| Frontend | Vercel | |

| Mobile | EAS / Expo | |



Chi tiết: [DEPLOY.md](./DEPLOY.md)



## Agent guidelines



- [backend/AGENTS.md](../backend/AGENTS.md)

- [frontend/AGENTS.md](../frontend/AGENTS.md)

- [mobile/AGENTS.md](../mobile/AGENTS.md)

