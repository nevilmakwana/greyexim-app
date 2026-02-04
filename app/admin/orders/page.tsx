"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Order {
  _id: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  cartItems: any[];
  shippingAddress: {
    city: string;
    address: string;
    pincode: string;
  };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Memoized fetch function for efficiency
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Orders load failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // 2. Status Update with UI feedback
  const updateStatus = async (orderId: string, newStatus: string) => {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, newStatus }),
    });
    
    if (res.ok) {
      // Optimistic update: List refresh karne tak UI update dikhayein
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      alert(`✅ Status updated to ${newStatus}`);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-black font-black uppercase tracking-[0.4em] animate-pulse">Loading Production Queue... 🧵</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-10 font-sans animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-12 border-b border-gray-100 pb-10">
        <div>
          <h1 className="text-5xl font-black text-black uppercase tracking-tighter">Order Pipeline</h1>
          <p className="text-gray-400 font-bold mt-2 uppercase text-[10px] tracking-widest">
            {orders.length} Active Manufacturing Requests
          </p>
        </div>
        <Link href="/admin" className="px-8 py-3 bg-black text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition shadow-xl">
          ← Back to Stats
        </Link>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[45px] shadow-2xl border border-gray-50 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="p-8 font-black text-[10px] text-black uppercase tracking-widest">Customer & ID</th>
              <th className="p-8 font-black text-[10px] text-black uppercase tracking-widest">Designs Selection</th>
              <th className="p-8 font-black text-[10px] text-black uppercase tracking-widest text-center">Journey Status</th>
              <th className="p-8 font-black text-[10px] text-black uppercase tracking-widest text-right">Value & Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-32 text-center text-gray-300 font-black uppercase italic tracking-widest opacity-40 text-xl">
                  No orders in the pipeline.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50/30 transition-all duration-300 group">
                  
                  {/* Customer Info */}
                  <td className="p-8">
                    <div className="font-black text-black text-xl leading-none uppercase tracking-tighter group-hover:text-blue-600 transition">
                      {order.customerName}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">ID: {order._id.slice(-6).toUpperCase()}</span>
                       <span className="h-1 w-1 bg-gray-200 rounded-full" />
                       <span className="text-[10px] font-bold text-gray-400 uppercase">{order.shippingAddress?.city}</span>
                    </div>
                  </td>

                  {/* Order Items */}
                  <td className="p-8">
                    <div className="space-y-2">
                      {order.cartItems?.map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                           <div className="w-8 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-100 flex-shrink-0">
                              <img src={item.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500" alt="" />
                           </div>
                           <p className="text-xs font-black text-gray-600 uppercase tracking-tight line-clamp-1">
                             {item.quantity}x {item.designName}
                           </p>
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Manufacturing Journey Dropdown */}
                  <td className="p-8 text-center">
                    <div className="relative inline-block">
                      <select 
                        value={order.status}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        className={`appearance-none cursor-pointer pl-6 pr-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all shadow-sm ${
                          order.status === "Delivered" ? "bg-green-50 text-green-600 border-green-100" :
                          order.status === "Printing" ? "bg-purple-50 text-purple-600 border-purple-100" :
                          "bg-gray-50 text-black border-gray-100"
                        }`}
                      >
                        {["Received", "Fabric Sourcing", "Printing", "Quality Check", "Shipped", "Delivered", "Cancelled"].map(st => (
                          <option key={st} value={st} className="font-bold text-black">{st}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-current opacity-50">
                        <svg className="fill-current h-3 w-3" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </td>

                  {/* Price & Timestamp */}
                  <td className="p-8 text-right">
                    <div className="text-3xl font-black text-black tracking-tighter">₹{order.totalAmount}</div>
                    <div className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-widest">
                      {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}