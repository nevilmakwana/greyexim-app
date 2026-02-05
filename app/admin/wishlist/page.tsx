"use client";

import { useEffect, useMemo, useState } from "react";

type WishlistItem = {
  _id: string;
  userEmail: string;
  userPhone?: string;
  marketingOptIn?: boolean;
  leadStatus?: string;
  leadNotes?: string;
  addedAt?: string;
  productId?: {
    _id: string;
    designName: string;
    designCode: string;
    images?: string[];
    price?: number;
  };
};

type TrendRow = {
  productId: string;
  name: string;
  code: string;
  image?: string;
  count: number;
  price?: number;
};

type ProductOption = {
  id: string;
  name: string;
};

const LEAD_STATUSES = ["New", "Contacted", "Interested", "Closed"];

export default function AdminWishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"score" | "recent" | "price" | "name">("score");
  const [productFilter, setProductFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/wishlist");
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const productOptions = useMemo<ProductOption[]>(() => {
    const map = new Map<string, string>();
    items.forEach((item) => {
      const p = item.productId;
      if (p?._id && p.designName) {
        map.set(p._id, p.designName);
      }
    });
    return [{ id: "all", name: "All Products" }, ...[...map.entries()].map(([id, name]) => ({ id, name }))];
  }, [items]);

  const leadScore = (item: WishlistItem, counts: Map<string, number>) => {
    const price = item.productId?.price || 0;
    const recencyDays = item.addedAt
      ? Math.max(0, (Date.now() - new Date(item.addedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 99;
    const recencyScore = Math.max(0, 30 - Math.floor(recencyDays));
    const priceScore = Math.min(40, Math.floor(price / 50));
    const frequencyScore = Math.min(30, (counts.get(item.userEmail) || 1) * 5);
    return recencyScore + priceScore + frequencyScore;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items;
    if (q) {
      list = list.filter((i) => {
        const name = i.productId?.designName?.toLowerCase() || "";
        const code = i.productId?.designCode?.toLowerCase() || "";
        const email = i.userEmail?.toLowerCase() || "";
        const phone = i.userPhone?.toLowerCase() || "";
        return name.includes(q) || code.includes(q) || email.includes(q) || phone.includes(q);
      });
    }

    if (productFilter !== "all") {
      list = list.filter((i) => i.productId?._id === productFilter);
    }

    const counts = new Map<string, number>();
    list.forEach((i) => counts.set(i.userEmail, (counts.get(i.userEmail) || 0) + 1));

    return [...list].sort((a, b) => {
      if (sortBy === "recent") {
        return (new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime());
      }
      if (sortBy === "price") {
        return (b.productId?.price || 0) - (a.productId?.price || 0);
      }
      if (sortBy === "name") {
        return (a.productId?.designName || "").localeCompare(b.productId?.designName || "");
      }
      return leadScore(b, counts) - leadScore(a, counts);
    });
  }, [items, query, sortBy, productFilter]);

  const trends = useMemo<TrendRow[]>(() => {
    const map = new Map<string, TrendRow>();
    items.forEach((item) => {
      const p = item.productId;
      if (!p?._id) return;
      if (!map.has(p._id)) {
        map.set(p._id, {
          productId: p._id,
          name: p.designName,
          code: p.designCode,
          image: p.images?.[0],
          count: 0,
          price: p.price,
        });
      }
      map.get(p._id)!.count += 1;
    });
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  }, [items]);

  const sendOutreach = async (id: string, channel: "email" | "whatsapp" | "both") => {
    setSending(id + channel);
    try {
      const res = await fetch("/api/admin/wishlist/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlistId: id, channel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(data?.error || "Failed to send");
      } else {
        setToast("Message sent");
      }
    } catch {
      setToast("Failed to send");
    } finally {
      setSending(null);
      setTimeout(() => setToast(null), 2000);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => setSelected(filtered.map((i) => i._id));
  const clearSelection = () => setSelected([]);

  const bulkSend = async (channel: "email" | "whatsapp" | "both") => {
    if (selected.length === 0) return;
    setSending("bulk" + channel);
    try {
      const res = await fetch("/api/admin/wishlist/contact-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlistIds: selected, channel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(data?.error || "Failed to send");
      } else {
        setToast("Bulk messages sent");
      }
    } catch {
      setToast("Failed to send");
    } finally {
      setSending(null);
      setTimeout(() => setToast(null), 2000);
    }
  };

  const updateLead = async (id: string, leadStatus: string, leadNotes: string) => {
    setSending(id + "update");
    try {
      const res = await fetch("/api/admin/wishlist/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, leadStatus, leadNotes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(data?.error || "Failed to update");
      } else {
        setItems((prev) => prev.map((i) => (i._id === id ? { ...i, leadStatus, leadNotes } : i)));
        setToast("Lead updated");
      }
    } catch {
      setToast("Failed to update");
    } finally {
      setSending(null);
      setTimeout(() => setToast(null), 2000);
    }
  };

  const exportCsv = async () => {
    const res = await fetch("/api/admin/wishlist/export");
    if (!res.ok) {
      setToast("Export failed");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wishlist_leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-blue-600 font-black mb-2">
            Customer Signals
          </p>
          <h1 className="text-3xl font-black">Wishlist Leads</h1>
        </div>
        <div className="text-xs font-black uppercase tracking-widest text-gray-400">
          {items.length} total
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-6 flex flex-col gap-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email, phone, product name or code"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Sort</div>
          <select
            className="text-xs border border-gray-200 rounded-full px-3 py-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="score">Lead Score</option>
            <option value="recent">Most Recent</option>
            <option value="price">Highest Price</option>
            <option value="name">Product Name</option>
          </select>

          <div className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Product</div>
          <select
            className="text-xs border border-gray-200 rounded-full px-3 py-1"
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
          >
            {productOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={exportCsv}
            className="text-[10px] uppercase tracking-widest font-black text-white bg-black px-3 py-2 rounded-full"
          >
            Export CSV
          </button>
        </div>
      </div>

      {trends.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest">Top Saved Products</h2>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
              Trending
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {trends.map((t) => (
              <div key={t.productId} className="flex items-center gap-3">
                <div className="w-12 h-14 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
                  {t.image && <img src={t.image} alt={t.name} className="w-full h-full object-cover" />}
                </div>
                <div>
                  <p className="text-xs font-bold truncate max-w-[120px]">{t.name}</p>
                  <p className="text-[10px] text-gray-400">{t.code} · {t.count} saves</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
            {selected.length} selected
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => bulkSend("email")}
              disabled={sending === "bulkemail"}
              className="text-[10px] uppercase tracking-widest font-black text-white bg-black px-3 py-2 rounded-full"
            >
              Email Selected
            </button>
            <button
              onClick={() => bulkSend("whatsapp")}
              disabled={sending === "bulkwhatsapp"}
              className="text-[10px] uppercase tracking-widest font-black text-green-700 bg-green-50 border border-green-100 px-3 py-2 rounded-full"
            >
              WhatsApp Selected
            </button>
            <button
              onClick={() => bulkSend("both")}
              disabled={sending === "bulkboth"}
              className="text-[10px] uppercase tracking-widest font-black text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-full"
            >
              Send Both
            </button>
            <button
              onClick={clearSelection}
              className="text-[10px] uppercase tracking-widest font-black text-gray-400 bg-gray-100 px-3 py-2 rounded-full"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-10">Loading wishlist...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed rounded-2xl p-10 text-center text-gray-400">
          No wishlist entries found.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const product = item.productId;
            const counts = new Map<string, number>();
            filtered.forEach((i) => counts.set(i.userEmail, (counts.get(i.userEmail) || 0) + 1));
            const score = leadScore(item, counts);

            return (
              <div
                key={item._id}
                className={`bg-white border rounded-2xl p-4 shadow-sm flex items-start gap-4 ${
                  selected.includes(item._id) ? "border-black" : "border-gray-100"
                }`}
              >
                <button
                  onClick={() => toggleSelect(item._id)}
                  className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-black ${
                    selected.includes(item._id)
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {selected.includes(item._id) ? "✓" : ""}
                </button>

                <div className="w-16 h-20 rounded-xl bg-gray-50 overflow-hidden border border-gray-100 shrink-0">
                  {product?.images?.[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.designName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-sm">
                        {product?.designName || "Unknown Product"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {product?.designCode || "—"} · ₹{product?.price || "—"}
                      </p>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
                      Score {score}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
                        Email
                      </p>
                      <p className="font-semibold">{item.userEmail || "—"}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
                        Phone
                      </p>
                      <p className="font-semibold">{item.userPhone || "—"}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {item.marketingOptIn ? (
                      <>
                        <button
                          onClick={() => sendOutreach(item._id, "email")}
                          className="text-[10px] uppercase tracking-widest font-black text-white bg-black px-3 py-2 rounded-full"
                          disabled={sending === item._id + "email"}
                        >
                          Email
                        </button>
                        <button
                          onClick={() => sendOutreach(item._id, "whatsapp")}
                          className="text-[10px] uppercase tracking-widest font-black text-green-700 bg-green-50 border border-green-100 px-3 py-2 rounded-full"
                          disabled={sending === item._id + "whatsapp"}
                        >
                          WhatsApp
                        </button>
                        <button
                          onClick={() => sendOutreach(item._id, "both")}
                          className="text-[10px] uppercase tracking-widest font-black text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-full"
                          disabled={sending === item._id + "both"}
                        >
                          Send Both
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 bg-gray-100 px-3 py-2 rounded-full">
                        Opt-in required
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="md:col-span-1">
                      <label className="text-[10px] uppercase tracking-widest font-black text-gray-400">
                        Status
                      </label>
                      <select
                        className="mt-1 w-full text-xs border border-gray-200 rounded-xl px-3 py-2"
                        value={item.leadStatus || "New"}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((i) =>
                              i._id === item._id ? { ...i, leadStatus: e.target.value } : i
                            )
                          )
                        }
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-gray-400">
                        Notes
                      </label>
                      <textarea
                        className="mt-1 w-full text-xs border border-gray-200 rounded-xl px-3 py-2 min-h-[64px]"
                        value={item.leadNotes || ""}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((i) =>
                              i._id === item._id ? { ...i, leadNotes: e.target.value } : i
                            )
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateLead(item._id, item.leadStatus || "New", item.leadNotes || "")
                      }
                      className="text-[10px] uppercase tracking-widest font-black text-white bg-black px-3 py-2 rounded-full"
                      disabled={sending === item._id + "update"}
                    >
                      Save Lead
                    </button>
                    <div className="text-[10px] uppercase tracking-widest font-black text-gray-400">
                      Opt-in: {item.marketingOptIn ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="fixed left-6 right-6 bottom-6 bg-black text-white text-xs font-black uppercase tracking-widest py-3 rounded-2xl text-center shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
