"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product { 
  _id: string; 
  designName: string; 
  price: number; 
  stock: number; 
  images: string[]; 
  designCode: string; 
  category: string;
}

export default function ManageInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("⚠️ Kya aap is design ko delete karna chahte hain?")) return;
    
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts(products.filter((p) => p._id !== id));
      alert("✅ Product Deleted");
    } else {
      alert("❌ Error deleting product");
    }
  };

  if (loading) return <div className="p-10 font-black text-black text-2xl">Loading Inventory... 📦</div>;

  return (
    <div className="max-w-7xl mx-auto p-10 font-sans">
      
      {/* Header Section */}
      <div className="flex justify-between items-center mb-10 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-4xl font-black text-black uppercase tracking-tighter">Inventory Control</h1>
          <p className="text-gray-500 font-bold mt-1">Manage designs and monitor stock levels ({products.length})</p>
        </div>
        <Link href="/admin/add" className="bg-blue-600 text-white px-8 py-3 rounded-full font-black shadow-lg hover:bg-blue-700 transition active:scale-95">
          + ADD NEW DESIGN
        </Link>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-6 font-black text-xs text-black uppercase tracking-widest">Product / Design</th>
              <th className="p-6 font-black text-xs text-black uppercase tracking-widest">SKU Code</th>
              <th className="p-6 font-black text-xs text-black uppercase tracking-widest">Pricing</th>
              <th className="p-6 font-black text-xs text-black uppercase tracking-widest">Stock Status</th>
              <th className="p-6 font-black text-xs text-black uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-20 text-center text-gray-400 font-bold">No designs found. Add your first product! 🚀</td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50/50 transition duration-300">
                  {/* Image & Name */}
                  <td className="p-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                      <img src={product.images[0]} alt={product.designName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-black text-black text-lg leading-tight">{product.designName}</h3>
                      <p className="text-xs font-bold text-blue-600 uppercase mt-1">{product.category || "General"}</p>
                    </div>
                  </td>

                  {/* SKU Code */}
                  <td className="p-6 text-sm font-bold text-gray-500 font-mono">{product.designCode}</td>

                  {/* Pricing */}
                  <td className="p-6">
                    <span className="text-xl font-black text-black">₹{product.price}</span>
                  </td>

                  {/* Stock Indicator */}
                  <td className="p-6">
                    <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                      product.stock < 5 ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"
                    }`}>
                      {product.stock} Units {product.stock < 5 && "• LOW STOCK"}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-6 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Link href={`/admin/edit/${product._id}`} className="px-5 py-2 bg-gray-100 text-black font-black text-xs rounded-xl hover:bg-black hover:text-white transition duration-300 uppercase">
                        Edit / Restock
                      </Link>
                      <button 
                        onClick={() => handleDelete(product._id)} 
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition duration-300"
                        title="Delete Design"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
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