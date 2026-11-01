# HealthGuard Desktop

Electron desktop shell cho HealthGuard, dùng lại giao diện `frontend/` và cùng backend API với web.

## Ý tưởng triển khai

- `desktop/` chỉ mở `FRONTEND_URL` trong Electron `BrowserWindow`
- Toàn bộ nghiệp vụ, RTK Query, auth state và gọi API vẫn nằm ở `frontend/`
- Backend duy nhất vẫn là `backend/` tại base `/api`

## Chạy local

Mở 3 terminal:

```bash
# Terminal 1
cd backend
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:setup
npm run dev
```

```bash
# Terminal 2
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

```bash
# Terminal 3
cd desktop
npm install
cp .env.example .env
npm run dev
```

## Biến môi trường

`.env`

```env
FRONTEND_URL=http://localhost:3000
```

Nếu muốn app desktop mở bản web production, trỏ `FRONTEND_URL` tới URL deploy của frontend.

## Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy Electron app local |
| `npm run start` | Chạy app giống `dev` |
| `npm run build` | Đóng gói app desktop |
| `npm run pack` | Build thư mục unpacked |

## Dùng chung API

- Web và app PC cùng dùng `frontend/src/store/api/baseApi.ts`
- Cả hai đều gọi backend tại `http://localhost:3001/api` khi chạy local

## Ghi chú

- Nếu web chưa chạy, app hiện trang hướng dẫn thử lại thay vì cửa sổ trống
- Tray chỉ được bật khi có file `assets/icon.png`
