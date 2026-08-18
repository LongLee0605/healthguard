# QA Checklist — HealthGuard

Ma trận kiểm thử thủ công trước khi demo / nộp đồ án.

## Môi trường

| Platform | URL / Cách chạy | Ghi chú |
|----------|-----------------|---------|
| Web | http://localhost:3000 | Chrome desktop + mobile emulation |
| PWA | Cài từ Chrome → "Cài đặt HealthGuard" | Kiểm tra offline.html khi mất mạng |
| Desktop | `cd desktop && npm run dev` | Cần frontend đang chạy |
| Mobile | Expo Go + thiết bị thật | `EXPO_PUBLIC_API_URL=http://<IP>:3001/api` |
| API | http://localhost:3001/api | PostgreSQL + migrate + seed |

## Auth

- [ ] Đăng nhập demo `demo@healthguard.vn` / `Demo@123`
- [ ] Đăng ký tài khoản mới
- [ ] Đăng xuất và bảo vệ route dashboard
- [ ] Cùng account đồng bộ dữ liệu web ↔ mobile ↔ desktop

## Cảnh báo & Thông báo

- [ ] Nhập huyết áp cao (150/95) → alert `VITAL_ANOMALY` severity HIGH
- [ ] Phân tích AI triệu chứng nghiêm trọng → alert HIGH (nếu AI trả HIGH)
- [ ] Thêm thuốc lịch `HH:mm` → đợi cron backend → alert `MEDICATION`
- [ ] Web: Bật thông báo trong Hồ sơ → Thử thông báo → browser notification
- [ ] Web: Alert mới (MEDIUM+) → notification popup khi tab active
- [ ] Desktop: Tray tooltip hiện số cảnh báo chưa đọc
- [ ] Desktop: Native notification khi có alert mới
- [ ] Mobile: Cấp quyền notification → poll alert → local notification
- [ ] Mobile: Scheduled notification nhắc thuốc (thiết bị thật)

## PWA

- [ ] Manifest load (`/manifest.json`)
- [ ] Service worker đăng ký (`/sw.js`)
- [ ] Banner "Cài đặt HealthGuard" trên mobile web
- [ ] Offline: tắt mạng → hiện trang offline

## CRUD cơ bản

- [ ] Triệu chứng: thêm, sửa, xóa (web + mobile)
- [ ] Chỉ số: thêm, biểu đồ 7/30/90 ngày, xóa
- [ ] Thuốc: thêm với time picker HH:mm, tạm dừng, xóa
- [ ] Chat AI: gửi tin, xóa lịch sử
- [ ] Báo cáo: in / xuất PDF

## Automated tests

```bash
cd backend
npm run test:e2e
```

Kỳ vọng: 23 tests passed (auth, symptoms, vitals, alerts, medications).

## Known limitations

- Electron trên Windows path Unicode: dùng `subst X:` nếu binary lỗi
- Expo notification trên emulator có thể không đầy đủ — test trên thiết bị thật
- Push server-side (FCM/Web Push VAPID) không nằm trong phạm vi — dùng polling + local notification

## Demo script (5 phút)

1. **Login** demo account → Dashboard tổng quan
2. **Vitals** → nhập HA 150/95 → Cảnh báo xuất hiện + notification
3. **AI** → phân tích triệu chứng → xem urgency badge
4. **Medications** → thêm Paracetamol 08:00 → giải thích cron nhắc thuốc
5. **PWA/Desktop** → cài app / mở Electron → bật notification trong Hồ sơ
6. **Mobile** (nếu có) → cùng account, pull-to-refresh alerts
