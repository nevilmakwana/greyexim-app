"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useCart } from "@/context/CartContext";

type Address = {
  _id: string;
  label?: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
  country?: string;
  isDefault?: boolean;
};

type CartItem = {
  _id: string;
  designName?: string;
  designCode?: string;
  price?: number;
  quantity?: number;
  image?: string;
  images?: string[];
};

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  // Address book
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  // Guest/new address form (also used to add a new saved address)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    country: "India",
  });

  const [saveToAddressBook, setSaveToAddressBook] = useState(true);

  // Delivery options
  const [deliverySpeed, setDeliverySpeed] = useState<"standard" | "express">("standard");
  const shippingAmount = useMemo(() => (deliverySpeed === "express" ? 199 : 0), [deliverySpeed]);
  const taxAmount = useMemo(() => 0, []);
  const discountAmount = useMemo(() => 0, []);
  const subtotalAmount = useMemo(() => cartTotal, [cartTotal]);
  const totalAmount = useMemo(() => Math.max(subtotalAmount + shippingAmount + taxAmount - discountAmount, 0), [subtotalAmount, shippingAmount, taxAmount, discountAmount]);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "STRIPE">("COD");

  const itemCount = useMemo(() => {
    return (cart as CartItem[]).reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cart]);

  // Prefill email from session
  useEffect(() => {
    if (session?.user?.email) {
      setFormData((p) => ({ ...p, email: p.email || session.user?.email || "" }));
    }
  }, [session?.user?.email]);

  // Load address book for logged-in users
  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/addresses", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const list: Address[] = Array.isArray(data?.addresses) ? data.addresses : [];
        setAddresses(list);

        const def = list.find((a) => a.isDefault) || list[0];
        if (def?._id) setSelectedAddressId(def._id);

        // Prefill form from default address if empty (helps when user chooses "New address" later)
        if (def) {
          setFormData((p) => ({
            ...p,
            fullName: p.fullName || def.name || "",
            phone: p.phone || def.phone || "",
            address: p.address || def.address || "",
            city: p.city || def.city || "",
            pincode: p.pincode || def.pincode || "",
            country: p.country || def.country || "India",
          }));
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  // Handle Stripe cancel
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("canceled") === "1") {
      // keep cart as-is; just surface a nudge
      // eslint-disable-next-line no-alert
      alert("Payment cancelled. You can try again or switch to Cash on Delivery.");
    }
  }, []);

  const selectedAddress = useMemo(() => {
    return addresses.find((a) => a._id === selectedAddressId) || null;
  }, [addresses, selectedAddressId]);

  const addressFromSavedIsComplete = useMemo(() => {
    if (!selectedAddress) return false;
    return Boolean(
      (selectedAddress.name || "").trim() &&
        (selectedAddress.phone || "").trim() &&
        (selectedAddress.address || "").trim() &&
        (selectedAddress.city || "").trim() &&
        (selectedAddress.pincode || "").trim()
    );
  }, [selectedAddress]);

  const formAddressComplete = useMemo(() => {
    return Boolean(
      formData.fullName.trim() &&
        formData.email.trim() &&
        formData.phone.trim() &&
        formData.address.trim() &&
        formData.city.trim() &&
        formData.pincode.trim()
    );
  }, [formData]);

  const canPlaceOrder = useMemo(() => {
    if (cart.length === 0) return false;
    if (loading) return false;
    if (status === "authenticated" && addressFromSavedIsComplete) return true;
    return formAddressComplete;
  }, [cart.length, loading, status, addressFromSavedIsComplete, formAddressComplete]);

  const inputClass =
    "w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";
  const labelClass =
    "block text-[10px] font-black text-gray-500 uppercase tracking-[0.22em] mb-2 ml-1";

  const buildOrderPayload = (orderPaymentMethod: "COD" | "STRIPE", orderPaymentStatus: string) => {
    const useSaved = status === "authenticated" && addressFromSavedIsComplete && selectedAddress;

    const ship = useSaved
      ? {
          customerName: (selectedAddress?.name || "").trim(),
          phone: (selectedAddress?.phone || "").trim(),
          address: (selectedAddress?.address || "").trim(),
          city: (selectedAddress?.city || "").trim(),
          pincode: (selectedAddress?.pincode || "").trim(),
          country: (selectedAddress?.country || "India").trim(),
        }
      : {
          customerName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          pincode: formData.pincode.trim(),
          country: formData.country.trim() || "India",
        };

    const email = (formData.email || session?.user?.email || "").trim();

    return {
      user: session?.user?.email || "",
      customerName: ship.customerName,
      email,
      phone: ship.phone,
      address: ship.address,
      city: ship.city,
      pincode: ship.pincode,
      country: ship.country,
      cartItems: (cart as CartItem[]).map((item) => ({
        product: item._id,
        designName: item.designName || "Unnamed Design",
        designCode: item.designCode || "N/A",
        price: Number(item.price) || 0,
        quantity: item.quantity || 1,
        image: item.image || (Array.isArray(item.images) ? item.images[0] : "") || "",
      })),
      subtotalAmount,
      shippingAmount,
      taxAmount,
      discountAmount,
      totalAmount,
      currency: "INR",
      paymentMethod: orderPaymentMethod,
      paymentStatus: orderPaymentStatus,
      paymentProvider: orderPaymentMethod === "STRIPE" ? "stripe" : "",
    };
  };

  const maybeSaveAddress = async () => {
    if (status !== "authenticated") return;
    if (!saveToAddressBook) return;
    if (!formAddressComplete) return;

    try {
      await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: "Home",
          name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          pincode: formData.pincode.trim(),
          country: formData.country.trim() || "India",
          isDefault: addresses.length === 0,
        }),
      });
    } catch {
      // ignore
    }
  };

  const placeOrderCOD = async () => {
    const payload = buildOrderPayload("COD", "unpaid");

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Order failed");

    localStorage.setItem("lastOrderId", String(data.orderId || ""));
    clearCart();
    router.push("/order-success");
  };

  const payWithStripe = async () => {
    // Create order first (pending), then create a Stripe session tied to the order.
    const payload = buildOrderPayload("STRIPE", "pending");

    const orderRes = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const orderData = await orderRes.json().catch(() => ({}));
    if (!orderRes.ok) throw new Error(orderData?.message || "Order create failed");

    const orderId = String(orderData.orderId || "");
    localStorage.setItem("lastOrderId", orderId);

    const sessRes = await fetch("/api/checkout/stripe-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const sess = await sessRes.json().catch(() => ({}));
    if (!sessRes.ok || !sess?.url) throw new Error(sess?.message || "Stripe session failed");

    // Redirect to Stripe hosted checkout
    window.location.href = String(sess.url);
  };

  const handleConfirm = async () => {
    if (!canPlaceOrder) return;
    setLoading(true);
    try {
      await maybeSaveAddress();
      if (paymentMethod === "COD") {
        await placeOrderCOD();
      } else {
        await payWithStripe();
      }
    } catch (err: any) {
      console.error(err);
      // eslint-disable-next-line no-alert
      alert(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
        <h2 className="text-4xl font-black text-black uppercase mb-4">Your bag is empty</h2>
        <Link href="/shop" className="bg-black text-white px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest">
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
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Secure checkout</p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">Checkout</h1>
            <p className="mt-1 text-xs text-gray-500 font-semibold">Fast order flow. Minimal steps. Easy to review.</p>
          </div>
          <Link
            href="/cart"
            className="shrink-0 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-800 shadow-sm hover:bg-gray-50 transition"
          >
            Back to cart
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* LEFT: Steps */}
          <section className="order-2 lg:order-1 lg:col-span-7 space-y-6">
            {/* Step 1: Address */}
            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-start justify-between gap-3 border-b border-gray-100">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Step 1</p>
                  <h2 className="text-lg font-black tracking-tight">Delivery details</h2>
                  <p className="text-[11px] font-semibold text-gray-500">Choose saved address or enter a new one.</p>
                </div>
                {status === "authenticated" && addresses.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowAddressPicker(true)}
                    className="shrink-0 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700"
                  >
                    Change
                  </button>
                ) : null}
              </div>

              <div className="p-5">
                {/* Saved address summary */}
                {status === "authenticated" && selectedAddress && addressFromSavedIsComplete ? (
                  <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate">{selectedAddress.name}</p>
                        <p className="text-[12px] font-semibold text-gray-600 mt-1">{selectedAddress.address}</p>
                        <p className="text-[12px] font-semibold text-gray-600">
                          {selectedAddress.city} · {selectedAddress.pincode}
                        </p>
                        <p className="text-[12px] font-semibold text-gray-600">{selectedAddress.phone}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700">
                        Verified
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Using saved address
                    </p>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div>
                      <label className={labelClass}>Full name</label>
                      <input
                        className={inputClass}
                        value={formData.fullName}
                        onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                        placeholder="Full name"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Email</label>
                        <input
                          className={inputClass}
                          value={formData.email}
                          onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                          placeholder="Email address"
                          inputMode="email"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Phone</label>
                        <input
                          className={inputClass}
                          value={formData.phone}
                          onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                          placeholder="Phone number"
                          inputMode="tel"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Complete delivery address</label>
                      <input
                        className={inputClass}
                        value={formData.address}
                        onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                        placeholder="House no, street, area"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>City</label>
                        <input
                          className={inputClass}
                          value={formData.city}
                          onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Zip / Pincode</label>
                        <input
                          className={inputClass}
                          value={formData.pincode}
                          onChange={(e) => setFormData((p) => ({ ...p, pincode: e.target.value }))}
                          placeholder="Zip / pincode"
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    {status === "authenticated" ? (
                      <label className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-widest text-gray-700">Save to address book</p>
                          <p className="text-[10px] font-semibold text-gray-500">Next time checkout will be 1-tap.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={saveToAddressBook}
                          onChange={(e) => setSaveToAddressBook(e.target.checked)}
                          className="h-5 w-5"
                        />
                      </label>
                    ) : (
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-700">Guest checkout</p>
                        <p className="text-[10px] font-semibold text-gray-500">
                          You can place the order without login. After order, you can create an account anytime.
                        </p>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>

            {/* Step 2: Delivery */}
            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Step 2</p>
                <h2 className="text-lg font-black tracking-tight">Delivery</h2>
                <p className="text-[11px] font-semibold text-gray-500">Pick a speed. We’ll confirm ETA after address.</p>
              </div>
              <div className="p-5 space-y-3">
                <button
                  type="button"
                  onClick={() => setDeliverySpeed("standard")}
                  className={`w-full rounded-3xl border px-5 py-4 text-left transition ${
                    deliverySpeed === "standard" ? "border-black bg-black text-white" : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">Standard Delivery</p>
                      <p className={`text-[11px] font-semibold ${deliverySpeed === "standard" ? "text-white/80" : "text-gray-500"}`}>
                        3–7 days · Free
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                      deliverySpeed === "standard" ? "bg-white text-black" : "bg-gray-100 text-gray-700"
                    }`}>
                      {deliverySpeed === "standard" ? "Selected" : "Choose"}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliverySpeed("express")}
                  className={`w-full rounded-3xl border px-5 py-4 text-left transition ${
                    deliverySpeed === "express" ? "border-black bg-black text-white" : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">Express Delivery</p>
                      <p className={`text-[11px] font-semibold ${deliverySpeed === "express" ? "text-white/80" : "text-gray-500"}`}>
                        1–3 days · {"\u20B9"}199
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                      deliverySpeed === "express" ? "bg-white text-black" : "bg-gray-100 text-gray-700"
                    }`}>
                      {deliverySpeed === "express" ? "Selected" : "Choose"}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 3: Payment */}
            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Step 3</p>
                <h2 className="text-lg font-black tracking-tight">Payment</h2>
                <p className="text-[11px] font-semibold text-gray-500">Choose your payment method.</p>
              </div>
              <div className="p-5 space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("COD")}
                  className={`w-full rounded-3xl border px-5 py-4 text-left transition ${
                    paymentMethod === "COD" ? "border-black bg-black text-white" : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">Cash on Delivery</p>
                      <p className={`text-[11px] font-semibold ${paymentMethod === "COD" ? "text-white/80" : "text-gray-500"}`}>
                        Pay when your order arrives.
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                      paymentMethod === "COD" ? "bg-white text-black" : "bg-gray-100 text-gray-700"
                    }`}>
                      {paymentMethod === "COD" ? "Selected" : "Choose"}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("STRIPE")}
                  className={`w-full rounded-3xl border px-5 py-4 text-left transition ${
                    paymentMethod === "STRIPE" ? "border-black bg-black text-white" : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">Card / Apple Pay / Google Pay</p>
                      <p className={`text-[11px] font-semibold ${paymentMethod === "STRIPE" ? "text-white/80" : "text-gray-500"}`}>
                        Secure payment powered by Stripe (global).
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                      paymentMethod === "STRIPE" ? "bg-white text-black" : "bg-gray-100 text-gray-700"
                    }`}>
                      {paymentMethod === "STRIPE" ? "Selected" : "Choose"}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </section>

          {/* RIGHT: Summary */}
          <aside className="order-1 lg:order-2 lg:col-span-5 lg:sticky lg:top-20 h-fit">
            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Order summary</p>
                  <p className="text-sm font-black text-black">
                    {itemCount} item{itemCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Total</p>
                  <p className="text-lg font-black text-black">
                    {"\u20B9"}
                    {totalAmount}
                  </p>
                </div>
              </div>

              <div className="px-5 py-5 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-semibold">Subtotal</span>
                    <span className="font-black">
                      {"\u20B9"}
                      {subtotalAmount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-semibold">Shipping</span>
                    <span className="font-black">{shippingAmount === 0 ? "Free" : `\u20B9${shippingAmount}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-semibold">Tax</span>
                    <span className="font-black">{taxAmount === 0 ? "Included" : `\u20B9${taxAmount}`}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={!canPlaceOrder}
                    onClick={handleConfirm}
                    className={`w-full rounded-full py-4 font-black uppercase text-xs tracking-widest shadow-lg transition active:scale-95 ${
                      canPlaceOrder
                        ? "bg-black text-white hover:bg-gray-900"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {loading ? "Processing..." : paymentMethod === "STRIPE" ? "Pay Securely" : "Confirm Order"}
                  </button>

                  <p className="mt-3 text-[10px] font-semibold text-gray-500 text-center">
                    By placing your order, you agree to our terms. Payments are encrypted.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Address Picker Modal */}
      {showAddressPicker ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddressPicker(false)} />
          <div className="absolute left-0 right-0 bottom-0 mx-auto max-w-xl rounded-t-[32px] bg-white shadow-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black uppercase tracking-widest">Choose address</p>
              <button
                type="button"
                onClick={() => setShowAddressPicker(false)}
                className="w-10 h-10 grid place-items-center rounded-full border border-gray-200"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[55vh] overflow-auto pb-2">
              {addresses.map((a) => (
                <button
                  type="button"
                  key={a._id}
                  onClick={() => {
                    setSelectedAddressId(a._id);
                    setShowAddressPicker(false);
                  }}
                  className={`w-full text-left rounded-3xl border px-4 py-4 transition ${
                    a._id === selectedAddressId ? "border-black bg-black text-white" : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate">{a.name || "Saved address"}</p>
                      <p className={`text-[11px] font-semibold mt-1 ${a._id === selectedAddressId ? "text-white/80" : "text-gray-600"}`}>
                        {(a.address || "").trim()}
                      </p>
                      <p className={`text-[11px] font-semibold ${a._id === selectedAddressId ? "text-white/80" : "text-gray-600"}`}>
                        {(a.city || "").trim()} · {(a.pincode || "").trim()} · {(a.country || "India").trim()}
                      </p>
                      <p className={`text-[11px] font-semibold ${a._id === selectedAddressId ? "text-white/80" : "text-gray-600"}`}>
                        {(a.phone || "").trim()}
                      </p>
                    </div>
                    {a.isDefault ? (
                      <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                        a._id === selectedAddressId ? "bg-white text-black" : "bg-gray-100 text-gray-700"
                      }`}>
                        Default
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}

              <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-700">Want to deliver to a new address?</p>
                <p className="text-[10px] font-semibold text-gray-500 mt-1">
                  Close this sheet and type a new address in the form (Step 1).
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
