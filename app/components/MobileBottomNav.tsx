"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useSession } from "next-auth/react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cartCount, setIsCartOpen } = useCart();
  const { data: session } = useSession();

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlistCount, setWishlistCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const WISHLIST_KEY = "greyexim_wishlist";

  // Sync URL search
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  // Autofocus (iOS safe)
  useEffect(() => {
    if (isSearching) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isSearching]);

  const loadWishlistCount = async () => {
    if (!session?.user?.email) {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(WISHLIST_KEY);
        const list = raw ? JSON.parse(raw) : [];
        setWishlistCount(Array.isArray(list) ? list.length : 0);
      } else {
        setWishlistCount(0);
      }
      return;
    }
    try {
      const res = await fetch(`/api/wishlist?email=${session.user.email}`);
      const data = await res.json();
      setWishlistCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    loadWishlistCount();
  }, [session]);

  useEffect(() => {
    const handler = () => loadWishlistCount();
    window.addEventListener("wishlist-updated", handler);
    return () => window.removeEventListener("wishlist-updated", handler);
  }, [session]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(searchQuery)}`);
    setIsSearching(false);
  };

  const closeSearch = () => {
    setIsSearching(false);
    setSearchQuery("");
    if (pathname.startsWith("/shop")) router.push("/shop");
  };

  const isActive = (path?: string) =>
    path && (pathname === path || pathname.startsWith(path + "/"));

  const goToCart = () => {
    // Close drawer state (in case it was open from a previous session) and go to cart page.
    setIsCartOpen(false);
    router.push("/cart");
  };

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-[999999]">
      <div
        className={`
          relative
          bg-white/95 backdrop-blur-xl
          border border-gray-200/60
          shadow-[0_8px_30px_rgba(0,0,0,0.15)]
          rounded-[35px]
          transition-all duration-300
          ${isSearching ? "h-[64px]" : "h-[70px]"}
        `}
      >
        {/* ================= SEARCH MODE (APPLE STYLE) ================= */}
        {isSearching && (
          <form
            onSubmit={submitSearch}
            className="absolute inset-0 flex items-center gap-3 px-4"
          >
            <SearchIcon className="text-gray-400 w-4 h-4" />

            <input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search collection…"
              inputMode="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="
                w-full
                bg-transparent
                text-[16px]
                font-medium
                outline-none
                text-black
                placeholder:text-gray-400
              "
            />

            <button
              type="button"
              onClick={closeSearch}
              className="text-gray-500 text-lg px-1"
            >
              ✕
            </button>
          </form>
        )}

        {/* ================= NORMAL NAV ================= */}
        {!isSearching && (
          <div className="absolute inset-0 px-2 flex justify-around items-center">
            <Link href="/" className="w-14 flex flex-col items-center">
              <HomeIcon className={isActive("/") ? "text-black" : "text-gray-400"} />
            </Link>

            <button
              onClick={() => setIsSearching(true)}
              className="w-14 flex flex-col items-center text-gray-400"
            >
              <SearchIcon />
            </button>

            <Link href="/wishlist" className="w-14 flex flex-col items-center">
              <HeartIcon
                className={isActive("/wishlist") ? "text-black" : "text-gray-400"}
                count={wishlistCount}
              />
            </Link>

              <Link
                href={session ? "/profile" : "/login"}
                className="w-14 flex flex-col items-center"
              >
                <UserIcon className={isActive("/profile") ? "text-black" : "text-gray-400"} />
              </Link>

              <button onClick={goToCart} className="w-14 flex flex-col items-center">
                <BagIcon count={cartCount} className={isActive("/cart") ? "text-black" : "text-gray-400"} />
              </button>
            </div>
          )}
        </div>
      </div>
  );
}

/* ================= ICONS ================= */
const HomeIcon = ({ className = "" }) => (
  <svg className={className} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const SearchIcon = ({ className = "" }) => (
  <svg className={className} width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const HeartIcon = ({ className = "", count = 0 }: { className?: string; count?: number }) => (
  <div className="relative">
    <svg className={className} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
    {count > 0 && (
      <span className="absolute -top-2 -right-2 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
        {count}
      </span>
    )}
  </div>
);

const UserIcon = ({ className = "" }) => (
  <svg className={className} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BagIcon = ({ count, className = "" }: { count: number; className?: string }) => (
  <div className="relative">
    <svg className={className} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
    {count > 0 && (
      <span className="absolute -top-2 -right-2 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
        {count}
      </span>
    )}
  </div>
);
