"use client";

import { useCart } from "@/context/CartContext";
import { useState, useEffect, use } from "react";
import Image from "next/image";

interface Product {
  _id: string;
  designName: string;
  price: number;
  images: string[];
  designCode: string;
  description: string;
}

export default function ProductDetails({ params }: { params: Promise<{ id: string }> }) {
  // ✅ Next.js 15+ mein params ko 'use' hook se unwrap karna hota hai
  const { id } = use(params);
  
  // ✅ Cart Context se addToCart function nikalna
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Database se product fetch karna
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setProduct(data);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-black font-black uppercase tracking-[0.4em] animate-pulse italic">
          Loading Design...
        </p>
      </div>
    );
  }

  if (!product) {
    return <div className="p-20 text-center font-black uppercase">Product Not Found</div>;
  }

  return (
    <div className="min-h-screen bg-white p-6 md:p-20 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        
        {/* Left: Product Image */}
        <div className="relative aspect-[3/4] rounded-[50px] overflow-hidden bg-gray-50 border border-gray-100 shadow-2xl group">
          <img 
            src={product.images?.[0] || "/placeholder.jpg"} 
            alt={product.designName}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
          />
        </div>

        {/* Right: Product Details */}
        <div className="flex flex-col gap-8">
          <div>
            <span className="text-blue-600 font-black text-xs uppercase tracking-[0.3em]">
              Premium Collection • {product.designCode}
            </span>
            <h1 className="text-7xl font-black text-black uppercase tracking-tighter mt-4 leading-none">
              {product.designName}
            </h1>
          </div>

          <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100">
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-2">Export Value</p>
            <p className="text-5xl font-black text-black italic tracking-tighter">
              ₹{product.price.toLocaleString()}
            </p>
          </div>

          <p className="text-gray-500 font-medium text-lg leading-relaxed">
            {product.description || "A masterfully crafted digital printed scarf featuring high-definition patterns and premium fabric finish, perfect for global exports."}
          </p>

          {/* ✅ Add to Cart Button */}
          <button 
            onClick={() => {
              console.log("Adding to collection:", product);
              addToCart(product);
            }}
            className="w-full bg-black text-white py-8 rounded-[30px] font-black text-xl uppercase tracking-[0.2em] hover:bg-gray-800 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4"
          >
            Add to Collection
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>

          {/* Manufacturing Info Tags */}
          <div className="grid grid-cols-2 gap-4 mt-4">
             <div className="p-4 border border-gray-100 rounded-2xl flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-widest">Ready to Print</span>
             </div>
             <div className="p-4 border border-gray-100 rounded-2xl flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Express Shipping Available</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}