"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useCart } from "app/context/CartContext";

export default function CartPage() {
  const { cart, cartCount, increaseQty, decreaseQty, removeFromCart, cartTotal } = useCart();
  const rupee = "\u20B9";

  // Promo code (UI-first; can be backed by an API later)
  const [promoCode, setPromoCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [promoMsg, setPromoMsg] = useState<string | null>(null);

  const promoDiscount = useMemo(() => {
    if (!appliedCode) return 0;

    const code = appliedCode.trim().toUpperCase();
    if (code === "GREY10") {
      // 10% off (cap 500)
      return Math.min(Math.round(cartTotal * 0.1), 500);
    }
    if (code === "WELCOME50") {
      // Flat 50 off
      return Math.min(50, cartTotal);
    }
    return 0;
  }, [appliedCode, cartTotal]);

  const shippingEst = useMemo(() => 0, []); // TODO: compute by country/weight/pincode later
  const taxEst = useMemo(() => 0, []); // TODO: compute by destination later

  const estimatedTotal = useMemo(() => {
    return Math.max(cartTotal + shippingEst + taxEst - promoDiscount, 0);
  }, [cartTotal, shippingEst, taxEst, promoDiscount]);

  // Delivery ETA (client-only to avoid SSR locale/date mismatches)
  const [etaRange, setEtaRange] = useState<string | null>(null);
  useEffect(() => {
    try {
      const now = new Date();
      const min = new Date(now);
      min.setDate(now.getDate() + 3);
      const max = new Date(now);
      max.setDate(now.getDate() + 7);
      const fmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
      setEtaRange(`${fmt.format(min)} - ${fmt.format(max)}`);
    } catch {
      setEtaRange("3-7 business days");
    }
  }, []);

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === "GREY10" || code === "WELCOME50") {
      setAppliedCode(code);
      setPromoCode(code);
      setPromoMsg(`Applied ${code}`);
      return;
    }

    setAppliedCode(null);
    setPromoMsg("Promo code not recognized. Try GREY10 or WELCOME50.");
  };

  const handleClearPromo = () => {
    setAppliedCode(null);
    setPromoCode("");
    setPromoMsg(null);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 pb-32">
        <h2 className="text-2xl font-black uppercase text-gray-300 mb-4">Your Bag is Empty</h2>
        <Link href="/shop" className="bg-black text-white px-8 py-3 rounded-full font-bold uppercase text-xs">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-6 px-4 pb-32 md:pt-20 md:px-20">
      <h1 className="text-3xl font-black uppercase italic mb-8">Shopping Bag ({cartCount})</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-6">
          {cart.map((item) => {
            const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);

            return (
              <div key={item._id} className="flex gap-4 border-b border-gray-100 pb-6">
                <div className="w-24 h-32 bg-gray-50 rounded-xl overflow-hidden relative flex-shrink-0">
                  <img src={item.image} alt={item.designName} className="w-full h-full object-cover" />
                </div>

                <div className="flex-grow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black uppercase text-sm">{item.designName}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{item.designCode}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item._id)}
                      className="text-red-500 text-[10px] font-black uppercase"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center rounded-full border border-gray-200 bg-white shadow-sm overflow-hidden">
                        <button
                          type="button"
                          onClick={() => decreaseQty(item._id)}
                          aria-label={`Decrease quantity of ${item.designName}`}
                          className="w-9 h-9 grid place-items-center text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-sm font-black">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => increaseQty(item._id)}
                          aria-label={`Increase quantity of ${item.designName}`}
                          className="w-9 h-9 grid place-items-center text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                        {rupee}
                        {item.price} each
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black">
                        {rupee}
                        {lineTotal}
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Item total</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-6 rounded-[30px] h-fit border border-gray-100">
          <h3 className="font-black uppercase text-sm mb-4">Order Summary</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Items</span>
              <span className="font-black">{cartCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-black">
                {rupee}
                {cartTotal}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Shipping (est.)</span>
              <span className="font-black">{shippingEst === 0 ? "Free" : `${rupee}${shippingEst}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tax (est.)</span>
              <span className="font-black">{taxEst === 0 ? "Included" : `${rupee}${taxEst}`}</span>
            </div>

            {promoDiscount > 0 ? (
              <div className="flex justify-between">
                <span className="text-gray-500">Discount{appliedCode ? ` (${appliedCode})` : ""}</span>
                <span className="font-black text-green-700">
                  -{rupee}
                  {promoDiscount}
                </span>
              </div>
            ) : null}

            <div className="pt-2 border-t border-gray-200 flex justify-between">
              <span className="text-gray-800 font-black">Estimated total</span>
              <span className="text-gray-900 font-black">
                {rupee}
                {estimatedTotal}
              </span>
            </div>
          </div>

          {/* Delivery ETA */}
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Delivery ETA</p>
                <p className="text-sm font-black text-gray-900">{etaRange ?? "3-7 business days"}</p>
              </div>
              <span className="shrink-0 rounded-full bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                Secure
              </span>
            </div>
            <p className="mt-1 text-[10px] font-semibold text-gray-500">Final delivery time updates after address at checkout.</p>
          </div>

          {/* Promo code (collapsed) */}
          <details className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden group">
            <summary className="list-none cursor-pointer px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Promo code</p>
                <p className="text-sm font-black text-gray-900 truncate">
                  {appliedCode ? `${appliedCode} applied` : "Add a code (optional)"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {appliedCode ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleClearPromo();
                    }}
                    aria-label="Remove promo code"
                    className="w-9 h-9 grid place-items-center rounded-full border border-gray-200 text-gray-600 hover:text-black hover:bg-gray-50 active:scale-[0.98] transition"
                  >
                    ×
                  </button>
                ) : null}
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-700 group-open:text-black">Edit</span>
              </div>
            </summary>

            <div className="px-5 pb-5 border-t border-gray-100">
              <div className="pt-4">
                <div className="relative">
                  <input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter promo code"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-24 text-sm font-semibold outline-none focus:border-black focus:ring-2 focus:ring-black/10"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-black text-white px-4 py-2 text-[11px] font-black uppercase tracking-widest hover:bg-gray-900 active:scale-[0.98] transition"
                  >
                    Apply
                  </button>
                </div>

                {promoMsg ? (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className={`text-[11px] font-semibold ${appliedCode ? "text-green-700" : "text-red-600"}`}>{promoMsg}</p>
                    {appliedCode ? (
                      <button
                        type="button"
                        onClick={handleClearPromo}
                        className="text-[10px] font-black uppercase tracking-widest text-gray-700 hover:text-black"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-[10px] font-semibold text-gray-500">
                    Try: <span className="font-black">GREY10</span> or <span className="font-black">WELCOME50</span>
                  </p>
                )}
              </div>
            </div>
          </details>

          <Link href="/checkout" className="block mt-5">
            <button className="w-full bg-blue-600 text-white py-4 rounded-full font-black uppercase text-xs tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
              Proceed to Checkout
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

