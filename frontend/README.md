# HealthGuard Frontend

Next.js dashboard độc lập — deploy riêng trên Vercel.

## Chạy nhanh

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

## Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Development server |
| `npm run build` | Build production |
| `npm run start` | Chạy bản build |

## Biến môi trường (`.env.local`)

| Biến | Bắt buộc | Ghi chú |
|------|----------|---------|
| `NEXT_PUBLIC_API_URL` | ✅ | URL API backend (vd: `http://localhost:3001/api`) |

> Chỉ dùng prefix `NEXT_PUBLIC_` — các biến này **công khai** trên browser.  
> **Không** đặt JWT secret, API key AI, hay database URL ở đây.

## Deploy Vercel

- Root directory: `frontend`
- Framework: Next.js (auto-detect)
- Env: `NEXT_PUBLIC_API_URL=https://your-api.railway.app/api`

## Demo

- Email: `demo@healthguard.vn`
- Password: `Demo@123`
