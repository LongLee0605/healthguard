# HealthGuard Desktop — Agent Guidelines

Before making changes, read `src/main.js`, `src/preload.js`, and the root `README.md`. Desktop is an Electron shell for the shared web UI, not a separate product.

## Stack (actual)

- Electron 33
- CommonJS entrypoints (`src/main.js`, `src/preload.js`)
- dotenv for local desktop config

## Project layout

```text
desktop/
├── src/
│   ├── main.js       # BrowserWindow lifecycle, menu, tray
│   └── preload.js    # Safe renderer bridge
├── assets/           # Optional icons
└── package.json
```

## Mandatory rules

- Reuse the existing `frontend/` UI through `FRONTEND_URL`; do not duplicate React pages here
- Reuse the same backend API already consumed by web/mobile
- Keep `nodeIntegration: false` and `contextIsolation: true`
- Expose only minimal renderer APIs from `preload.js`
- Open third-party links with `shell.openExternal`, not inside the app window

## API connection

- Desktop loads `FRONTEND_URL=http://localhost:3000` in local development
- The Next.js frontend continues using `NEXT_PUBLIC_API_URL` to reach the shared backend
- Result: web, mobile, and desktop all sync through the same `/api` backend

## Commands

```bash
cd desktop
npm install
cp .env.example .env
npm run dev
npm run build
```

## Do not

- Put backend secrets in desktop env files
- Call backend APIs directly from `main.js` unless truly required
- Rebuild auth state separately from the frontend session
