import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../../services/client';

const PRESETS = [
  'How many Coca Cola bottles are left?',
  "Show today's sales",
  'Which products are low in stock?',
  'What should I restock?',
  'Show pending payments',
  'How much revenue did we make this month?',
];

export default function AIChatPanel({ darkMode }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/ai/chat/history');
        if (!cancelled && data.messages?.length) {
          setMessages(data.messages.map((m) => ({ role: m.role, text: m.content })));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pushAssistant = (text) => {
    setMessages((prev) => [...prev, { role: 'assistant', text }]);
  };

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/chat', { message: trimmed });
      pushAssistant(data.reply);
    } catch (e) {
      pushAssistant(e.response?.data?.message || e.message || 'Chat failed.');
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (ev) => {
      const said = ev.results[0][0].transcript;
      setInput(said);
      send(said);
    };
    rec.start();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <p className="text-sm font-semibold text-indigo-500 uppercase tracking-wider">Assistant</p>
        <h2 className="text-3xl font-bold mt-1">Groq-powered Quickbill Copilot</h2>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Ask in plain language about inventory, revenue, or payments.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => send(p)}
            className={`text-xs px-3 py-1.5 rounded-full border transition hover:scale-[1.02] ${
              darkMode
                ? 'border-white/20 bg-white/5 hover:bg-white/10'
                : 'border-gray-200 bg-white hover:border-indigo-300'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div
        className={`rounded-2xl border min-h-[420px] flex flex-col overflow-hidden ${
          darkMode ? 'border-white/10 bg-black/30' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[480px]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                      : darkMode
                        ? 'bg-white/10 text-gray-100'
                        : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {m.role === 'assistant' && (
                    <Sparkles className="inline h-4 w-4 mr-1 text-amber-400" />
                  )}
                  {m.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex items-center gap-2 text-sm opacity-70 px-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Quickbill AI is thinking...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div
          className={`p-3 border-t flex gap-2 ${darkMode ? 'border-white/10 bg-black/40' : 'border-gray-100'}`}
        >
          <button
            type="button"
            onClick={startVoice}
            className={`p-3 rounded-xl ${listening ? 'bg-red-500 text-white animate-pulse' : darkMode ? 'bg-white/10' : 'bg-gray-100'}`}
            title="Voice query"
          >
            <Mic className="h-5 w-5" />
          </button>
          <input
            className={`flex-1 rounded-xl px-4 py-3 outline-none text-sm ${
              darkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200'
            }`}
            placeholder="Ask anything about your store..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={loading}
            className="px-5 rounded-xl bg-indigo-600 text-white flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
