"use client";

import Link from "next/link";

interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function MenuDrawer({ open, onClose }: MenuDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 animate-slideUp">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Menu</h2>
          <button onClick={onClose} className="text-xl">✕</button>
        </div>

        <nav className="space-y-4 text-sm">
          <Link href="/profile" onClick={onClose} className="block">
            👤 My Profile
          </Link>

          <Link href="/orders" onClick={onClose} className="block">
            📦 My Orders
          </Link>

          <Link href="/shop" onClick={onClose} className="block">
            🛍 Shop
          </Link>

          <Link href="/contact" onClick={onClose} className="block">
            ☎ Contact Us
          </Link>
        </nav>
      </div>
    </div>
  );
}
