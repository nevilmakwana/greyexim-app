"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";

type Product = {
  _id: string;
  designName: string;
  designCode?: string;
  category?: string;
  description?: string;
  price?: number;
  images?: string[];
  image?: string;
};

const WISHLIST_KEY = "greyexim_wishlist";

function firstImage(p: Product) {
  return (
    p.image ||
    (Array.isArray(p.images) ? p.images[0] : "") ||
    "/placeholder.jpg"
  );
}

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Product[]>([]);

  const count = items.length;

  const fetchWishlist = async () => {
    setLoading(true);

    try {
      // Logged in => wishlist stored in Mongo and returned with populated productId
      if (session?.user?.email) {
        const res = await fetch(`/api/wishlist?email=${encodeURIComponent(session.user.email)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        const products: Product[] = Array.isArray(data)
          ? data
              .map((row: any) => row?.productId)
              .filter(Boolean)
          : [];
        setItems(products);
        return;
      }

      // Guest => wishlist stored in localStorage as array of product IDs
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(WISHLIST_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const ids = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];

        if (ids.length === 0) {
          setItems([]);
          return;
        }

        const res = await fetch(`/api/products?ids=${encodeURIComponent(ids.join(","))}`, {
          cache: "no-store",
        });
        const products = await res.json();
        setItems(Array.isArray(products) ? products : []);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  useEffect(() => {
    const handler = () => fetchWishlist();
    window.addEventListener("wishlist-updated", handler);
    return () => window.removeEventListener("wishlist-updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  const removeFromWishlist = async (productId: string) => {
    if (!productId) return;

    // Optimistic UI
    setItems((prev) => prev.filter((p) => p._id !== productId));

    if (!session?.user?.email) {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(WISHLIST_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const ids = Array.isArray(parsed) ? parsed : [];
        const next = ids.filter((id: any) => id !== productId);
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event("wishlist-updated"));
      }
      return;
    }

    try {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email, productId }),
      });
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch {
      // If delete fails, refetch to restore truth
      fetchWishlist();
    }
  };

  const showLoginCta = useMemo(() => status !== "authenticated", [status]);

  return (
    <main className="min-h-screen pb-28 bg-gradient-to-b from-gray-50 via-white to-white text-gray-900">
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-8">
        <header className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-blue-600 font-black mb-2">
              Saved Items
            </p>
            <h1 className="text-3xl font-black uppercase">
              My Wishlist{" "}
              <span className="text-gray-300 font-black">({count})</span>
            </h1>
            {showLoginCta && (
              <p className="text-xs text-gray-500 mt-2">
                Login to sync your wishlist across devices.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showLoginCta && (
              <Link
                href="/login?callbackUrl=/wishlist"
                className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-900 text-[11px] font-black uppercase tracking-widest"
              >
                Login
              </Link>
            )}
          </div>
        </header>

        {loading ? (
          <div className="py-20 text-center text-gray-500">Loading wishlist…</div>
        ) : count === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center">
            <h2 className="text-lg font-black uppercase">Your Wishlist Is Empty</h2>
            <p className="text-sm text-gray-500 mt-2">
              Save designs you love and buy them later.
            </p>
            <Link
              href="/shop"
              className="inline-flex mt-6 bg-black text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition"
              >
                <Link href={`/products/${product._id}`}>
                  <div className="h-40 md:h-48 bg-gray-100 relative">
                    <img
                      src={firstImage(product)}
                      alt={product.designName || "Product"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    <button
                      type="button"
                      aria-label="Remove from wishlist"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFromWishlist(product._id);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 text-red-500 rounded-full flex items-center justify-center shadow active:scale-95"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                  </div>
                </Link>

                <div className="p-3">
                  <h3 className="text-sm font-semibold truncate">
                    {product.designName}
                  </h3>
                  {product.designCode && (
                    <p className="text-xs text-gray-500">{product.designCode}</p>
                  )}

                  <div className="flex justify-between items-center mt-2">
                    <span className="font-black">
                      ₹{Number(product.price || 0)}
                    </span>
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      className="text-xs bg-black text-white px-3 py-1 rounded-full font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
