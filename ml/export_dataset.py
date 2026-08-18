#!/usr/bin/env python3
"""Export HealthGuard DB to JSONL — KHÔNG dùng làm nguồn train chính.

Chat/phân tích trong DB có thể sai (do model cũ). Fine-tune trên đó làm AI tệ hơn.
Dùng ml/data/gold_shots.json và npm run train:ai.
Script này chỉ để thống kê / backup nghiên cứu.
"""

import json
import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / "backend" / ".env")

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://healthguard:healthguard@localhost:5432/healthguard",
)

OUTPUT_DIR = Path(__file__).parent / "data"
OUTPUT_DIR.mkdir(exist_ok=True)


def export_analyses(conn) -> list[dict]:
    rows = []
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT s.description, s.severity, s."bodyPart",
                   a.analysis, a."suggestedSpecialty", a."urgencyLevel"
            FROM "AIAnalysis" a
            JOIN "SymptomLog" s ON s.id = a."symptomLogId"
            WHERE a."symptomLogId" IS NOT NULL
            ORDER BY a."createdAt" DESC
            LIMIT 2000
            """
        )
        for desc, severity, body_part, analysis, specialty, urgency in cur.fetchall():
            input_text = f"Triệu chứng: {desc}\nMức độ: {severity}/10\nVị trí: {body_part or 'Không rõ'}"
            output_json = json.dumps(
                {
                    "analysis": analysis,
                    "suggestedSpecialty": specialty or "Đa khoa",
                    "urgencyLevel": urgency or "LOW",
                },
                ensure_ascii=False,
            )
            rows.append(
                {
                    "instruction": "Phân tích triệu chứng sức khỏe và trả lời JSON tiếng Việt.",
                    "input": input_text,
                    "output": output_json,
                }
            )
    return rows


def export_chat(conn) -> list[dict]:
    rows = []
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT role, content FROM "ChatMessage"
            ORDER BY "createdAt" ASC
            LIMIT 5000
            """
        )
        messages = cur.fetchall()
    user_msg = None
    for role, content in messages:
        if role == "user":
            user_msg = content
        elif role == "assistant" and user_msg:
            rows.append(
                {
                    "instruction": "Bạn là HealthGuard AI — trợ lý sức khỏe tiếng Việt.",
                    "input": user_msg,
                    "output": content,
                }
            )
            user_msg = None
    return rows


def write_jsonl(path: Path, records: list[dict]) -> None:
    with path.open("w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def main() -> None:
    conn = psycopg2.connect(DATABASE_URL)
    try:
        analyses = export_analyses(conn)
        chats = export_chat(conn)
        all_records = analyses + chats

        if not all_records:
            print("No records found — using sample seed data for demo.")
            all_records = [
                {
                    "instruction": "Phân tích triệu chứng sức khỏe và trả lời JSON tiếng Việt.",
                    "input": "Triệu chứng: đau đầu, chóng mặt\nMức độ: 6/10\nVị trí: đầu",
                    "output": json.dumps(
                        {
                            "analysis": "Đau đầu kèm chóng mặt có thể do huyết áp hoặc mất nước. Nghỉ ngơi và theo dõi.",
                            "suggestedSpecialty": "Thần kinh",
                            "urgencyLevel": "MEDIUM",
                        },
                        ensure_ascii=False,
                    ),
                }
            ]

        split = max(1, int(len(all_records) * 0.9))
        train = all_records[:split]
        val = all_records[split:] or train[:1]

        write_jsonl(OUTPUT_DIR / "train.jsonl", train)
        write_jsonl(OUTPUT_DIR / "val.jsonl", val)
        print(f"Exported {len(train)} train + {len(val)} val samples to {OUTPUT_DIR}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
