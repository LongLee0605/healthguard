# Database Schema — HealthGuard

## ERD

```mermaid
erDiagram
    User ||--o{ SymptomLog : records
    User ||--o{ VitalSign : tracks
    User ||--o{ AIAnalysis : receives
    User ||--o{ MedicationReminder : has
    User ||--o{ Alert : gets

    User {
        uuid id PK
        string email UK
        string passwordHash
        string fullName
        date dateOfBirth
        string gender
        datetime createdAt
        datetime updatedAt
    }

    SymptomLog {
        uuid id PK
        uuid userId FK
        string description
        int severity
        string bodyPart
        datetime recordedAt
        datetime createdAt
    }

    VitalSign {
        uuid id PK
        uuid userId FK
        enum type
        float value
        float valueSecondary
        string unit
        string note
        datetime recordedAt
        datetime createdAt
    }

    AIAnalysis {
        uuid id PK
        uuid userId FK
        uuid symptomLogId FK
        string inputSummary
        string analysis
        string suggestedSpecialty
        enum urgencyLevel
        datetime createdAt
    }

    MedicationReminder {
        uuid id PK
        uuid userId FK
        string medicationName
        string dosage
        string schedule
        boolean isActive
        datetime createdAt
    }

    Alert {
        uuid id PK
        uuid userId FK
        string title
        string message
        enum type
        boolean isRead
        datetime createdAt
    }
```

## VitalSign Types

| Type | Fields | Unit |
|------|--------|------|
| BLOOD_PRESSURE | value (systolic), valueSecondary (diastolic) | mmHg |
| BLOOD_SUGAR | value | mg/dL |
| WEIGHT | value | kg |

## Urgency Levels

- `LOW` — Theo dõi tại nhà
- `MEDIUM` — Nên khám trong vài ngày
- `HIGH` — Cần khám sớm / cấp cứu

## Indexes

- `User.email` — unique
- `SymptomLog.userId, recordedAt` — query history
- `VitalSign.userId, type, recordedAt` — chart data
- `Alert.userId, isRead` — unread alerts
