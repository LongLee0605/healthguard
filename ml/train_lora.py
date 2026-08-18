#!/usr/bin/env python3
"""
Fine-tune HealthGuard LoRA adapter.

Requires: pip install torch transformers peft trl datasets accelerate bitsandbytes
Or use Unsloth for lower VRAM: pip install unsloth

Example:
  python train_lora.py --base-model Qwen/Qwen2.5-3B-Instruct --output ./models/healthguard-lora
"""

import argparse
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Fine-tune HealthGuard LoRA")
    parser.add_argument("--base-model", default="Qwen/Qwen2.5-3B-Instruct")
    parser.add_argument("--data", default=str(Path(__file__).parent / "data" / "gold_train.jsonl"))
    parser.add_argument("--output", default=str(Path(__file__).parent / "models" / "healthguard-lora"))
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--lr", type=float, default=2e-4)
    args = parser.parse_args()

    try:
        from datasets import load_dataset
        from peft import LoraConfig, get_peft_model
        from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
        from trl import SFTTrainer
    except ImportError as e:
        raise SystemExit(
            "Install training deps: pip install torch transformers peft trl datasets accelerate\n"
            f"Missing: {e}"
        ) from e

    data_path = Path(args.data)
    if not data_path.exists():
        raise SystemExit(f"Dataset not found: {data_path}. Run export_dataset.py first.")

    dataset = load_dataset("json", data_files={"train": str(data_path)}, split="train")

    def format_row(row):
        return (
            f"### Instruction:\n{row['instruction']}\n\n"
            f"### Input:\n{row['input']}\n\n"
            f"### Response:\n{row['output']}"
        )

    dataset = dataset.map(lambda r: {"text": format_row(r)})

    tokenizer = AutoTokenizer.from_pretrained(args.base_model, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        trust_remote_code=True,
        device_map="auto",
    )

    lora = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
        lora_dropout=0.05,
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora)

    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)

    training_args = TrainingArguments(
        output_dir=str(out),
        num_train_epochs=args.epochs,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=args.lr,
        logging_steps=10,
        save_strategy="epoch",
        fp16=True,
    )

    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset,
        args=training_args,
        processing_class=tokenizer,
        dataset_text_field="text",
        max_seq_length=1024,
    )

    trainer.train()
    model.save_pretrained(out)
    tokenizer.save_pretrained(out)
    print(f"LoRA adapter saved to {out}")
    print("Next: ollama create healthguard -f Modelfile")


if __name__ == "__main__":
    main()
