"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function StickyCheckoutBar() {
  const { cartCount, cartTotal } = useCart();

  // Show only when cart has items
  if (cartCount === 0) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between px-4 py-3">
        
        {/* Total */}
        <div>
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-lg font-bold">₹{cartTotal}</p>
        </div>

        {/* Checkout Button */}
        <Link
          href="/checkout"
          className="bg-black text-white px-6 py-3 rounded-lg text-sm font-semibold active:scale-95 transition"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
