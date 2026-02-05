"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";

type CartItem = {
  _id: string;
  designName?: string;
  designCode?: string;
  price?: number;
  quantity?: number;
  images?: string[];
};

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(true);
  const [didAutoCollapse, setDidAutoCollapse] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    phone: "",
    country: "India",
  });

  const itemCount = useMemo(() => {
    return (cart as CartItem[]).reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cart]);

  const addressComplete = Boolean(
    formData.firstName.trim() &&
      formData.address.trim() &&
      formData.city.trim() &&
      formData.zip.trim() &&
      formData.phone.trim()
  );

  const canPlaceOrder = Boolean(session?.user?.email) && cart.length > 0 && addressComplete && !loading;

  const inputClass =
    "w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";
  const labelClass =
    "block text-[10px] font-black text-gray-500 uppercase tracking-[0.22em] mb-2 ml-1";

  // Auth gate (checkout requires a session in this build)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
      return;
    }
    if (session?.user?.email) {
      setFormData((prev) => ({ ...prev, email: session.user.email || "" }));
    }
  }, [status, session, router]);

  // Prefill from saved profile (fast checkout)
  useEffect(() => {
    if (prefilledFromProfile) return;
    if (status !== "authenticated" || !session?.user?.email) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/user/account", { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();
        if (cancelled) return;

        setFormData((prev) => {
          const fullName = typeof data?.name === "string" ? data.name.trim() : "";
          const parts = fullName ? fullName.split(/\s+/) : [];
          const firstFromName = parts[0] || "";
          const lastFromName = parts.slice(1).join(" ");

          return {
            ...prev,
            email: prev.email || session.user?.email || "",
            firstName: prev.firstName || firstFromName,
            lastName: prev.lastName || lastFromName,
            address: prev.address || (data?.address ?? ""),
            city: prev.city || (data?.city ?? ""),
            zip: prev.zip || (data?.pincode ?? ""),
            phone: prev.phone || (data?.phone ?? ""),
            country: prev.country || (data?.country ?? "India"),
          };
        });

        setPrefilledFromProfile(true);
      } catch {
        // If profile can't be loaded, user can still type manually.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [prefilledFromProfile, status, session?.user?.email]);

  // Auto-collapse address form if profile already has complete details (big brand feel)
  useEffect(() => {
    if (didAutoCollapse) return;
    if (!prefilledFromProfile) return;
    if (!addressComplete) return;
    setShowAddressForm(false);
    setDidAutoCollapse(true);
  }, [didAutoCollapse, prefilledFromProfile, addressComplete]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPlaceOrder) return;
    setLoading(true);

    const orderData = {
      user: session?.user?.email,
      customerName: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      pincode: formData.zip,
      country: formData.country,
      cartItems: (cart as CartItem[]).map((item) => ({
        product: item._id,
        designName: item.designName || "Unnamed Design",
        designCode: item.designCode || "N/A",
        price: Number(item.price) || 0,
        quantity: item.quantity || 1,
        image: item.images?.[0] || "",
      })),
      totalAmount: cartTotal,
      status: "Received",
      paymentMethod: "COD",
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        clearCart();
        router.push("/order-success");
      } else {
        alert("Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="p-20 text-center font-black uppercase italic animate-pulse">
        Securing session...
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-4xl font-black text-black uppercase mb-4">Your bag is empty</h2>
        <Link
          href="/shop"
          className="bg-black text-white px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest"
        >
          Explore collection
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans pb-44 md:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-10">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
              Secure checkout
            </p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
              Checkout
            </h1>
            <p className="mt-1 text-xs text-gray-500 font-semibold">
              Fast order flow. Minimal steps. Easy to review.
            </p>
          </div>
          <Link
            href="/cart"
            className="shrink-0 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-800 shadow-sm hover:bg-gray-50 transition"
          >
            Back to cart
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* SUMMARY (mobile first) */}
          <aside className="order-1 lg:order-2 lg:col-span-5 lg:sticky lg:top-20 h-fit">
            {/* Mobile accordion */}
            <div className="lg:hidden rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <details className="group">
                <summary className="list-none cursor-pointer px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                      Order summary
                    </p>
                    <p className="text-sm font-black text-black">
                      {itemCount} item{itemCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                      Total
                    </p>
                    <p className="text-lg font-black text-black">
                      {"\u20B9"}
                      {cartTotal}
                    </p>
                  </div>
                </summary>

                <div className="px-5 pb-5 border-t border-gray-100">
                  <div className="pt-4 space-y-4">
                    {(cart as CartItem[]).map((item, index) => (
                      <div key={item._id || index} className="flex items-center gap-4">
                        <div className="w-14 h-16 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                          {item.images?.[0] ? (
                            <img
                              src={item.images[0]}
                              alt={item.designName || "Product"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-[9px] font-black uppercase text-gray-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black uppercase text-black truncate">
                            {item.designName}
                          </p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                            {item.designCode}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                            Qty: {item.quantity || 1}
                          </p>
                        </div>
                        <p className="text-sm font-black text-black">
                          {"\u20B9"}
                          {item.price}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                      <span>Shipping</span>
                      <span className="text-green-600">FREE</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        Total
                      </span>
                      <span className="text-2xl font-black tracking-tight text-black">
                        {"\u20B9"}
                        {cartTotal}
                      </span>
                    </div>
                  </div>
                </div>
              </details>
            </div>

            {/* Desktop summary */}
            <div className="hidden lg:block rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                  Order summary
                </p>
                <div className="flex items-end justify-between mt-1">
                  <p className="text-sm font-black text-black">
                    {itemCount} item{itemCount === 1 ? "" : "s"}
                  </p>
                  <p className="text-2xl font-black tracking-tight text-black">
                    {"\u20B9"}
                    {cartTotal}
                  </p>
                </div>
              </div>

              <div className="px-6 py-5 space-y-5 max-h-[42vh] overflow-y-auto pr-2 custom-scrollbar">
                {(cart as CartItem[]).map((item, index) => (
                  <div key={item._id || index} className="flex items-center gap-4">
                    <div className="w-16 h-20 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.designName || "Product"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-[9px] font-black uppercase text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black uppercase text-black truncate">
                        {item.designName}
                      </p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                        {item.designCode}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                        Qty: {item.quantity || 1}
                      </p>
                    </div>
                    <p className="text-sm font-black text-black">
                      {"\u20B9"}
                      {item.price}
                    </p>
                  </div>
                ))}
              </div>

              <div className="px-6 py-5 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <span>Shipping</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Total
                  </span>
                  <span className="text-3xl font-black tracking-tight text-black">
                    {"\u20B9"}
                    {cartTotal}
                  </span>
                </div>
                <div className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Next steps
                  </p>
                  <p className="text-[11px] font-semibold text-gray-700 mt-1 leading-relaxed">
                    Your order moves through Fabric Sourcing and Digital Printing. Status updates are visible in your profile.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* DETAILS */}
          <div className="order-2 lg:order-1 lg:col-span-7 space-y-5">
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-5">
              {/* ADDRESS */}
              <section className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                      Step 1
                    </p>
                    <h2 className="text-sm font-black uppercase tracking-widest text-black">
                      Delivery details
                    </h2>
                  </div>

                  {!showAddressForm && addressComplete && (
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(true)}
                      className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition"
                    >
                      Change
                    </button>
                  )}
                </div>

                {!showAddressForm && addressComplete ? (
                  <div className="px-5 sm:px-6 py-5">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-black truncate">
                            {formData.firstName} {formData.lastName}
                          </p>
                          <p className="text-sm text-gray-700 font-semibold mt-2">
                            {formData.address}
                          </p>
                          <p className="text-sm text-gray-700 font-semibold">
                            {formData.city} {"\u2022"} {formData.zip}
                          </p>
                          <p className="text-sm text-gray-700 font-semibold mt-2">
                            {formData.phone}
                          </p>
                          {prefilledFromProfile && (
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-3">
                              Using saved profile details
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 rounded-2xl bg-white border border-gray-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-700">
                          Verified
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 sm:px-6 py-5 space-y-4">
                    {prefilledFromProfile && (
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                          Saved profile found
                        </p>
                        <p className="text-[11px] font-semibold text-gray-700 mt-1">
                          We pre-filled your details. Just confirm and place the order.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>First name</label>
                        <input
                          required
                          type="text"
                          autoComplete="given-name"
                          className={inputClass}
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData({ ...formData, firstName: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Last name (optional)</label>
                        <input
                          type="text"
                          autoComplete="family-name"
                          className={inputClass}
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData({ ...formData, lastName: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Email</label>
                      <input
                        readOnly
                        type="email"
                        autoComplete="email"
                        className={`${inputClass} bg-gray-100 cursor-not-allowed opacity-70`}
                        value={formData.email}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Address</label>
                      <input
                        required
                        type="text"
                        autoComplete="street-address"
                        className={inputClass}
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>City</label>
                        <input
                          required
                          type="text"
                          autoComplete="address-level2"
                          className={inputClass}
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Pincode</label>
                        <input
                          required
                          type="text"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          className={inputClass}
                          value={formData.zip}
                          onChange={(e) =>
                            setFormData({ ...formData, zip: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Phone</label>
                      <input
                        required
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+91..."
                        className={inputClass}
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                      <p className="mt-2 text-[11px] text-gray-500 font-semibold">
                        We’ll send delivery updates on this number.
                      </p>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        disabled={!addressComplete}
                        onClick={() => setShowAddressForm(false)}
                        className="rounded-2xl bg-black text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest disabled:bg-gray-200 disabled:text-gray-400 transition"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* PAYMENT */}
              <section className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                    Step 2
                  </p>
                  <h2 className="text-sm font-black uppercase tracking-widest text-black">
                    Payment
                  </h2>
                </div>
                <div className="px-5 sm:px-6 py-5">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-black">Cash on Delivery</p>
                      <p className="text-[11px] font-semibold text-gray-600 mt-1">
                        Pay when your order arrives.
                      </p>
                    </div>
                    <span className="rounded-full bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                      Selected
                    </span>
                  </div>
                </div>
              </section>

              {/* DESKTOP CTA */}
              <div className="hidden md:block">
                <button
                  type="submit"
                  disabled={!canPlaceOrder}
                  className="w-full rounded-3xl bg-black text-white py-5 font-black uppercase tracking-widest text-sm shadow-xl hover:bg-gray-900 transition disabled:bg-gray-300 disabled:text-gray-600"
                >
                  {loading
                    ? "Placing order..."
                    : `Confirm order \u2022 \u20B9${cartTotal}`}
                </button>
                <p className="mt-3 text-[11px] text-gray-500 font-semibold leading-relaxed">
                  By placing this order, you confirm that the delivery details are correct.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY CTA (kept above bottom nav) */}
      <div className="md:hidden fixed left-4 right-4 bottom-24 z-[999999]">
        <div className="rounded-3xl border border-gray-200 bg-white/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.18)] px-4 py-3 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Total
            </p>
            <p className="text-xl font-black tracking-tight text-black truncate">
              {"\u20B9"}
              {cartTotal}
            </p>
          </div>
          <button
            form="checkout-form"
            type="submit"
            disabled={!canPlaceOrder}
            className="rounded-2xl bg-black text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition disabled:bg-gray-300 disabled:text-gray-600"
          >
            {loading ? "Placing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

