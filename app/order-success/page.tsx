"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function OrderSuccessPage() {
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Local storage ya URL params se last order ID nikal sakte hain
    const lastOrder = localStorage.getItem("lastOrderId");
    if (lastOrder) setOrderId(lastOrder);
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
      <div className="max-w-2xl w-full text-center">
        
        {/* Success Icon */}
        <div className="mb-10 inline-flex items-center justify-center w-24 h-24 bg-green-50 rounded-full shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12 text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-black uppercase tracking-tighter mb-6">
          Order Confirmed
        </h1>
        
        <p className="text-gray-500 font-bold text-lg mb-12 max-w-lg mx-auto leading-relaxed uppercase tracking-tight">
          Aapka design humein mil gaya hai. Ab hum **RFD Fabric** sourcing aur **Digital Printing** ki taiyari shuru kar rahe hain.
        </p>

        {/* Order ID Box */}
        <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100 mb-12 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Transaction ID</p>
          <p className="text-2xl font-black text-black font-mono">#{orderId || "GX-99283-ORD"}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/track-order" 
            className="bg-black text-white px-10 py-5 rounded-full font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-gray-800 transition active:scale-95"
          >
            Track Status Live
          </Link>
          <Link 
            href="/products" 
            className="bg-white text-black border-2 border-gray-100 px-10 py-5 rounded-full font-black uppercase text-xs tracking-[0.2em] hover:bg-gray-50 transition"
          >
            Explore More Designs
          </Link>
        </div>

        {/* Logistics Note */}
        <div className="mt-16 flex items-center justify-center gap-2">
          <div className="h-1 w-12 bg-gray-100 rounded-full" />
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
            Export Grade Quality Guaranteed
          </p>
          <div className="h-1 w-12 bg-gray-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}