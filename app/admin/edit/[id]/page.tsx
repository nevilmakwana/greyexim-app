"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    designName: "",
    ribbon: "",
    description: "",
    price: "",
    costPrice: "",
    onSale: false,
    salePrice: "",
    designCode: "",
    stock: "",
    shippingWeight: "",
    category: "",
    images: [] as string[],
  });

  // 1. Load Data (Categories + Product Details)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Categories and Product in parallel
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/categories"),
          fetch(`/api/products/${id}`)
        ]);

        const cats = await catRes.json();
        const prod = await prodRes.json();

        setDbCategories(cats);
        setFormData({
          designName: prod.designName || "",
          ribbon: prod.ribbon || "",
          description: prod.description || "",
          price: prod.price || "",
          costPrice: prod.costPrice || "",
          onSale: prod.onSale || false,
          salePrice: prod.salePrice || "",
          designCode: prod.designCode || "",
          stock: prod.stock || "",
          shippingWeight: prod.shippingWeight || "",
          category: prod.category || "",
          images: prod.images || [],
        });
      } catch (error) {
        console.error("Failed to load details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Calculations
  const price = Number(formData.price) || 0;
  const cost = Number(formData.costPrice) || 0;
  const profit = price - cost;
  const margin = price > 0 ? ((profit / price) * 100).toFixed(0) : 0;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      alert("✅ Product Updated Successfully!");
      router.push("/admin/manage");
    } else {
      alert("❌ Update Failed");
    }
    setSaving(false);
  };

  const inputClass = "w-full p-3 border border-gray-300 rounded-xl text-gray-700 font-medium outline-none focus:ring-2 focus:ring-black";
  const labelClass = "block text-sm font-black text-black mb-1 uppercase tracking-widest";

  if (loading) return <div className="p-20 text-center font-black text-black text-2xl uppercase tracking-tighter">Loading Scarf Details... ⏳</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-6">
            <h1 className="text-4xl font-black text-black uppercase tracking-tighter">Edit Design</h1>
            <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => router.back()}
                  className="px-8 py-3 rounded-full font-bold text-gray-500 hover:bg-gray-100 transition"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleUpdate} 
                  disabled={saving} 
                  className="bg-black text-white px-10 py-3 rounded-full font-black shadow-lg hover:bg-gray-800 transition active:scale-95"
                >
                  {saving ? "SAVING..." : "UPDATE PRODUCT"}
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* 1. Product Info */}
                <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100">
                    <h2 className="text-xl font-black text-black mb-6 italic">BASIC DETAILS</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className={labelClass}>Design Name</label>
                            <input type="text" className={inputClass} 
                                value={formData.designName} onChange={e => setFormData({...formData, designName: e.target.value})} 
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className={labelClass}>Ribbon (Status)</label>
                            <input type="text" className={inputClass} placeholder="e.g. New Arrival"
                                value={formData.ribbon} onChange={e => setFormData({...formData, ribbon: e.target.value})} 
                            />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Fabric & Design Description</label>
                        <textarea rows={5} className={inputClass} 
                            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} 
                        />
                    </div>
                </div>

                {/* 2. Pricing & Profit */}
                <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100">
                    <h2 className="text-xl font-black text-black mb-6 italic">PRICING ANALYSIS</h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className={labelClass}>Selling Price (₹)</label>
                            <input type="number" className={inputClass} 
                                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Cost Price (₹)</label>
                            <input type="number" className={inputClass} 
                                value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} 
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="flex-1">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Gross Profit</p>
                            <p className="text-2xl font-black text-green-600">₹{profit}</p>
                        </div>
                        <div className="flex-1 border-l border-gray-200 pl-5">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Net Margin</p>
                            <p className="text-2xl font-black text-blue-600">{margin}%</p>
                        </div>
                    </div>
                </div>

                {/* 3. Inventory */}
                <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100">
                    <h2 className="text-xl font-black text-black mb-6 italic">STOCK CONTROL</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>SKU / Design Code</label>
                            <input type="text" className={inputClass} 
                                value={formData.designCode} onChange={e => setFormData({...formData, designCode: e.target.value})} 
                            />
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                            <label className="block text-xs font-black text-yellow-700 mb-1 uppercase tracking-widest">Update Stock Qty</label>
                            <input type="number" className="w-full bg-transparent border-b-2 border-yellow-400 p-1 text-xl font-black text-black outline-none" 
                                value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-8">
                {/* Images */}
                <div className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100">
                    <h2 className="text-xl font-black text-black mb-6 italic">MEDIA</h2>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {formData.images.map((img, i) => (
                            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100">
                                <img src={img} alt="Preview" className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, images: formData.images.filter((_, idx) => idx !== i)})}
                                    className="absolute top-2 right-2 bg-red-600 text-white w-7 h-7 rounded-full text-xs font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                    <CldUploadWidget uploadPreset="greyexim_uploads" onSuccess={(res: any) => setFormData({...formData, images: [...formData.images, res.info.secure_url]})}>
                        {({ open }: any) => (
                            <button type="button" onClick={() => open()} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-black text-xs uppercase tracking-widest hover:border-black hover:text-black transition">
                                + Add More Media
                            </button>
                        )}
                    </CldUploadWidget>
                </div>

                {/* Dynamic Categories Selection */}
                <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100">
                    <h2 className="text-xl font-black text-black mb-6 italic">CATEGORY</h2>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {dbCategories.map((cat: any) => (
                            <div key={cat._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition group cursor-pointer" onClick={() => setFormData({...formData, category: cat.name})}>
                                <input 
                                    type="radio" 
                                    name="category" 
                                    checked={formData.category === cat.name}
                                    onChange={() => setFormData({...formData, category: cat.name})}
                                    className="w-5 h-5 text-black accent-black cursor-pointer"
                                />
                                <label className="text-gray-700 font-bold cursor-pointer group-hover:text-black transition uppercase text-xs tracking-wider">
                                    {cat.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}