import "./globals.css";
import Providers from "./Providers";

import Header from "app/components/Header";
import Footer from "app/components/Footer";
import MobileBottomMenu from "app/components/MobileBottomNav";
import CartDrawer from "app/components/CartDrawer";

export const metadata = {
  title: "GreyExim",
  description: "Premium digital scarves for global export",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white">
        <Providers>
          {/* GLOBAL HEADER */}
          <Header />

          {/* PAGE CONTENT */}
          <main className="min-h-screen pb-20">
            {children}
          </main>

          {/* GLOBAL FOOTER */}
          <Footer />

          {/* MOBILE NAV */}
          <MobileBottomMenu />

          {/* CART DRAWER */}
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
