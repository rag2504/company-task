import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Package } from 'lucide-react';
import { api } from '../../services/client';

export default function StockPredictionPanel({ darkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: res } = await api.get('/ai/predictions/stock');
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const preds = data?.predictions || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start gap-3">
        <Brain className="h-10 w-10 text-indigo-500" />
        <div>
          <h2 className="text-3xl font-bold">Predictive restocking</h2>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Velocity from the last 30 days plus Quickbill rules — narrated by Groq when configured.
          </p>
        </div>
      </div>

      {data?.narrative && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-2xl p-5 border ${darkMode ? 'border-indigo-400/30 bg-indigo-950/40' : 'border-indigo-100 bg-indigo-50'}`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{data.narrative}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {preds.map((p, i) => (
          <motion.div
            key={p.productId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`rounded-2xl border p-4 flex flex-col gap-2 ${
              darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white shadow-sm'
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs opacity-70">{p.category}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  p.urgency === 'critical'
                    ? 'bg-red-500/20 text-red-400'
                    : p.urgency === 'high'
                      ? 'bg-orange-500/20 text-orange-400'
                      : p.urgency === 'watch'
                        ? 'bg-amber-500/20 text-amber-500'
                        : 'bg-emerald-500/15 text-emerald-400'
                }`}
              >
                {p.urgency}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
              <div className={`rounded-lg p-2 ${darkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
                <p className="text-xs opacity-70">On hand</p>
                <p className="font-semibold flex items-center gap-1">
                  <Package className="h-4 w-4" /> {p.currentStock}
                </p>
              </div>
              <div className={`rounded-lg p-2 ${darkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
                <p className="text-xs opacity-70">Avg daily sales</p>
                <p className="font-semibold">{p.avgDailySales}</p>
              </div>
              <div className={`rounded-lg p-2 ${darkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
                <p className="text-xs opacity-70">Days cover</p>
                <p className="font-semibold">
                  {p.estimatedDaysUntilStockout == null ? '—' : `${p.estimatedDaysUntilStockout}d`}
                </p>
              </div>
              <div className={`rounded-lg p-2 ${darkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
                <p className="text-xs opacity-70">Suggested reorder</p>
                <p className="font-semibold">{p.suggestedReorderQty} units</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
