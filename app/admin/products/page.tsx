"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-10 font-sans">
      <div className="flex justify-between items-center mb-12 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-4xl font-black text-black uppercase tracking-tighter">Product Manager</h1>
          <p className="text-gray-500 font-bold mt-1 uppercase text-[10px] tracking-widest">Manage Scarf Designs & Pricing</p>
        </div>
        <Link href="/admin/add" className="bg-black text-white px-10 py-4 rounded-full font-black uppercase text-sm tracking-widest shadow-xl hover:bg-gray-800 transition active:scale-95">
          + Add Design
        </Link>
      </div>

      {loading ? (
        <p className="p-20 text-center font-black text-black text-2xl uppercase">Loading Catalog...</p>
      ) : (
        <div className="bg-white rounded-[40px] shadow-2xl border border-gray-50 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-6 font-black text-[10px] text-black uppercase tracking-widest">Visual</th>
                <th className="p-6 font-black text-[10px] text-black uppercase tracking-widest">Design Identity</th>
                <th className="p-6 font-black text-[10px] text-black uppercase tracking-widest">SKU Code</th>
                <th className="p-6 font-black text-[10px] text-black uppercase tracking-widest">Market Price</th>
                <th className="p-6 font-black text-[10px] text-black uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product: any) => (
                <tr key={product._id} className="hover:bg-gray-50/50 transition duration-300 group">
                  <td className="p-6">
                    <div className="h-20 w-16 rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition group-hover:scale-105">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.designName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="bg-gray-100 h-full w-full flex items-center justify-center text-[10px] font-bold text-gray-400">NO MEDIA</div>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="font-black text-black text-lg leading-tight uppercase tracking-tight">{product.designName}</div>
                    <div className="text-[10px] font-black text-blue-600 uppercase mt-1 tracking-widest">{product.category}</div>
                  </td>
                  <td className="p-6 font-bold text-gray-400 font-mono text-sm">{product.designCode}</td>
                  <td className="p-6">
                    <span className="text-xl font-black text-black tracking-tighter">₹{product.price}</span>
                  </td>
                  <td className="p-6 text-right">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      product.stock > 10 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {product.stock > 0 ? `${product.stock} In Stock` : 'Sold Out'}
                    </span>
                  </td>
                </tr>
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-24 text-gray-400 font-black uppercase tracking-widest italic opacity-50">
                    Your digital catalog is empty. Start adding designs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}