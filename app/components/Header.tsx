"use client";

import Link from "next/link";
import LanguageSelector from "@/components/LanguageSelector";
import GoogleTranslate from "@/components/GoogleTranslate";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white">

      {/* Google Translate (mounted once, hidden UI) */}
      <GoogleTranslate />

      {/* ================= MOBILE HEADER ================= */}
      <div className="md:hidden flex items-center justify-between px-4 h-14">

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img
            src="/logo-mobile.png"
            alt="GreyExim"
            className="h-7 w-auto"
          />
        </Link>

        {/* Flat Language Selector */}
        <div className="scale-95">
          <LanguageSelector />
        </div>
      </div>

      {/* ================= DESKTOP HEADER ================= */}
      <div className="hidden md:flex items-center justify-between px-12 h-16">

        {/* Logo */}
        <Link href="/">
          <img
            src="/logo-desktop.png"
            alt="GreyExim"
            className="h-6"
          />
        </Link>

        {/* Desktop Menu (flat text only) */}
        <nav className="flex gap-10 text-sm font-medium text-gray-800">
          <Link href="/" className="hover:text-black transition">HOME</Link>
          <Link href="/shop" className="hover:text-black transition">STORE</Link>
          <Link href="/about" className="hover:text-black transition">ABOUT</Link>
          <Link href="/contact" className="hover:text-black transition">CONTACT</Link>
        </nav>

        {/* Flat Language Selector */}
        <div className="scale-95">
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
}
