"use client";

import Link from "next/link";

export default function Footer() {
  return (
    // ✅ FIX: 'bg-gray-100 dark:bg-black' makes it adapt to the theme
    <footer className="bg-gray-100 dark:bg-black text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold tracking-widest uppercase">Grey Exim</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Premium digital printed scarves crafted with global standards. Exporting quality from India to the world.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-bold mb-6">Shop</h4>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/shop" className="hover:text-blue-600 transition">All Scarves</Link></li>
              <li><Link href="/shop?cat=silk" className="hover:text-blue-600 transition">Silk Collection</Link></li>
              <li><Link href="/shop?cat=cotton" className="hover:text-blue-600 transition">Cotton Blends</Link></li>
              <li><Link href="/shop?sort=new" className="hover:text-blue-600 transition">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold mb-6">Company</h4>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/about" className="hover:text-blue-600 transition">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600 transition">Contact</Link></li>
              <li><Link href="/careers" className="hover:text-blue-600 transition">Careers</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-600 transition">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold mb-6">Stay Updated</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Subscribe for exclusive offers and new launch updates.
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-sm outline-none focus:border-blue-600 dark:text-white transition-colors"
              />
              <button className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-bold rounded hover:opacity-80 transition">
                Join
              </button>
            </div>
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© 2026 Grey Exim. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-black dark:hover:text-white transition">Instagram</Link>
            <Link href="#" className="hover:text-black dark:hover:text-white transition">LinkedIn</Link>
            <Link href="#" className="hover:text-black dark:hover:text-white transition">Twitter</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}