"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Fuse from "fuse.js";

/* ✅ FIXED PRODUCT INTERFACE (MATCHES API) */
interface Product {
  _id: string;
  designName: string;
  designCode: string;
  category: string;
  images: string[];
  price?: number;
  variants?: { price: number }[];
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialSearch = searchParams.get("q") || "";
  const initialCat = searchParams.get("cat") || "All";

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [localSearch, setLocalSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);

  const categories = ["Silk", "Cotton", "Wool", "Polyester", "Christmas Edition"];
  const RECENT_KEY = "greyexim_recent_searches";
  const TREND_KEY = "greyexim_search_counts";

  /* ✅ FETCH PRODUCTS */
 useEffect(() => {
  const fetchProducts = async () => {
    const res = await fetch("/api/products", { cache: "no-store" });
    const data = await res.json();

    console.log("RAW API DATA 👉", data); // 👈 ADD THIS

    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  fetchProducts();
}, []);


  /* ✅ SYNC SEARCH PARAM */
  useEffect(() => {
    setLocalSearch(searchParams.get("q") || "");
  }, [searchParams]);

  const fuse = useMemo(() => {
    return new Fuse(products, {
      keys: ["designName", "designCode", "category"],
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, [products]);

  const getPrice = (p: Product) => p.price ?? p.variants?.[0]?.price ?? 0;

  const filteredProducts = useMemo(() => {
    let list = products;

    if (localSearch) {
      const hits = fuse.search(localSearch);
      list = hits.map((h) => h.item);
    }

    if (selectedCategory !== "All") {
      list = list.filter(
        (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    return list;
  }, [products, fuse, localSearch, selectedCategory]);

  const updateSearchStats = (term: string) => {
    if (!term) return;
    const clean = term.trim().toLowerCase();
    if (!clean) return;

    const recentRaw = localStorage.getItem(RECENT_KEY);
    const recent = recentRaw ? JSON.parse(recentRaw) : [];
    const nextRecent = Array.isArray(recent)
      ? [clean, ...recent.filter((t: string) => t !== clean)].slice(0, 6)
      : [clean];
    localStorage.setItem(RECENT_KEY, JSON.stringify(nextRecent));

    const trendRaw = localStorage.getItem(TREND_KEY);
    const trend = trendRaw ? JSON.parse(trendRaw) : {};
    const nextTrend = typeof trend === "object" && trend ? trend : {};
    nextTrend[clean] = (nextTrend[clean] || 0) + 1;
    localStorage.setItem(TREND_KEY, JSON.stringify(nextTrend));
  };

  const submitSearch = (value?: string) => {
    const term = (value ?? localSearch).trim();
    setLocalSearch(term);
    updateSearchStats(term);
    const params = new URLSearchParams();
    if (term) params.set("q", term);
    if (selectedCategory && selectedCategory !== "All") params.set("cat", selectedCategory);
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <main className="bg-white min-h-screen pb-44 font-sans text-gray-900">
      {/* ================= MOBILE VIEW ================= */}
      <div className="md:hidden">
        {/* Header + Categories */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100 py-6 px-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mb-2">
            Boutique Collection
          </p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Shop
          </h1>

          <div className="mt-5">
            <div className="relative">
              <input
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch();
                }}
                placeholder="Search designs, codes, categories..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-black"
              />
            </div>

          </div>

          <div
            className="
              flex gap-3 mt-6 pb-1
              overflow-x-auto overflow-y-hidden
              [-ms-overflow-style:none]
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            {["All", ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedCategory === cat
                    ? "bg-black text-white shadow-xl scale-105"
                    : "bg-gray-50 text-gray-400 border border-gray-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="p-5 grid grid-cols-2 gap-5">
          {loading ? (
            <div className="col-span-2 text-center py-20 text-xs font-black uppercase tracking-widest text-gray-300 animate-pulse">
              Loading Collection...
            </div>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <Link
                href={`/products/${product._id}`}
                key={product._id}
                className="block group"
              >
                <div className="aspect-[3/4] rounded-[40px] overflow-hidden bg-gray-50 border border-gray-100 relative shadow-sm">
                  <img
                    src={product.images?.[0]}
                    alt={product.designName}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>

                <div className="mt-3 px-2">
                  <h3 className="text-[11px] font-black uppercase text-black truncate">
                    {product.designName}
                  </h3>
                    <p className="text-[10px] font-bold text-gray-400 italic">
                      ₹{product.price ?? product.variants?.[0]?.price ?? "N/A"}
                    </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-2 py-20 text-center">
              <p className="text-xs font-black uppercase text-gray-300 tracking-widest">
                No designs found for "{localSearch}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ================= DESKTOP VIEW ================= */}
      <div className="hidden md:block max-w-7xl mx-auto px-10 py-20">
        <h1 className="text-9xl font-black uppercase italic tracking-tighter mb-20">
          Collection
        </h1>

        <div className="flex gap-4 items-center mb-10">
          <div className="flex-1 relative">
            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
              }}
              placeholder="Search designs, codes, categories..."
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <button
            onClick={() => submitSearch()}
            className="bg-black text-white px-6 py-4 rounded-2xl font-black uppercase text-xs"
          >
            Search
          </button>
        </div>

        <div className="grid grid-cols-4 gap-12">
          {filteredProducts.map((p) => (
            <Link href={`/products/${p._id}`} key={p._id} className="group">
              <div className="aspect-[3/4] rounded-[60px] overflow-hidden bg-gray-100 mb-6">
                <img
                  src={p.images?.[0]}
                  alt={p.designName}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                />
              </div>
              <h3 className="font-black text-xl uppercase">
                {p.designName}
              </h3>
              <p className="text-blue-600 font-black italic">
                ₹{getPrice(p) || "N/A"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest italic animate-pulse">
          Loading Grey Exim...
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
