'use client';

import { useEffect, useState } from 'react';

const DEMO_MESSAGES = [
  { role: 'user' as const, text: 'Tôi bị đau đầu 2 ngày, huyết áp 140/90' },
  { role: 'ai' as const, text: 'Dựa trên triệu chứng, bạn nên theo dõi huyết áp thường xuyên. Đau đầu kéo dài kèm HA cao cần được bác sĩ đánh giá. Tôi khuyên bạn nghỉ ngơi, uống đủ nước và đo lại sau 24h.' },
  { role: 'user' as const, text: 'Có cần đi khám ngay không?' },
  { role: 'ai' as const, text: '⚠️ Mức độ trung bình. Nếu đau đầu dữ dội, buồn nồi, chóng mặt — hãy đến cơ sở y tế ngay. Khuyến nghị: Khoa Nội tổng quát.' },
];

export default function LandingChatDemo() {
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (visible >= DEMO_MESSAGES.length) {
      const reset = setTimeout(() => { setVisible(0); }, 4000);
      return () => clearTimeout(reset);
    }
    const msg = DEMO_MESSAGES[visible];
    const delay = msg.role === 'ai' ? 1800 : 1200;
    if (msg.role === 'ai') {
      setTyping(true);
      const t = setTimeout(() => { setTyping(false); setVisible((v) => v + 1); }, delay);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisible((v) => v + 1), delay);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl shadow-teal-500/10">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-2 text-xs text-slate-400">HealthGuard AI Chat — Local</span>
      </div>
      <div className="p-4 space-y-3 min-h-[220px]">
        {DEMO_MESSAGES.slice(0, visible).map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'bg-teal-600 text-white rounded-br-sm'
                : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/50'
            }`}>
              {m.role === 'ai' && <span className="text-xs text-teal-400 font-semibold block mb-0.5">🤖 AI</span>}
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl px-4 py-2 rounded-bl-sm border border-slate-700/50">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
