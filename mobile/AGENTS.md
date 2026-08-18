# HealthGuard Mobile — Agent Guidelines

Before making changes, read `lib/api.ts`, AuthContext, and types. Mobile shares the same backend API as web.

## Stack (actual)

- Expo 51, Expo Router, React Native 0.74
- TypeScript strict
- fetch API via `lib/api.ts` + AsyncStorage for JWT

## Project layout

```
mobile/
├── app/              # Expo Router screens (tabs, login)
├── context/          # AuthContext
├── lib/              # api.ts, theme.ts
└── src/types/        # Local types (mirror API contracts)
```

## Mandatory rules

- **`EXPO_PUBLIC_API_URL` only** — points to backend `/api` base
- **No secrets in code** — JWT comes from login response, stored in AsyncStorage
- **Physical device:** use LAN IP, e.g. `http://192.168.1.x:3001/api` (not localhost)
- **Same demo account as web** for data sync: `demo@healthguard.vn` / `Demo@123`
- Loading/error feedback on all API calls

## API connection

- Local emulator: `http://localhost:3001/api` (Android emulator may need `10.0.2.2`)
- iOS simulator: `http://localhost:3001/api`
- Physical phone: `http://<PC-LAN-IP>:3001/api`

Native apps do not use browser CORS; ensure backend is reachable on network.

## Commands

```bash
npm install
cp .env.example .env
npm start
```

## Roadmap (not required now)

- expo-secure-store for tokens, React Query, offline cache

## Do not

- Import `@healthguard/shared` or monorepo packages
- Hardcode API URLs in components
