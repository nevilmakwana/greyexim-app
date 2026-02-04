"use client";

import { useCart } from "app/context/CartContext";
import Link from "next/link";

export default function CartPage() {
  const { cart, removeFromCart, cartTotal } = useCart();

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
    // ✅ FIX: 'pb-32' (Padding Bottom) add kiya taaki content menu ke piche na jaye
    <div className="min-h-screen bg-white pt-6 px-4 pb-32 md:pt-20 md:px-20">
      
      <h1 className="text-3xl font-black uppercase italic mb-8">
        Shopping Bag ({cart.length})
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-6">
          {cart.map((item) => (
            <div key={item._id} className="flex gap-4 border-b border-gray-100 pb-6">
              <div className="w-24 h-32 bg-gray-50 rounded-xl overflow-hidden relative">
                <img src={item.image} alt={item.designName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-black uppercase text-sm">{item.designName}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{item.designCode}</p>
                </div>
                <div className="flex justify-between items-end">
                  <span className="font-bold text-sm">₹{item.price}</span>
                  <button onClick={() => removeFromCart(item._id)} className="text-red-500 text-[10px] font-black uppercase">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-6 rounded-[30px] h-fit border border-gray-100">
          <h3 className="font-black uppercase text-sm mb-4">Order Summary</h3>
          <div className="flex justify-between mb-4 text-sm"><span className="text-gray-500">Total</span><span className="font-black">₹{cartTotal}</span></div>
          
          <Link href="/checkout">
            <button className="w-full bg-blue-600 text-white py-4 rounded-full font-black uppercase text-xs tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
              Proceed to Checkout
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}