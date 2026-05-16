import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, FileText, Printer, Download } from 'lucide-react';
import { api } from '../../services/client';

const ranges = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export default function ReportsHub({ darkMode }) {
  const [range, setRange] = useState('daily');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/ai/summary', { params: { period: range } });
        if (!cancelled) setSummary(data.summary || '');
      } catch {
        if (!cancelled) setSummary('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const download = async (kind, ext) => {
    try {
      const res = await api.get(`/reports/${kind}/${range}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `quickbill-${range}.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Download failed');
    }
  };

  const printSummary = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<pre style="font-family:sans-serif">${summary}</pre>`);
    w.print();
    w.close();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Reports & exports</h2>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          CSV, Excel, PDF exports include AI narrative when Groq is configured.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ranges.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRange(r.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              range === r.id
                ? 'bg-indigo-600 text-white'
                : darkMode
                  ? 'bg-white/10'
                  : 'bg-gray-100'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => download('csv', 'csv')}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 text-white"
        >
          <Download className="h-4 w-4" /> CSV
        </button>
        <button
          type="button"
          onClick={() => download('excel', 'xlsx')}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white"
        >
          <FileSpreadsheet className="h-4 w-4" /> Excel
        </button>
        <button
          type="button"
          onClick={() => download('pdf', 'pdf')}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-600 text-white"
        >
          <FileText className="h-4 w-4" /> PDF
        </button>
        <button
          type="button"
          onClick={printSummary}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-300"
        >
          <Printer className="h-4 w-4" /> Print summary
        </button>
      </div>

      <div
        className={`rounded-2xl border p-6 ${darkMode ? 'border-white/10 bg-white/5' : 'bg-white border-gray-200'}`}
      >
        <h3 className="font-semibold mb-3">AI preview — {range}</h3>
        <p className="text-sm whitespace-pre-wrap leading-relaxed opacity-90">
          {summary || 'Generating summary…'}
        </p>
      </div>

      <p className="text-xs opacity-60">
        Tip: authenticated downloads use your JWT automatically via the in-app axios client.
      </p>
    </div>
  );
}
