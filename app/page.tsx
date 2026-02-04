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
    <main className="bg-white min-h-screen pb-20">
      {/* HERO CAROUSEL */}
      <section className="md:hidden relative h-[70vh] bg-gray-900 flex items-end px-6 pb-12 overflow-hidden">
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
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded mb-2 inline-block">
            New Arrival
          </span>
          <h1 className="text-4xl font-extrabold text-white leading-tight">
            {slides[activeSlide]?.title || "Premium Digital Scarves"}
          </h1>
          <p className="text-gray-300 text-sm mt-2 mb-6">
            {slides[activeSlide]?.subtitle || "Crafted for global export quality"}
          </p>
          <Link
            href={slides[activeSlide]?.ctaLink || "/shop"}
            className="block bg-white text-black text-center font-bold py-3 rounded-lg"
          >
            {slides[activeSlide]?.ctaText || "Shop Collection"}
          </Link>
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-2 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`w-2.5 h-2.5 rounded-full ${i === activeSlide ? "bg-white" : "bg-white/40"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="hidden md:block relative h-[600px] bg-gray-900 flex items-center justify-center text-white overflow-hidden">
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
            <div className="absolute inset-0 bg-black/50" />
          </div>
        )}
        <div className="relative z-10 text-center max-w-4xl">
          <h1 className="text-7xl font-bold mb-6">
            {slides[activeSlide]?.title || "Premium Digital Scarves"}
          </h1>
          <p className="text-lg text-gray-200 mb-8">
            {slides[activeSlide]?.subtitle || "Crafted for global export quality"}
          </p>
          <Link
            href={slides[activeSlide]?.ctaLink || "/shop"}
            className="bg-white text-black px-10 py-4 rounded-full font-bold"
          >
            {slides[activeSlide]?.ctaText || "Shop Collection"}
          </Link>
        </div>
      </section>

      <section className="px-4 py-6 bg-gray-50">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Trending</h2>
          <Link href="/shop" className="text-blue-600 text-sm">
            See All
          </Link>
        </div>

        {loading ? (
          <p className="text-center">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 6).map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-xl border shadow-sm overflow-hidden"
              >
                <Link href={`/products/${product._id}`}>
                  <div className="h-40 bg-gray-200 relative">
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
                  <h3 className="text-sm font-semibold truncate">
                    {product.designName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {product.designCode}
                  </p>

                  <div className="flex justify-between items-center mt-2">
                    <span className="font-bold">₹{product.price}</span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="text-xs bg-black text-white px-3 py-1 rounded"
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
    </main>
  );
}
