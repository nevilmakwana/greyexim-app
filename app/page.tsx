"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Product {
  _id: string;
  designName: string;
  designCode: string;
  images: string[];
  price: number;
}

interface HeroSlide {
  _id: string;
  image: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const { addToCart } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  const WISHLIST_KEY = "greyexim_wishlist";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const text = await res.text();

        if (!text) {
          setProducts([]);
          return;
        }

        const data = JSON.parse(text);
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch("/api/hero-slides");
        const data = await res.json();
        setSlides(Array.isArray(data) ? data : []);
      } catch {
        setSlides([]);
      }
    };
    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  const handleWishlist = async (productId: string) => {
    if (!productId) return;

    if (status !== "authenticated" || !session?.user?.email) {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(WISHLIST_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const next = Array.isArray(list) ? list : [];
        if (!next.includes(productId)) {
          next.push(productId);
          localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
        }
        window.dispatchEvent(new Event("wishlist-updated"));
      }
      return;
    }

    try {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          productId,
        }),
      });
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (err) {
      console.error("Failed to add to wishlist", err);
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  return (
    <main className="bg-gradient-to-b from-gray-50 via-white to-white min-h-screen pb-24">
      {/* HERO CAROUSEL */}
      <section className="md:hidden relative h-[72vh] bg-gray-900 flex items-end px-6 pb-12 overflow-hidden">
        {slides.length > 0 && (
          <div className="absolute inset-0">
            {slides.map((slide, index) => (
              <img
                key={slide._id || index}
                src={slide.image}
                alt={slide.title || "Hero"}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  index === activeSlide ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </div>
        )}

        <div className="relative z-10 max-w-md">
          <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase font-black text-white/80 mb-3">
            Boutique Collection
            <span className="w-6 h-[2px] bg-white/50 rounded-full" />
          </span>
          <h1 className="text-4xl font-extrabold text-white leading-tight drop-shadow">
            {slides[activeSlide]?.title || "Premium Digital Scarves"}
          </h1>
          <p className="text-gray-300 text-sm mt-2 mb-6">
            {slides[activeSlide]?.subtitle || "Crafted for global export quality"}
          </p>
          <Link
            href={slides[activeSlide]?.ctaLink || "/shop"}
            className="block bg-white text-black text-center font-black py-3 rounded-xl shadow-lg"
          >
            {slides[activeSlide]?.ctaText || "Shop Collection"}
          </Link>
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-4 left-6 right-6 flex gap-2 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeSlide ? "bg-white w-8" : "bg-white/40 w-4"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="hidden md:block relative h-[640px] bg-gray-900 text-white overflow-hidden">
        {slides.length > 0 && (
          <div className="absolute inset-0">
            {slides.map((slide, index) => (
              <img
                key={slide._id || index}
                src={slide.image}
                alt={slide.title || "Hero"}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  index === activeSlide ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
          </div>
        )}
        <div className="relative z-10 max-w-5xl mx-auto px-12 pt-20">
          <span className="inline-flex items-center gap-3 text-xs tracking-[0.35em] uppercase font-black text-white/70">
            Boutique Collection
            <span className="w-10 h-[2px] bg-white/40 rounded-full" />
          </span>
          <h1 className="text-7xl font-black mt-6 mb-6 leading-[1.05]">
            {slides[activeSlide]?.title || "Premium Digital Scarves"}
          </h1>
          <p className="text-lg text-gray-200 mb-8 max-w-2xl">
            {slides[activeSlide]?.subtitle || "Crafted for global export quality"}
          </p>
          <Link
            href={slides[activeSlide]?.ctaLink || "/shop"}
            className="inline-flex items-center gap-3 bg-white text-black px-10 py-4 rounded-full font-black shadow-xl"
          >
            {slides[activeSlide]?.ctaText || "Shop Collection"}
            <span className="text-lg">→</span>
          </Link>
        </div>
      </section>

      {/* VALUE STRIP */}
      <section className="px-4 md:px-12 -mt-10 md:-mt-16 relative z-10">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-4 md:p-6 grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Premium Quality", sub: "Export-ready fabrics" },
            { label: "Fast Dispatch", sub: "48–72 hour processing" },
            { label: "Secure Payments", sub: "100% protected" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <p className="text-xs md:text-sm font-black">{item.label}</p>
              <p className="text-[10px] md:text-xs text-gray-500">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 md:px-12 py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-blue-600 font-black">
              Trending Now
            </p>
            <h2 className="text-2xl font-black">Featured Picks</h2>
          </div>
          <Link href="/shop" className="text-blue-600 text-sm font-bold">
            See All
          </Link>
        </div>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.slice(0, 6).map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition"
              >
                <Link href={`/products/${product._id}`}>
                  <div className="h-40 md:h-48 bg-gray-100 relative">
                    <img
                      src={product.images?.[0]}
                      alt={product.designName}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Add to wishlist"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleWishlist(product._id);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 text-gray-900 rounded-full flex items-center justify-center shadow active:scale-95"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-4 h-4"
                      >
                        <path d="M20.8 4.6c-1.7-1.7-4.5-1.7-6.2 0L12 7.2 9.4 4.6C7.7 2.9 4.9 2.9 3.2 4.6c-1.7 1.7-1.7 4.5 0 6.2L12 20.8l8.8-10c1.7-1.7 1.7-4.5 0-6.2z" />
                      </svg>
                    </button>
                  </div>
                </Link>

                <div className="p-3">
                  <h3 className="text-sm font-semibold truncate">{product.designName}</h3>
                  <p className="text-xs text-gray-500">{product.designCode}</p>

                  <div className="flex justify-between items-center mt-2">
                    <span className="font-black">₹{product.price}</span>
                    <button
                      onClick={() => handleAddToCart(product)}
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
      </section>

      {/* CTA STRIP */}
      <section className="px-4 md:px-12 pb-10">
        <div className="bg-black text-white rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-black">
              Trade Ready
            </p>
            <h3 className="text-2xl md:text-3xl font-black mt-2">
              Build your next export collection with GreyExim
            </h3>
            <p className="text-sm text-white/70 mt-2 max-w-xl">
              Curated designs, consistent quality, and fast turnaround for bulk buyers.
            </p>
          </div>
          <Link href="/shop" className="bg-white text-black px-6 py-3 rounded-full font-black">
            Explore Catalog
          </Link>
        </div>
      </section>
    </main>
  );
}
