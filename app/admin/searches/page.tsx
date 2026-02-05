"use client";

import { useEffect, useMemo, useState } from "react";

type TopRow = {
  _id: string;
  term: string;
  count: number;
  lastSearchedAt?: string;
};

type RecentRow = {
  _id: string;
  term: string;
  userEmail?: string;
  source?: string;
  createdAt?: string;
};

export default function AdminSearchesPage() {
  const [days, setDays] = useState(30);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [top, setTop] = useState<TopRow[]>([]);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/searches?days=${days}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        setToast(data?.error || "Failed to load");
        setTop([]);
        setRecent([]);
        setTotal(0);
        return;
      }

      setTop(Array.isArray(data?.top) ? data.top : []);
      setRecent(Array.isArray(data?.recent) ? data.recent : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch {
      setToast("Failed to load");
      setTop([]);
      setRecent([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 2000);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const q = query.trim().toLowerCase();

  const filteredTop = useMemo(() => {
    if (!q) return top;
    return top.filter((t) => (t.term || "").toLowerCase().includes(q));
  }, [top, q]);

  const filteredRecent = useMemo(() => {
    if (!q) return recent;
    return recent.filter((r) => {
      const term = (r.term || "").toLowerCase();
      const email = (r.userEmail || "").toLowerCase();
      const source = (r.source || "").toLowerCase();
      return term.includes(q) || email.includes(q) || source.includes(q);
    });
  }, [recent, q]);

  const fmtTime = (value?: string) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  };

  const exportCsv = async () => {
    try {
      const res = await fetch(`/api/admin/searches/export?days=${days}`);
      if (!res.ok) {
        setToast("Export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `search_terms_last_${days}_days.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setToast("Exported");
    } catch {
      setToast("Export failed");
    } finally {
      setTimeout(() => setToast(null), 2000);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-blue-600 font-black mb-2">
            Customer Intent
          </p>
          <h1 className="text-3xl font-black">Search Analytics</h1>
        </div>
        <div className="text-xs font-black uppercase tracking-widest text-gray-400">
          {total} searches (last {days} days)
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-6 flex flex-col gap-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search term, email or source"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
        />

        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
            Range
          </div>
          <select
            className="text-xs border border-gray-200 rounded-full px-3 py-1"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 365 days</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-black"
            >
              Export CSV
            </button>
            <button
              onClick={load}
              className="bg-black text-white px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-black"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest">
              Top Searches
            </h2>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
              {filteredTop.length} terms
            </div>
          </div>

          {loading ? (
            <div className="text-xs text-gray-400 font-semibold py-10 text-center">
              Loading...
            </div>
          ) : filteredTop.length === 0 ? (
            <div className="text-xs text-gray-400 font-semibold py-10 text-center">
              No data
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTop.slice(0, 30).map((row) => (
                <div key={row._id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-black truncate">
                      {row.term}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-400 font-black mt-1">
                      Last: {fmtTime(row.lastSearchedAt)}
                    </div>
                  </div>
                  <div className="shrink-0 bg-gray-100 text-gray-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {row.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest">
              Recent Searches
            </h2>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
              {filteredRecent.length} events
            </div>
          </div>

          {loading ? (
            <div className="text-xs text-gray-400 font-semibold py-10 text-center">
              Loading...
            </div>
          ) : filteredRecent.length === 0 ? (
            <div className="text-xs text-gray-400 font-semibold py-10 text-center">
              No data
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredRecent.slice(0, 60).map((row) => (
                <div key={row._id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-black text-black truncate">
                        {row.term}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-400 font-black mt-1">
                        {row.source || "unknown"} - {fmtTime(row.createdAt)}
                      </div>
                      {row.userEmail && (
                        <div className="text-[11px] text-gray-600 font-semibold mt-1 break-all">
                          {row.userEmail}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-[10px] uppercase tracking-widest font-black text-gray-400">
                      {row.userEmail ? "User" : "Guest"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-5 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl z-[999999]">
          {toast}
        </div>
      )}
    </div>
  );
}
