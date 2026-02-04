"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCart } from "app/context/CartContext";

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const { addToCart } = useCart();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const WISHLIST_KEY = "greyexim_wishlist";

  useEffect(() => {
    if (session?.user?.email) {
      fetch(`/api/wishlist?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          setItems(Array.isArray(data) ? data : []);
          setLoading(false);
        });
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
          const products = await res.json();
          const map = new Map(products.map((p: any) => [p._id, p]));
          const merged = ids
            .map((id: string) => map.get(id))
            .filter(Boolean)
            .map((product: any) => ({ _id: product._id, productId: product }));
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

  // Loading State
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white pb-32">
      <p className="font-black uppercase tracking-widest animate-pulse">Loading Collection...</p>
    </div>
  );

  return (
    // ✅ FIX: 'pb-40' added for bottom menu spacing
    <div className="min-h-screen bg-white pt-24 px-6 pb-40 md:pt-32 md:px-20">
      <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-10">
        My Wishlist <span className="text-gray-300">({items.length})</span>
      </h1>

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
          {items.map((item) => (
            <div key={item._id} className="group relative">
              <div className="aspect-[3/4] rounded-[30px] overflow-hidden bg-gray-50 mb-4 border border-gray-100 relative">
                <img 
                  src={item.productId.images?.[0]} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700" 
                  alt={item.productId.designName}
                />
                
                {/* Quick Add Button */}
                <button 
                  onClick={() => addToCart(item.productId)}
                  className="absolute bottom-3 right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                </button>

                <button
                  onClick={async () => {
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
                  }}
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
    </div>
  );
}
