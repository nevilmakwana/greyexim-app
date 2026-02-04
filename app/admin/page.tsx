"use client";

import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeCategories: 0,
    newOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-in fade-in duration-700">
      <header className="mb-12">
        <h1 className="text-5xl font-black text-black tracking-tighter uppercase">Welcome back, Admin</h1>
        <p className="text-gray-500 mt-2 font-bold uppercase text-xs tracking-widest">GreyExim Operations Overview</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Total Products Card */}
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 transition-all hover:shadow-2xl group">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest group-hover:text-blue-600 transition">Inventory Size</p>
          <h3 className="text-6xl font-black text-black mt-4">
            {loading ? "..." : stats.totalProducts}
          </h3>
          <p className="mt-4 text-sm font-bold text-gray-500">Live Scarf Designs</p>
        </div>

        {/* Active Categories Card */}
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 transition-all hover:shadow-2xl group">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest group-hover:text-blue-600 transition">Collections</p>
          <h3 className="text-6xl font-black text-black mt-4">
            {loading ? "..." : stats.activeCategories}
          </h3>
          <p className="mt-4 text-sm font-bold text-gray-500">Active Fabric Types</p>
        </div>

        {/* New Orders Card */}
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 transition-all hover:shadow-2xl group">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest group-hover:text-blue-600 transition">Queue</p>
          <h3 className="text-6xl font-black text-black mt-4">
            {loading ? "..." : stats.newOrders}
          </h3>
          <p className="mt-4 text-sm font-bold text-gray-500">Pending Production</p>
        </div>
      </div>
    </div>
  );
}