"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { name: "Dashboard", href: "/admin", icon: "🏠" },
  { name: "Add Product", href: "/admin/add", icon: "✨" },
  { name: "Inventory", href: "/admin/manage", icon: "📦" },
  { name: "Orders", href: "/admin/orders", icon: "🚀" },
  { name: "Wishlist", href: "/admin/wishlist", icon: "❤" },
  { name: "Categories", href: "/admin/categories", icon: "📁" },
  { name: "Hero Slides", href: "/admin/hero", icon: "🖼️" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-black tracking-tight">Admin Panel</h2>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive 
                  ? "bg-black text-white shadow-lg" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-black"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <Link href="/" className="text-sm text-gray-400 hover:text-black transition">
          ← Back to Site
        </Link>
      </div>
    </aside>
  );
}
