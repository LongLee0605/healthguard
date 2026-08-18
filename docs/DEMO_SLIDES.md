# Slide Demo — HealthGuard (5 phút)

## Slide 1: Giới thiệu
- **Đề tài:** HealthGuard — Hệ thống quản lý sức khỏe cá nhân tích hợp AI
- **Sinh viên:** [Tên bạn]
- **GVHD:** [Tên GVHD]

## Slide 2: Vấn đề
- Người dùng khó theo dõi triệu chứng và chỉ số sức khỏe liên tục
- Thiếu công cụ gợi ý sơ bộ trước khi đến cơ sở y tế
- Dữ liệu sức khỏe phân tán, khó phân tích xu hướng

## Slide 3: Giải pháp
- **Mobile App:** Ghi triệu chứng, chỉ số mọi lúc mọi nơi
- **Web Dashboard:** Biểu đồ xu hướng, báo cáo tổng hợp
- **AI Module:** Phân tích triệu chứng + RAG + cảnh báo tự động

## Slide 4: Kiến trúc hệ thống
```
Mobile (Expo) ──┐
Web (Next.js) ──┼──► NestJS API ──► SQLite/PostgreSQL
PWA (PC)     ──┘         │
                         └──► Ollama (AI local) + pgvector RAG
```

## Slide 5: Demo Live
1. Đăng nhập: `demo@healthguard.vn` / `Demo@123`
2. Dashboard — biểu đồ huyết áp, cân nặng
3. Nhập triệu chứng "Đau ngực, khó thở" mức 8
4. AI phân tích → HIGH urgency, gợi ý Tim mạch
5. Nhập huyết áp 150/95 → Cảnh báo tự động
6. Mobile app — dữ liệu đồng bộ

## Slide 6: Công nghệ
| Layer | Stack |
|-------|-------|
| Backend | NestJS, Prisma, JWT |
| Web | Next.js 15, Tailwind, Recharts |
| Mobile | React Native, Expo |
| AI | Ollama local (qwen2.5), RAG + pgvector |

## Slide 7: Kết quả
- ✅ 3 thành phần hoàn chỉnh (Mobile + Web + API)
- ✅ AI phân tích triệu chứng với RAG
- ✅ Cảnh báo chỉ số bất thường tự động
- ✅ Demo end-to-end với dữ liệu mẫu

## Slide 8: Hạn chế & Hướng phát triển
- **Hạn chế:** AI chưa đánh giá lâm sàng, KB nhỏ
- **Tương lai:** Wearable integration, mở rộng KB, telemedicine

## Slide 9: Q&A
> "Thông tin chỉ mang tính tham khảo, không thay thế tư vấn y khoa chuyên nghiệp."
