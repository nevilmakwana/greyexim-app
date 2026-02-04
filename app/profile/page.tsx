"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import ClientShell from "../ClientShell";

interface OrderItem {
  image: string;
  designName: string;
  designCode: string;
  quantity: number;
}

interface Order {
  _id: string;
  totalAmount: number;
  cartItems: OrderItem[];
}

export default function ProfilePage() {
  const { data: session, status } = useSession();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  /* =============================
     FETCH ORDERS ONLY WHEN READY
  ============================== */
  useEffect(() => {
    if (status !== "authenticated") {
      setLoadingOrders(false);
      return;
    }

    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [status]);

  /* =============================
     AUTH STATES
  ============================== */
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white tracking-widest animate-pulse">
          LOADING PROFILE…
        </p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <ClientShell>
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
          <h1 className="text-xl font-bold">Please login to view profile</h1>
          <Link
            href="/login"
            className="bg-black text-white px-6 py-3 rounded-full text-sm font-bold"
          >
            Go to Login
          </Link>
        </div>
      </ClientShell>
    );
  }

  /* =============================
     MAIN PROFILE UI
  ============================== */
  return (
    <ClientShell>
      <main className="bg-white min-h-screen pb-28 font-sans text-gray-900">
        <div className="max-w-6xl mx-auto px-4 md:px-10 py-10">

          {/* ===== PROFILE HEADER ===== */}
          <header className="flex flex-col md:flex-row justify-between gap-6 border-b pb-8 mb-10">
            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase">
                My Profile
              </h1>
              <p className="text-gray-400 text-xs uppercase tracking-widest mt-2">
                {session?.user?.name} • {session?.user?.email}
              </p>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="self-start md:self-end px-6 py-3 bg-gray-100 text-red-500 font-black text-xs uppercase tracking-widest rounded-full hover:bg-red-50 transition"
            >
              Sign Out
            </button>
          </header>

          {/* ===== ORDERS ===== */}
          <section>
            <h2 className="text-xl font-black uppercase tracking-widest mb-6">
              Order History
            </h2>

            {loadingOrders ? (
              <p className="text-center text-gray-400">Loading orders…</p>
            ) : orders.length === 0 ? (
              <div className="text-center bg-gray-50 p-16 rounded-3xl border border-dashed">
                <p className="text-gray-400 font-black uppercase tracking-widest text-sm">
                  No Orders Yet
                </p>
                <Link
                  href="/shop"
                  className="inline-block mt-6 bg-black text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-white border rounded-3xl p-6 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        Order #{order._id.slice(-8)}
                      </span>
                      <span className="text-xs font-bold text-black">
                        ₹{order.totalAmount}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {order.cartItems?.map((item, i) => (
                        <div key={i} className="flex gap-4 items-center">
                          <img
                            src={item.image}
                            className="w-12 h-12 object-cover rounded-lg border"
                            alt={item.designName}
                          />
                          <div>
                            <p className="font-bold text-sm">
                              {item.quantity}× {item.designName}
                            </p>
                            <p className="text-xs text-gray-400 uppercase">
                              {item.designCode}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>
    </ClientShell>
  );
}
