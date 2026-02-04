"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { data: session, status } = useSession(); 
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

  // 1. Session & Auth logic
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
    if (session?.user?.email) {
      setFormData((prev) => ({ ...prev, email: session.user?.email || "" }));
    }
  }, [status, session, router]);

  // 2. Form Submission (Connects to your Admin Orders Page)
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const orderData = {
      user: session?.user?.email,
      customerName: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      pincode: formData.zip,
      country: formData.country,
     cartItems: cart.map((item: any) => ({ // ✅ 'any' add karne se TypeScript error chala jayega
  product: item._id,
  designName: item.designName || "Unnamed Design",
  designCode: item.designCode || "N/A",
  price: Number(item.price) || 0,
  quantity: item.quantity || 1,
  image: (item.images && item.images.length > 0) ? item.images[0] : ""
})),
      totalAmount: cartTotal,
      status: "Received", // Start of your manufacturing flow
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
        alert("❌ Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return <div className="p-20 text-center font-black uppercase italic animate-pulse">Securing Session...</div>;
  if (status === "unauthenticated") return null;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-4xl font-black text-black uppercase mb-4">Your bag is empty</h2>
        <Link href="/products" className="bg-black text-white px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest">Explore Collection</Link>
      </div>
    );
  }

  const inputClass = "w-full p-4 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold text-gray-700 bg-gray-50/50 transition-all focus:bg-white";
  const labelClass = "block text-[10px] font-black text-black uppercase tracking-[0.2em] mb-2 ml-1";

  return (
    <div className="min-h-screen bg-white py-12 px-6 lg:px-16 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* LEFT: Shipping Details */}
        <div className="lg:col-span-7">
          <h2 className="text-5xl font-black text-black uppercase tracking-tighter mb-10">Checkout</h2>
          
          <form onSubmit={handlePlaceOrder} className="space-y-8">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-black mb-6 italic uppercase tracking-tighter border-b border-gray-50 pb-4">Shipping Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input required type="text" className={inputClass} value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input required type="text" className={inputClass} value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <input readOnly type="email" className={`${inputClass} bg-gray-100 cursor-not-allowed opacity-60`} value={formData.email} />
              </div>

              <div>
                <label className={labelClass}>Complete Delivery Address</label>
                <input required type="text" className={inputClass} value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>City</label>
                  <input required type="text" className={inputClass} value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>ZIP / Pincode</label>
                  <input required type="text" className={inputClass} value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Contact Number</label>
                <input required type="tel" className={inputClass} placeholder="+91..." value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-black text-white py-6 rounded-[30px] font-black text-xl uppercase tracking-widest hover:bg-gray-800 transition shadow-2xl active:scale-95 disabled:bg-gray-400">
              {loading ? "PLACING ORDER..." : `CONFIRM ORDER • ₹${cartTotal}`}
            </button>
          </form>
        </div>

        {/* RIGHT: Order Summary */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-gray-50 p-10 rounded-[50px] border border-gray-100 sticky top-10">
            <h2 className="text-2xl font-black text-black uppercase tracking-tighter mb-8 italic">Order Summary</h2>
            
            <div className="space-y-6 mb-10 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {cart.map((item: any, index: number) => (
                <div key={item._id || index} className="flex gap-6 items-center group">
                  <div className="w-20 h-24 bg-white rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.designName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase text-gray-300">No Image</div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-black text-black text-sm uppercase leading-tight line-clamp-1">{item.designName}</h4>
                    <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-widest">{item.designCode}</p>
                    <p className="text-xs font-bold text-gray-400 mt-2 uppercase">Qty: {item.quantity || 1}</p>
                  </div>

                  <p className="font-black text-black">₹{item.price}</p>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-8 space-y-4">
              <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                <span>Shipping</span>
                <span className="text-green-600">Free of Cost</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-black text-black uppercase tracking-widest text-sm">Total Revenue</span>
                <span className="font-black text-black text-4xl tracking-tighter">₹{cartTotal}</span>
              </div>
            </div>

            <div className="mt-10 p-4 bg-white rounded-2xl border border-gray-100 flex items-start gap-3">
               <span className="text-xl">🧵</span>
               <p className="text-[9px] font-black text-gray-400 uppercase leading-relaxed tracking-wider">
                 Your order will undergo **Fabric Sourcing** and **Digital Printing**. Status updates will be visible in your profile dashboard.
               </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}