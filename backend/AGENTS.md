# HealthGuard Backend — Agent Guidelines

Before making changes, read related modules, DTOs, and Prisma schema. Preserve security and module boundaries.

## Stack (actual)

- NestJS 11, TypeScript, Prisma 6, PostgreSQL
- JWT auth (bcrypt password hashing)
- class-validator DTOs, Swagger at `/api/docs`
- Helmet, Throttler (rate limit), global exception filter
- Ollama local LLM (offline-first, no external API keys)

## Project layout

```
backend/
├── src/
│   ├── main.ts           # Bootstrap, CORS, Swagger, Helmet
│   ├── app.module.ts
│   ├── config/           # Env validation
│   ├── common/           # Guards, filters, decorators, constants
│   ├── modules/health/   # GET /api/health
│   ├── auth/             # Login, register, JWT
│   ├── users/ symptoms/ vitals/ ai/ alerts/ dashboard/ medications/
│   └── prisma/
├── prisma/
├── docker-compose.yml    # PostgreSQL + Ollama + API
└── Dockerfile            # Production (Railway)
```

## Mandatory rules

- **Secrets only in `.env`:** `DATABASE_URL`, `JWT_SECRET` — never commit
- **AI local:** `AI_PROVIDER=ollama`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL` — no Gemini/OpenAI keys required
- **CORS:** whitelist via `CORS_ORIGIN` (comma-separated: web + Expo dev URLs)
- **Every endpoint:** DTO + ValidationPipe, JwtAuthGuard where needed
- **No business logic in controllers** — use services
- **Production:** no stack traces in responses; `NODE_ENV=production` enables env validation

## Security

- Input validation on all POST/PATCH bodies
- JWT Bearer on protected routes
- Rate limiting via ThrottlerModule
- OWASP awareness: SQL injection prevented by Prisma; validate all user input
- `JWT_SECRET` ≥ 32 characters in production

## Commands

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:setup
npm run dev          # http://localhost:3001
```

## Roadmap (not required now)

- RBAC roles, Argon2, Redis cache, BullMQ jobs, audit logging

## Clients

- **Web:** `frontend/` → `NEXT_PUBLIC_API_URL`
- **Mobile:** `mobile/` → `EXPO_PUBLIC_API_URL`

Both must use the same API base (`/api`) and demo account for sync.
