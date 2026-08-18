# HealthGuard ML — AI y tế local

HealthGuard **không train thành bác sĩ**. Pipeline này làm mô hình **an toàn hơn, triage rõ hơn**, chạy 100% trên máy (Ollama).

## Chiến lược (đã nghiên cứu)

| Cách | Phù hợp đồ án? | Ghi chú |
|------|----------------|---------|
| Fine-tune trên chat user trong DB | **Không** | Học lại câu trả lời sai của model cũ |
| Pretrain từ đầu trên PubMed | Không | Cần GPU cụm + giấy phép dữ liệu |
| **RAG pgvector + corpus tiếng Việt** | **Có** | Nguồn kiến thức kiểm soát được |
| **Ollama Modelfile (system + few-shot)** | **Có** | Không cần GPU, 2–5 phút |
| LoRA Qwen2.5-3B trên bộ **gold** | Tùy chọn | Cần GPU ~8GB / Colab |

## Lệnh chính (thư mục gốc)

```powershell
npm run train:ai
```

Lệnh này:

1. Chờ Ollama (`qwen2.5:3b-instruct` phải đã pull)
2. Tạo model **`healthguard-med`** (system prompt y tế + 6 tình huống vàng)
3. Chấm điểm 8 ca: cấp cứu, đột quỵ, cấm kháng sinh bừa, hạ đường huyết, sốt xuất huyết, từ chối kê đơn
4. Ghi `OLLAMA_MODEL=healthguard-med` vào `backend/.env`

Sau đó **khởi động lại** `npm run dev:backend` để API dùng model mới và nhúng lại RAG.

## LoRA (tuỳ chọn, có GPU)

```powershell
cd ml
pip install -r requirements.txt
pip install torch transformers peft trl datasets accelerate
python train_lora.py --data data/gold_train.jsonl
```

**Không** chạy `export_dataset.py` rồi train ngay — file đó trộn phân tích cũ trong DB, dễ khuếch đại lỗi. Chỉ dùng gold (`data/gold_shots.json` / `gold_train.jsonl`).

## Production

Đổi `OLLAMA_MODEL=healthguard-med` trên server Ollama đã `ollama create`. Frontend không cần sửa.
