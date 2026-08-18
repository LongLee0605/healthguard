'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

interface Props {
  onResult: (text: string) => void;
  className?: string;
}

export default function VoiceInput({ onResult, className = '' }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    const SR = (window as Window & { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition
      || (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;
    if (SR) {
      setSupported(true);
      const rec = new SR();
      rec.lang = 'vi-VN';
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (e: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => {
        const text = e.results[0]?.[0]?.transcript;
        if (text) onResultRef.current(text);
        setListening(false);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      recognitionRef.current?.start();
      setListening(true);
    }
  }, [listening]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className={`touch-target gap-1.5 px-3 rounded-lg text-sm font-medium transition-all shrink-0 ${
        listening ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse' : 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200 hover:bg-teal-200 dark:hover:bg-teal-900/60'
      } ${className}`}
      aria-label={listening ? 'Đang nghe' : 'Nhập bằng giọng nói'}
    >
      {listening ? '🔴' : '🎤'}
      <span className="hidden sm:inline">{listening ? 'Nghe...' : 'Nói'}</span>
    </button>
  );
}
