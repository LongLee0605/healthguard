# Báo cáo Đồ án Tốt nghiệp — HealthGuard

## Thông tin đề tài

- **Tên đề tài:** Xây dựng hệ thống quản lý sức khỏe cá nhân tích hợp trí tuệ nhân tạo (HealthGuard)
- **Ngành:** Công nghệ Thông tin
- **Loại hình:** Web Dashboard + Mobile App + AI Module

---

## Chương 1: Giới thiệu

### 1.1. Lý do chọn đề tài

Sức khỏe cá nhân là vấn đề được quan tâm hàng đầu, đặc biệt sau đại dịch COVID-19. Người dùng cần công cụ theo dõi triệu chứng, chỉ số sinh hiệu và nhận gợi ý sơ bộ trước khi đến cơ sở y tế. Sự phát triển của LLM (Large Language Model) mở ra khả năng tích hợp AI vào ứng dụng y tế cá nhân một cách thực tế.

### 1.2. Mục tiêu

1. Xây dựng ứng dụng mobile cho phép ghi nhận triệu chứng và chỉ số sinh hiệu
2. Xây dựng web dashboard hiển thị biểu đồ xu hướng sức khỏe
3. Tích hợp AI phân tích triệu chứng với RAG (Retrieval-Augmented Generation)
4. Hệ thống cảnh báo tự động khi phát hiện chỉ số bất thường

### 1.3. Phạm vi

- **Trong phạm vi:** Auth, CRUD sức khỏe, AI phân tích, dashboard, cảnh báo
- **Ngoài phạm vi:** Chẩn đoán y khoa chính thức, tích hợp thiết bị IoT, telemedicine video call

### 1.4. Disclaimer

> Hệ thống chỉ mang tính tham khảo, **không thay thế tư vấn y khoa chuyên nghiệp**.

---

## Chương 2: Cơ sở lý thuyết

### 2.1. Kiến trúc hệ thống

Hệ thống theo mô hình Client-Server 3 tầng:

1. **Presentation Layer:** React Native (Mobile), Next.js (Web Dashboard/PWA)
2. **Business Layer:** NestJS REST API
3. **Data Layer:** PostgreSQL + Prisma ORM

### 2.1.1. Kiến trúc deploy production

```
Vercel (Next.js) ──► Railway (NestJS Docker) ──► PostgreSQL
```

Chi tiết: [ARCHITECTURE.md](./ARCHITECTURE.md), [DEPLOY.md](./DEPLOY.md)

### 2.2. Trí tuệ nhân tạo trong y tế

- **LLM (Large Language Model):** GPT-4o-mini qua OpenAI API — phân tích ngôn ngữ tự nhiên triệu chứng
- **RAG (Retrieval-Augmented Generation):** Truy xuất kiến thức y khoa từ knowledge base nội bộ trước khi gửi prompt tới LLM, giảm hallucination
- **Rule-based anomaly detection:** Kiểm tra ngưỡng huyết áp, đường huyết theo tiêu chuẩn y khoa

### 2.3. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Backend | NestJS 11, TypeScript, Prisma 6, Swagger |
| Database | PostgreSQL (Docker local + Railway prod) |
| Web | Next.js 15, React 19, Tailwind CSS 4, Redux Toolkit, RTK Query, Recharts |
| Mobile | React Native, Expo |
| AI | Google Gemini API, RAG pipeline |
| Auth | JWT Bearer Token |
| Deploy | Vercel (Web) + Railway (API) + Expo (Mobile) + GitHub Actions CI |
| Cấu trúc | 3 project độc lập: `backend/`, `frontend/`, `mobile/` |

---

## Chương 3: Phân tích và thiết kế hệ thống

### 3.1. Use Case chính

Xem chi tiết tại [use-cases.md](./use-cases.md)

### 3.2. Database Schema

Xem chi tiết tại [schema.md](./schema.md)

### 3.3. API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/auth/register | Đăng ký |
| POST | /api/auth/login | Đăng nhập |
| GET | /api/users/me | Thông tin user |
| POST | /api/symptoms | Ghi triệu chứng |
| GET | /api/symptoms | Lịch sử triệu chứng |
| POST | /api/vitals | Ghi chỉ số |
| GET | /api/vitals/chart | Dữ liệu biểu đồ |
| POST | /api/ai/analyze | Phân tích AI |
| GET | /api/ai/history | Lịch sử phân tích |
| GET | /api/alerts | Danh sách cảnh báo |
| GET | /api/dashboard/stats | Thống kê dashboard |
| GET | /api/health | Health check (deploy probe) |
| GET | /api/docs | Swagger UI |

---

## Chương 4: Cài đặt và tích hợp AI

### 4.1. RAG Pipeline

```
Triệu chứng → Keyword matching → Knowledge retrieval → Prompt building → LLM → JSON response
```

Knowledge base chứa 7 tài liệu y khoa về: đau đầu, đau ngực, sốt, huyết áp, đường huyết, đau bụng, chuyên khoa.

### 4.2. Anomaly Detection

Rule-based kiểm tra khi lưu chỉ số:
- Huyết áp: ≥140/90 (cao), <90/60 (thấp)
- Đường huyết: ≥126 (cao), <70 (thấp)

### 4.3. Mock AI Mode

Khi không có API key, hệ thống dùng mock AI với logic keyword matching — phù hợp demo và kiểm thử offline.

---

## Chương 5: Kiểm thử

### 5.1. Kịch bản kiểm thử

| # | Kịch bản | Kết quả mong đợi |
|---|----------|------------------|
| 1 | Đăng ký tài khoản mới | Tạo user, trả JWT |
| 2 | Đăng nhập demo account | Truy cập dashboard |
| 3 | Nhập triệu chứng "đau đầu" | Lưu thành công |
| 4 | Phân tích AI triệu chứng | Trả analysis + urgency + specialty |
| 5 | Nhập huyết áp 150/95 | Tạo cảnh báo tự động |
| 6 | Xem biểu đồ dashboard | Hiển thị chart 30 ngày |
| 7 | Mobile app sync data | Dữ liệu đồng bộ với web |

### 5.2. Tài khoản demo

- Email: `demo@healthguard.vn`
- Password: `Demo@123`

---

## Chương 6: Kết luận

### 6.1. Kết quả đạt được

- Hoàn thiện hệ thống 3 thành phần: Mobile + Web Dashboard + Backend API
- Tích hợp AI phân tích triệu chứng với RAG pipeline
- Hệ thống cảnh báo tự động cho chỉ số bất thường
- Demo end-to-end với dữ liệu mẫu
- Cấu trúc 3 app độc lập: backend, frontend (web PC), mobile — cùng kết nối 1 API
- Redux Toolkit + RTK Query cho quản lý state và cache API
- Deploy-ready: Docker backend, Vercel + Railway, CI/CD GitHub Actions

### 6.2. Hạn chế

- AI chưa được đánh giá lâm sàng
- Chưa tích hợp thiết bị đo tự động (smartwatch, máy đo HA)
- Knowledge base RAG còn nhỏ

### 6.3. Hướng phát triển

- Thêm tính năng nhắc uống thuốc (MediRemind module) — đã có module Medications
- Mở rộng knowledge base với tài liệu y khoa chính thống
- Tích hợp wearable devices qua HealthKit/Google Fit

---

## Hướng dẫn Demo

### Chuẩn bị

```bash
cd backend && npm install && cp .env.example .env
docker compose up -d postgres && npm run db:setup

cd frontend && npm install && cp .env.example .env.local
cd mobile && npm install && cp .env.example .env
```

### Chạy demo

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Web PC
cd frontend && npm run dev

# Terminal 3 — Mobile
cd mobile && npm start
```

### Kịch bản demo (5 phút)

1. Mở http://localhost:3000 → Đăng nhập demo account
2. Dashboard → Xem biểu đồ huyết áp, cân nặng
3. Triệu chứng → Nhập "Đau ngực, khó thở" mức 8
4. Phân tích AI → Nhận kết quả HIGH urgency, gợi ý Tim mạch
5. Chỉ số → Nhập huyết áp 150/95 → Cảnh báo tự động
6. Mobile app → Đăng nhập cùng account, xem dữ liệu đồng bộ
