"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [loading, setLoading] = useState<"google" | "facebook" | null>(null);
  const WISHLIST_KEY = "greyexim_wishlist";

  useEffect(() => {
    if (status === "authenticated") {
      if (typeof window !== "undefined" && session?.user?.email) {
        const raw = localStorage.getItem(WISHLIST_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const ids = Array.isArray(list) ? list : [];
        if (ids.length > 0) {
          Promise.all(
            ids.map((id: string) =>
              fetch("/api/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: session.user.email,
                  productId: id,
                }),
              })
            )
          ).finally(() => {
            localStorage.removeItem(WISHLIST_KEY);
            window.dispatchEvent(new Event("wishlist-updated"));
          });
        }
      }
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f141c] px-6">
      <div className="w-full max-w-sm bg-[#151b24] text-white rounded-[32px] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <h1 className="text-3xl font-black tracking-tight">Welcome Back</h1>
        <p className="text-gray-400 mt-2 mb-8">Sign in to save favorites and track orders.</p>

        <button
          onClick={() => {
            setLoading("google");
            signIn("google", { callbackUrl });
          }}
          className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 rounded-2xl hover:bg-gray-100 transition mb-4"
          disabled={loading === "google"}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
          {loading === "google" ? "Connecting..." : "Sign in with Google"}
        </button>

        <button
          onClick={() => {
            setLoading("facebook");
            signIn("facebook", { callbackUrl });
          }}
          className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white font-semibold py-3 rounded-2xl hover:brightness-110 transition"
          disabled={loading === "facebook"}
        >
          <span className="font-black text-lg">f</span>
          {loading === "facebook" ? "Connecting..." : "Sign in with Facebook"}
        </button>

        <div className="my-6 h-px bg-white/10" />

        <button
          onClick={() => router.push("/")}
          className="w-full border border-white/10 text-white/80 py-3 rounded-2xl hover:border-white/30 transition"
        >
          Continue as Guest
        </button>

        <p className="text-[11px] text-gray-500 mt-6 leading-relaxed">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
