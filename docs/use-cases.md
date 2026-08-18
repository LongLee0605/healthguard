# Use Case Diagram — HealthGuard

## Actors

- **Patient (Người dùng):** Sử dụng mobile app và web dashboard
- **AI Service:** Phân tích triệu chứng, tạo cảnh báo
- **System:** Gửi notification, lưu trữ dữ liệu

## Use Cases

```mermaid
flowchart TB
    subgraph actors [Actors]
        User((Patient))
        AI((AI Service))
    end

    subgraph auth [Authentication]
        UC1[Register Account]
        UC2[Login]
        UC3[Manage Profile]
    end

    subgraph health [Health Tracking]
        UC4[Log Symptoms]
        UC5[Log Vital Signs]
        UC6[View Health History]
        UC7[Set Medication Reminder]
    end

    subgraph ai_uc [AI Features]
        UC8[Analyze Symptoms]
        UC9[Detect Anomalies]
        UC10[Get Specialty Suggestion]
    end

    subgraph dashboard [Dashboard]
        UC11[View Health Charts]
        UC12[View AI Reports]
        UC13[Export PDF Report]
        UC14[Manage Alerts]
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC11
    User --> UC12
    User --> UC13
    User --> UC14

    UC4 --> UC8
    UC8 --> AI
    UC8 --> UC9
    UC8 --> UC10
    UC9 --> UC14
    UC11 --> UC6
    UC12 --> UC8
```

## Use Case Descriptions

| ID | Use Case | Mô tả |
|----|----------|-------|
| UC1 | Register | Tạo tài khoản với email, mật khẩu, thông tin cơ bản |
| UC2 | Login | Xác thực JWT, trả access + refresh token |
| UC4 | Log Symptoms | Nhập mô tả triệu chứng, mức độ, vị trí cơ thể |
| UC5 | Log Vital Signs | Nhập huyết áp, đường huyết, hoặc cân nặng |
| UC8 | Analyze Symptoms | Gửi triệu chứng + lịch sử tới AI, nhận phân tích |
| UC9 | Detect Anomalies | Rule-based kiểm tra chỉ số bất thường |
| UC11 | View Charts | Biểu đồ xu hướng theo thời gian trên dashboard |
| UC14 | Manage Alerts | Xem và đánh dấu đã đọc các cảnh báo |
