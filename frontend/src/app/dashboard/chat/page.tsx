'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send } from 'lucide-react';
import { useGetChatHistoryQuery, useSendChatMessageMutation, useClearChatMutation } from '@/store/api/baseApi';
import type { ChatMessage } from '@/types';
import { MEDICAL_DISCLAIMER } from '@/types';
import PageHeader from '@/components/PageHeader';
import VoiceInput from '@/components/VoiceInput';
import QueryError from '@/components/QueryError';
import LoadingSkeleton from '@/components/LoadingSkeleton';

const SUGGESTIONS = [
  'Tôi bị đau đầu 2 ngày nay, có sao không?',
  'Huyết áp 140/90 có cao không?',
  'Làm sao để ngủ ngon hơn?',
  'Triệu chứng nào cần đi cấp cứu?',
];

function stripTrailingDisclaimer(content: string) {
  const normalized = content.trim();
  if (!normalized.endsWith(MEDICAL_DISCLAIMER)) {
    return content;
  }

  return normalized
    .slice(0, normalized.length - MEDICAL_DISCLAIMER.length)
    .replace(/\n{2,}$/g, '\n')
    .trim();
}

export default function ChatPage() {
  const { data: history = [], isLoading, isError, refetch } = useGetChatHistoryQuery();
  const [sendMessage, { isLoading: sending }] = useSendChatMessageMutation();
  const [clearChat] = useClearChatMutation();
  const [optimistic, setOptimistic] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = [...history, ...optimistic.filter((o) => !history.some((h) => h.id === o.id))];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    const temp: ChatMessage = { id: `temp-${Date.now()}`, role: 'user', content: text, createdAt: new Date().toISOString() };
    setOptimistic((p) => [...p, temp]);
    setInput('');
    try {
      await sendMessage({ message: text }).unwrap();
      setOptimistic([]);
    } catch {
      setOptimistic((p) => p.filter((m) => m.id !== temp.id));
    }
  };

  const handleClear = async () => {
    if (!confirm('Xóa toàn bộ lịch sử chat?')) return;
    await clearChat();
    setOptimistic([]);
  };

  return (
    <div className="animate-fade-in flex flex-col chat-shell -mb-4 lg:mb-0">
      <PageHeader title="AI Health Assistant" subtitle="Trò chuyện với HealthGuard AI local" action={messages.length > 0 ? <button onClick={handleClear} className="btn-secondary text-sm">Xóa lịch sử</button> : undefined} />
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <QueryError onRetry={refetch} />
      ) : (
      <div className="card flex min-h-0 flex-1 flex-col overflow-hidden p-0!">
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-6 sm:py-8">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center">
                <Bot className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="font-bold text-heading">Xin chào! Tôi là HealthGuard AI</h3>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 justify-center mt-5 max-w-lg mx-auto px-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="chip min-h-11 w-full border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-200 sm:w-auto">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] sm:max-w-[80%] rounded-xl px-3.5 py-2.5 ${m.role === 'user' ? 'bg-teal-700 text-white rounded-br-sm' : 'rounded-bl-sm'}`} style={m.role === 'assistant' ? { backgroundColor: 'var(--bg)' } : undefined}>
                {m.role === 'assistant' && <span className="mb-0.5 flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400"><Bot className="w-3 h-3" /> HealthGuard AI</span>}
                <p className="wrap-break-word whitespace-pre-wrap text-sm leading-relaxed">
                  {m.role === 'assistant' ? stripTrailingDisclaimer(m.content) : m.content}
                </p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-xl px-3.5 py-2.5" style={{ backgroundColor: 'var(--bg)' }}>
                <div className="flex gap-1">{[0, 1, 2].map((i) => <div key={i} className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="shrink-0 p-3 sm:p-3.5" style={{ borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface)' }}>
          <p className="text-caption italic mb-2 text-center text-[10px] sm:text-xs line-clamp-2">{MEDICAL_DISCLAIMER}</p>
          <div className="flex gap-2 items-end">
            <textarea className="input min-h-11 max-h-28 flex-1 resize-none text-base" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }} placeholder="Nhập câu hỏi..." rows={1} />
            <VoiceInput onResult={(text) => { setInput(text); send(text); }} />
            <button onClick={() => send(input)} disabled={sending || !input.trim()} className="btn-primary shrink-0 touch-target px-4" aria-label="Gửi tin nhắn"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
