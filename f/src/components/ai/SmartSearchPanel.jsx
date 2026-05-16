import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { api } from '../../services/client';

export default function SmartSearchPanel({ darkMode }) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/ai/search', { query: q });
      setResult(data);
    } catch (e) {
      setResult({
        summary: e.response?.data?.message || e.message,
        results: { products: [], bills: [] },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Smart search</h2>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Describe what you need — Groq plans safe Mongo filters server-side.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Try "dairy products under 10 units" or "pending bills"'
          className={`flex-1 rounded-xl px-4 py-3 text-sm outline-none ${
            darkMode ? 'bg-white/5 border border-white/10 text-white' : 'border border-gray-200'
          }`}
          onKeyDown={(e) => e.key === 'Enter' && run()}
        />
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="px-6 rounded-xl bg-indigo-600 text-white flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-5 ${darkMode ? 'border-white/10 bg-white/5' : 'bg-white border-gray-200'}`}
        >
          <p className="text-sm mb-4 leading-relaxed">{result.summary}</p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-2">Products ({result.results?.products?.length || 0})</p>
              <ul className="space-y-1 max-h-48 overflow-auto opacity-90">
                {(result.results?.products || []).map((p) => (
                  <li key={p._id}>
                    {p.name}{' '}
                    <span className="opacity-60">
                      — stock {p.units} ({p.category})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Bills ({result.results?.bills?.length || 0})</p>
              <ul className="space-y-1 max-h-48 overflow-auto opacity-90">
                {(result.results?.bills || []).map((b) => (
                  <li key={b._id}>
                    {b.billNumber} — ₹{b.totalAmount}{' '}
                    <span className="opacity-60">({b.paymentStatus})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
