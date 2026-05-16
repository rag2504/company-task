import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Wallet,
  Calendar,
  AlertTriangle,
  Sparkles,
  Package,
  Clock,
} from 'lucide-react';
import { api } from '../../services/client';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];

function InsightCard({ darkMode, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border backdrop-blur-xl p-5 shadow-lg ${
        darkMode
          ? 'bg-white/5 border-white/10 text-gray-100'
          : 'bg-white/80 border-white/60 text-gray-900'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-indigo-500" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm leading-relaxed opacity-90">{children}</ul>
    </motion.div>
  );
}

export default function AIDashboard({ darkMode }) {
  const [analytics, setAnalytics] = useState(null);
  const [insightsDaily, setInsightsDaily] = useState([]);
  const [insightsWeekly, setInsightsWeekly] = useState([]);
  const [summaryDaily, setSummaryDaily] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const [dashRes, dIns, wIns, sum] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/ai/insights', { params: { period: 'daily' } }).catch(() => ({ data: {} })),
          api.get('/ai/insights', { params: { period: 'weekly' } }).catch(() => ({ data: {} })),
          api.get('/ai/summary', { params: { period: 'daily' } }).catch(() => ({ data: {} })),
        ]);
        if (cancelled) return;
        setAnalytics(dashRes.data.data);
        setInsightsDaily(dIns.data.bullets || []);
        setInsightsWeekly(wIns.data.bullets || []);
        setSummaryDaily(sum.data.summary || '');
      } catch (e) {
        if (!cancelled) {
          const status = e.response?.status;
          let msg = e.response?.data?.message || e.message;
          if (!e.response && e.request) {
            msg =
              'Network Error — start the backend: cd backend && npm run dev (http://localhost:5000), then restart the React app.';
          } else if (status === 404) {
            msg =
              'Could not reach Quickbill API routes (404). Start the backend on port 5000 and restart `npm start`.';
          } else if (status === 401) {
            msg =
              'AI requires a server login. Sign out, ensure the backend is running, then sign in again (MongoDB user, e.g. demo@quickbill.app after npm run seed).';
          }
          setErr(msg);
        }
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
      <div className="flex justify-center py-24">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (err) {
    return (
      <div
        className={`rounded-xl p-6 ${darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-800'}`}
      >
        {err}
      </div>
    );
  }

  const d = analytics || {};
  const totals = d.totals || {};
  const spark = (d.charts?.last14DaysRevenue || []).map((row) => ({
    ...row,
    day: new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }));

  const catData = (d.bestSellingCategories || []).map((c) => ({
    name: c.category,
    value: Math.round(c.revenue),
  }));

  const topBar = (d.topSellingProducts || []).slice(0, 6).map((p) => ({
    name: p.name?.slice(0, 14) || 'Item',
    qty: p.quantitySold,
  }));

  const kpis = [
    {
      label: 'Total sales',
      value: `₹${Math.round(totals.totalSales || 0)}`,
      icon: Wallet,
      tint: 'from-violet-600 to-indigo-600',
    },
    {
      label: "Today's sales",
      value: `₹${Math.round(totals.todaySales || 0)}`,
      icon: Calendar,
      tint: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Weekly sales',
      value: `₹${Math.round(totals.weeklySales || 0)}`,
      icon: TrendingUp,
      tint: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Monthly revenue',
      value: `₹${Math.round(totals.monthlyRevenue || 0)}`,
      icon: TrendingUp,
      tint: 'from-pink-500 to-rose-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-indigo-500 font-semibold">
            Quickbill Intelligence
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mt-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Command Center
          </h2>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Live analytics, forecasting signals, and Groq-generated narratives.
          </p>
        </div>
        {d.peakSalesTime && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl ${darkMode ? 'bg-white/10' : 'bg-indigo-50'}`}
          >
            <Clock className="h-5 w-5 text-indigo-500" />
            <span className="text-sm">
              Peak activity ~{d.peakSalesTime.label} ({d.comparisons?.todayVsYesterdayPercent ?? 0}%
              vs yesterday&apos;s rhythm)
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-2xl p-5 text-white shadow-xl bg-gradient-to-br ${k.tint}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">{k.label}</p>
                <p className="text-2xl font-bold mt-1">{k.value}</p>
              </div>
              <k.icon className="h-8 w-8 opacity-80" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`lg:col-span-2 rounded-2xl border p-4 ${
            darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'
          }`}
        >
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" /> Revenue trend (14 days)
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <InsightCard darkMode={darkMode} title="Daily AI insights">
          {(insightsDaily.length ? insightsDaily : ['Add more bills to unlock richer AI commentary.']).map(
            (b, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span>{b}</span>
              </li>
            )
          )}
        </InsightCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className={`rounded-2xl border p-4 ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}
        >
          <h4 className="font-semibold mb-2">Best categories</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={catData.length ? catData : [{ name: 'N/A', value: 1 }]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {(catData.length ? catData : [{ name: 'N/A', value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-4 ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}
        >
          <h4 className="font-semibold mb-2">Top movers (qty)</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBar.length ? topBar : [{ name: '-', qty: 0 }]}>
                <XAxis dataKey="name" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={10} />
                <Tooltip />
                <Bar dataKey="qty" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightCard darkMode={darkMode} title="Weekly AI pulse">
          {(insightsWeekly.length ? insightsWeekly : ['Run sync notifications after stocking events.']).map(
            (b, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-purple-500 font-bold">•</span>
                <span>{b}</span>
              </li>
            )
          )}
        </InsightCard>

        <div
          className={`rounded-2xl border p-5 ${darkMode ? 'border-white/10 bg-gradient-to-br from-indigo-900/40 to-purple-900/30' : 'border-indigo-100 bg-gradient-to-br from-indigo-50 to-white'}`}
        >
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            Executive narrative
          </h4>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {summaryDaily ||
              'Generate summaries automatically once Groq API keys are configured server-side.'}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div
              className={`rounded-xl p-3 ${darkMode ? 'bg-black/20' : 'bg-white shadow-sm'}`}
            >
              <p className="text-xs opacity-70">Pending payments</p>
              <p className="text-lg font-semibold">{d.pendingPayments?.count ?? 0}</p>
            </div>
            <div
              className={`rounded-xl p-3 ${darkMode ? 'bg-black/20' : 'bg-white shadow-sm'}`}
            >
              <p className="text-xs opacity-70">Est. profit (cost-based)</p>
              <p className="text-lg font-semibold">
                ₹{Math.round(d.profitAnalysis?.estimatedProfit || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`rounded-xl p-4 flex items-start gap-3 ${darkMode ? 'bg-orange-900/20' : 'bg-orange-50'}`}
        >
          <AlertTriangle className="h-6 w-6 text-orange-500 shrink-0" />
          <div>
            <p className="font-medium">Low stock</p>
            <p className="text-sm opacity-80">{(d.lowStockProducts || []).length} SKUs below threshold</p>
          </div>
        </div>
        <div
          className={`rounded-xl p-4 flex items-start gap-3 ${darkMode ? 'bg-red-900/25' : 'bg-red-50'}`}
        >
          <Package className="h-6 w-6 text-red-500 shrink-0" />
          <div>
            <p className="font-medium">Out of stock</p>
            <p className="text-sm opacity-80">{(d.outOfStockProducts || []).length} SKUs need inbound</p>
          </div>
        </div>
        <div
          className={`rounded-xl p-4 flex items-start gap-3 ${darkMode ? 'bg-blue-900/25' : 'bg-blue-50'}`}
        >
          <TrendingUp className="h-6 w-6 text-blue-500 shrink-0" />
          <div>
            <p className="font-medium">Customers tracked</p>
            <p className="text-sm opacity-80">{totals.totalCustomers ?? 0} unique phone records</p>
          </div>
        </div>
      </div>
    </div>
  );
}
