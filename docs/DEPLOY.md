# Hướng dẫn Deploy HealthGuard

3 app độc lập: **frontend → Vercel**, **backend → Railway**, **mobile → Expo/EAS**.

## Production

```
Vercel (frontend)  ──►  Railway (backend Docker)  ──►  PostgreSQL
Mobile (Expo)      ──►  Railway API (EXPO_PUBLIC_API_URL)
```

## Deploy Backend (Railway)

1. Railway → Deploy from GitHub
2. **Root Directory:** `backend`
3. Thêm PostgreSQL addon

| Biến | Giá trị |
|------|---------|
| `DATABASE_URL` | Từ PostgreSQL addon |
| `JWT_SECRET` | ≥32 ký tự random |
| `CORS_ORIGIN` | URL Vercel (+ Expo web nếu cần) |
| `OLLAMA_BASE_URL` | Internal Ollama URL (e.g. `http://ollama:11434/v1`) |
| `OLLAMA_MODEL` | `qwen2.5:3b-instruct` or fine-tuned model |
| `AI_PROVIDER` | `ollama` |
| `PORT` | `3001` |

Health: `GET /api/health` · Swagger: `/api/docs`

## Deploy Frontend (Vercel)

1. **Root Directory:** `frontend`
2. `NEXT_PUBLIC_API_URL=https://your-api.railway.app/api`

## Deploy Mobile (Expo)

1. **Root Directory:** `mobile`
2. `EXPO_PUBLIC_API_URL=https://your-api.railway.app/api`
3. Build: `eas build` hoặc Expo Go for demo

## Local development

```bash
# Backend
cd backend && npm install && cp .env.example .env
docker compose up -d postgres && npm run db:setup && npm run dev

# Web
cd frontend && npm install && cp .env.example .env.local && npm run dev

# Mobile
cd mobile && npm install && cp .env.example .env && npm start
```

## CI/CD

- `backend-ci.yml` — build backend
- `frontend-ci.yml` — build + lint frontend
- `mobile-ci.yml` — TypeScript check mobile

## Demo

- Email: `demo@healthguard.vn`
- Password: `Demo@123`
