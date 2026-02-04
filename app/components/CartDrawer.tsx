"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const {
    cart,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    increaseQty,
    decreaseQty,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col pb-24">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">My Cart</h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="text-xl"
          >
            ×
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {cart.length === 0 && (
            <p className="text-center text-gray-500">
              Your cart is empty
            </p>
          )}

          {cart.map((item, index) => (
            <div
              key={item._id || index}
              className="flex gap-3 border-b pb-4"
            >
              {/* Image */}
              <img
                src={item.image}
                alt={item.designName}
                className="w-20 h-20 object-cover rounded"
              />

              {/* Details */}
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {item.designName}
                </p>

                {/* 🔥 QUANTITY CONTROLS */}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => decreaseQty(item._id)}
                    className="w-7 h-7 rounded-full border flex items-center justify-center text-lg font-medium active:bg-gray-100"
                  >
                    −
                  </button>

                  <span className="text-sm font-semibold w-5 text-center">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => increaseQty(item._id)}
                    className="w-7 h-7 rounded-full border flex items-center justify-center text-lg font-medium active:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                {/* Price */}
                <p className="text-sm font-bold mt-2">
                  ₹{item.price * item.quantity}
                </p>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(item._id)}
                  className="text-xs text-red-500 mt-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t px-4 py-3 mb-6">
            <div className="flex justify-between font-semibold mb-3">
              <span>Total</span>
              <span>₹{cartTotal}</span>
            </div>

            <Link
              href="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="block text-center bg-black text-white py-3 rounded-lg font-semibold"
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
