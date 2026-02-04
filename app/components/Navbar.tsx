"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Only hide on Admin pages.
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <>
      <div className="flex flex-col min-h-screen bg-white relative z-0">
        {!isAdmin && <Header />}

        <main className="flex-grow pb-32 md:pb-0">
          {children}
        </main>

        {!isAdmin && <Footer />}
      </div>

      {/* ✅ FORCE MENU VISIBLE 
         We removed all other checks. If this is not Admin, it MUST show.
      */}
      {!isAdmin && <MobileBottomNav />}
    </>
  );
}