"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCart } from "app/context/CartContext";

type WishlistItem = {
  _id: string;
  productId: {
    _id: string;
    designName: string;
    designCode: string;
    images: string[];
    price: number;
  };
};

type Product = {
  _id: string;
  designName: string;
  designCode: string;
  images: string[];
  price: number;
};

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const { addToCart } = useCart();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [selecting, setSelecting] = useState(false);
  const [sortBy, setSortBy] = useState<"new" | "price_low" | "price_high" | "name">("new");
  const [priceFilter, setPriceFilter] = useState<"all" | "under_500" | "mid" | "above">("all");
  const [trending, setTrending] = useState<Product[]>([]);
  const [recentViewed, setRecentViewed] = useState<Product[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const WISHLIST_KEY = "greyexim_wishlist";
  const RECENT_KEY = "greyexim_recently_viewed";

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetch(`/api/wishlist?email=${session.user.email}`)
        .then((res) => res.json())
        .then((data) => {
          setItems(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      const loadGuest = async () => {
        try {
          const raw = localStorage.getItem(WISHLIST_KEY);
          const list = raw ? JSON.parse(raw) : [];
          const ids = Array.isArray(list) ? list : [];
          if (ids.length === 0) {
            setItems([]);
            setLoading(false);
            return;
          }
          const res = await fetch(`/api/products?ids=${ids.join(",")}`);
          const productsRaw = await res.json();
          const products: Product[] = Array.isArray(productsRaw) ? productsRaw : [];
          const map = new Map<string, Product>(products.map((p) => [p._id, p]));
          const merged = ids
            .map((id: string) => map.get(id))
            .filter((p): p is Product => Boolean(p))
            .map((product) => ({ _id: product._id, productId: product }));
          setItems(merged);
        } catch {
          setItems([]);
        } finally {
          setLoading(false);
        }
      };
      loadGuest();
    }
  }, [session]);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setTrending(list.slice(0, 6));
      } catch {
        setTrending([]);
      }
    };
    loadTrending();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const list = raw ? JSON.parse(raw) : [];
       const ids = Array.isArray(list) ? list.slice(0, 6) : [];
       if (!ids.length) return;
       fetch(`/api/products?ids=${ids.join(",")}`)
         .then((res) => res.json())
         .then((productsRaw) => {
           const products: Product[] = Array.isArray(productsRaw) ? productsRaw : [];
           const map = new Map<string, Product>(products.map((p) => [p._id, p]));
           const merged = ids
             .map((id: string) => map.get(id))
             .filter((p): p is Product => Boolean(p));
           setRecentViewed(merged);
         });
     } catch {
       setRecentViewed([]);
     }
  }, []);

  const filteredItems = useMemo(() => {
    let list = [...items];
    if (priceFilter !== "all") {
      list = list.filter((i) => {
        const price = i.productId?.price ?? 0;
        if (priceFilter === "under_500") return price < 500;
        if (priceFilter === "mid") return price >= 500 && price <= 1500;
        if (priceFilter === "above") return price > 1500;
        return true;
      });
    }

    if (sortBy === "price_low") {
      list.sort((a, b) => (a.productId?.price ?? 0) - (b.productId?.price ?? 0));
    } else if (sortBy === "price_high") {
      list.sort((a, b) => (b.productId?.price ?? 0) - (a.productId?.price ?? 0));
    } else if (sortBy === "name") {
      list.sort((a, b) => a.productId.designName.localeCompare(b.productId.designName));
    }

    return list;
  }, [items, sortBy, priceFilter]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => {
    setSelected(filteredItems.map((i) => i._id));
  };

  const clearSelection = () => {
    setSelected([]);
  };

  const removeItem = async (item: WishlistItem) => {
    if (session?.user?.email) {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          productId: item.productId?._id,
        }),
      });
    } else {
      const raw = localStorage.getItem(WISHLIST_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(list)
        ? list.filter((id: string) => id !== item.productId?._id)
        : [];
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    }
    setItems((prev) => prev.filter((i) => i._id !== item._id));
    window.dispatchEvent(new Event("wishlist-updated"));
  };

  const bulkRemove = async () => {
    const targets = items.filter((i) => selected.includes(i._id));
    for (const item of targets) {
      await removeItem(item);
    }
    setSelecting(false);
    clearSelection();
    showToast("Removed selected items");
  };

  const bulkAddToCart = () => {
    const targets = items.filter((i) => selected.includes(i._id));
    targets.forEach((item) => addToCart(item.productId));
    setSelecting(false);
    clearSelection();
    showToast("Added to cart");
  };

  const shareWishlist = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const lines = items.map((i) => `${i.productId.designName} - ${origin}/products/${i.productId._id}`);
    const text = `GreyExim Wishlist (${items.length})\n\n${lines.join("\n")}`;
    if (navigator.share) {
      await navigator.share({ title: "GreyExim Wishlist", text });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      showToast("Wishlist copied");
    } else {
      showToast("Share not supported");
    }
  };

  const shareWhatsApp = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const lines = items.map((i) => `${i.productId.designName} - ${origin}/products/${i.productId._id}`);
    const text = `GreyExim Wishlist (${items.length})\n\n${lines.join("\n")}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const addAllToCart = () => {
    items.forEach((item) => addToCart(item.productId));
    showToast("All items added to cart");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white pb-32">
      <p className="font-black uppercase tracking-widest animate-pulse">Loading Collection...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pt-24 px-6 pb-40 md:pt-32 md:px-20">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-blue-600 font-black mb-2">
              Saved Items
            </p>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">
              My Wishlist <span className="text-gray-300">({items.length})</span>
            </h1>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={shareWhatsApp}
                className="text-[10px] uppercase tracking-widest font-black text-green-700 bg-green-50 border border-green-100 px-3 py-2 rounded-full"
              >
                WhatsApp
              </button>
              <button
                onClick={shareWishlist}
                className="text-[10px] uppercase tracking-widest font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-2 rounded-full"
              >
                Share
              </button>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <div className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
                Quick Action
              </div>
              <button
                onClick={addAllToCart}
                className="text-[10px] uppercase tracking-widest font-black text-white bg-black px-4 py-2 rounded-full"
              >
                Add All to Cart
              </button>
            </div>
          </div>
        )}

      {items.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setSelecting((v) => !v)}
              className="text-[10px] uppercase tracking-widest font-black text-gray-900 bg-gray-100 border border-gray-200 px-3 py-2 rounded-full"
            >
              {selecting ? "Done" : "Select"}
            </button>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
              Sort
            </div>
            <select
              className="text-xs border border-gray-200 rounded-full px-3 py-1"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="new">Newest</option>
              <option value="price_low">Price: Low</option>
              <option value="price_high">Price: High</option>
              <option value="name">Name: A-Z</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: "all", label: "All" },
              { id: "under_500", label: "Under ₹500" },
              { id: "mid", label: "₹500-₹1500" },
              { id: "above", label: "Above ₹1500" },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setPriceFilter(chip.id as any)}
                className={`text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full border ${
                  priceFilter === chip.id
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {selecting && (
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="text-[10px] uppercase tracking-widest font-black text-gray-900 bg-gray-100 border border-gray-200 px-3 py-2 rounded-full"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="text-[10px] uppercase tracking-widest font-black text-gray-400 bg-white border border-gray-200 px-3 py-2 rounded-full"
              >
                Clear
              </button>
              <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">
                Use bottom bar
              </span>
            </div>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-gray-50 p-12 rounded-[40px] text-center border-2 border-dashed border-gray-100 flex flex-col items-center gap-6">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No saved designs yet.</p>
          <Link href="/shop" className="bg-white border border-gray-200 px-6 py-2 rounded-full font-bold text-[10px] uppercase hover:bg-black hover:text-white transition">
            Browse Shop
          </Link>
          {status !== "authenticated" && (
            <Link href="/login" className="bg-black text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs">
              Login to Sync
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item._id} className="group relative">
              <div className="aspect-[3/4] rounded-[30px] overflow-hidden bg-gray-50 mb-4 border border-gray-100 relative">
                <img
                  src={item.productId.images?.[0]}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                  alt={item.productId.designName}
                />

                {selecting && (
                  <button
                    onClick={() => toggleSelect(item._id)}
                    className={`absolute top-3 left-3 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-black ${
                      selected.includes(item._id)
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    {selected.includes(item._id) ? "✓" : ""}
                  </button>
                )}

                <button
                  onClick={() => addToCart(item.productId)}
                  className="absolute bottom-3 right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                </button>

                <button
                  onClick={() => removeItem(item)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 text-red-600 rounded-full flex items-center justify-center shadow active:scale-90 transition"
                  aria-label="Remove from wishlist"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M12 21s-6.716-4.245-9.428-7.306C.824 11.404.2 9.5.2 7.9.2 5.236 2.336 3 5 3c1.77 0 3.41.885 4.5 2.309C10.59 3.885 12.23 3 14 3c2.664 0 4.8 2.236 4.8 4.9 0 1.6-.624 3.504-2.372 5.794C18.716 16.755 12 21 12 21z" />
                  </svg>
                </button>
              </div>

              <h3 className="font-black text-sm uppercase leading-none mb-1">{item.productId.designName}</h3>
              <p className="text-gray-400 font-bold text-[10px]">₹{item.productId.price}</p>
            </div>
          ))}
        </div>
      )}

      {recentViewed.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black uppercase tracking-widest">Recently Viewed</h2>
            <Link href="/shop" className="text-blue-600 text-sm font-bold">
              See All
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {recentViewed.map((product) => (
              <Link key={product._id} href={`/products/${product._id}`} className="block">
                <div className="aspect-[3/4] rounded-[24px] overflow-hidden bg-gray-50 border border-gray-100">
                  <img src={product.images?.[0]} className="w-full h-full object-cover" alt={product.designName} />
                </div>
                <p className="mt-2 text-xs font-bold truncate">{product.designName}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {trending.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black uppercase tracking-widest">Trending</h2>
            <Link href="/shop" className="text-blue-600 text-sm font-bold">
              See All
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {trending.map((product) => (
              <Link key={product._id} href={`/products/${product._id}`} className="block">
                <div className="aspect-[3/4] rounded-[24px] overflow-hidden bg-gray-50 border border-gray-100">
                  <img src={product.images?.[0]} className="w-full h-full object-cover" alt={product.designName} />
                </div>
                <p className="mt-2 text-xs font-bold truncate">{product.designName}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-4 right-4 bottom-24 bg-black text-white text-xs font-black uppercase tracking-widest py-3 rounded-2xl text-center shadow-2xl">
          {toast}
        </div>
      )}

      {selecting && (
        <div className="fixed left-4 right-4 bottom-24 z-40 bg-white border border-gray-200 rounded-2xl shadow-xl px-4 py-3 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest font-black text-gray-500">
            {selected.length} selected
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={bulkAddToCart}
              disabled={selected.length === 0}
              className="text-[10px] uppercase tracking-widest font-black text-white bg-black px-3 py-2 rounded-full disabled:opacity-40"
            >
              Move to Cart
            </button>
            <button
              onClick={bulkRemove}
              disabled={selected.length === 0}
              className="text-[10px] uppercase tracking-widest font-black text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-full disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
