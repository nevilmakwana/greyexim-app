"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

  const initialSearch = searchParams.get("q") || "";
  const initialCat = searchParams.get("cat") || "All";

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [localSearch, setLocalSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);

  const categories = ["Silk", "Cotton", "Wool", "Polyester", "Christmas Edition"];

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

  /* ✅ SAFE FILTER LOGIC */
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "All" ||
      p.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch = localSearch
      ? p.designName.toLowerCase().includes(localSearch.toLowerCase()) ||
        p.designCode.toLowerCase().includes(localSearch.toLowerCase())
      : true;

    return matchesCategory && matchesSearch;
  });

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
                ₹{p.price ?? p.variants?.[0]?.price ?? "N/A"}
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
