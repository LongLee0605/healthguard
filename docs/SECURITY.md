# Bảo mật HealthGuard

3 client + 1 API — secrets **chỉ ở backend**.

## Phân tách secrets

| Loại | Backend `.env` | Frontend `.env.local` | Mobile `.env` |
|------|----------------|----------------------|---------------|
| Database URL | ✅ | ❌ | ❌ |
| JWT secret | ✅ | ❌ | ❌ |
| Gemini API key | ❌ removed | ❌ | ❌ |
| Ollama URL (backend only) | ✅ `OLLAMA_BASE_URL` | ❌ | ❌ |
| API public URL | ❌ | ✅ `NEXT_PUBLIC_*` | ✅ `EXPO_PUBLIC_*` |
| JWT access token | ❌ | localStorage | AsyncStorage |

## Backend

- `JWT_SECRET` ≥ 32 ký tự (production)
- `CORS_ORIGIN` whitelist: web URL + Expo dev (`http://localhost:8081`)
- Helmet, Throttler, class-validator DTOs
- Docker non-root user

## Frontend (Web PC)

- Chỉ `NEXT_PUBLIC_*` exposed to browser
- Security headers in `next.config.js`
- Không embed AI keys

## Mobile

- Chỉ `EXPO_PUBLIC_API_URL` — no secrets in bundle
- Token in AsyncStorage (roadmap: expo-secure-store)
- Physical device: HTTPS API URL in production
- Native apps bypass browser CORS; ensure API reachable on network

## Deploy checklist

- [ ] JWT_SECRET production ≥ 32 chars
- [ ] CORS_ORIGIN includes Vercel domain
- [ ] Ollama running on GPU VPS or same server as API
- [ ] `OLLAMA_BASE_URL` points to internal Ollama service (not public)
- [ ] HTTPS on Vercel + Railway
- [ ] Mobile production uses `https://` API URL

## Git

Each app has its own `.gitignore` for `.env` files. Never commit credentials.
