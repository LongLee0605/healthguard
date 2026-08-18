# HealthGuard Frontend (Web PC) — Agent Guidelines

Before making changes, read related features, RTK Query endpoints, and types. Keep pages thin.

## Stack (actual)

- Next.js 15 App Router, React 19, TypeScript strict
- Redux Toolkit + RTK Query for server state and API cache
- Tailwind CSS 4, custom UI components
- Recharts for vital charts

## Project layout

```
frontend/src/
├── app/              # Routes only — thin pages
├── components/       # UI, layout (Sidebar, MobileBottomNav)
├── features/         # auth/, ui/ hooks
├── store/
│   ├── api/baseApi.ts   # All RTK Query endpoints
│   └── slices/          # authSlice, uiSlice
├── types/            # Local TypeScript types (mirror API contracts)
└── context/          # ToastContext only (ephemeral UI)
```

## Mandatory rules

- **Only `NEXT_PUBLIC_*` in client env** — never JWT secret or AI keys
- **Server data:** RTK Query hooks from `store/api/baseApi.ts`
- **Auth session:** `authSlice` + `prepareHeaders` Bearer token
- **Pages:** import from `features/` and RTK hooks, not raw `fetch`
- **Security headers** configured in `next.config.js` — do not remove

## API connection

- `NEXT_PUBLIC_API_URL=http://localhost:3001/api` (local)
- Production: Vercel env pointing to Railway backend URL
- Same JWT session as mobile when using same demo/login account

## UI standards

- Loading, error, and empty states on data views
- Responsive: mobile bottom nav + desktop sidebar
- Accessible labels on interactive controls
- Dark mode via `uiSlice` + `ThemeInitializer`

## Commands

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
npm run build
```

## Roadmap (not required now)

- React Query migration, shadcn/ui, Server Components for static shells

## Do not

- Import from `@healthguard/shared` or monorepo packages
- Put secrets in `.env.local`
- Duplicate API logic outside RTK Query
