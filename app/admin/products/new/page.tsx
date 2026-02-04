"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // Main Form State
  const [formData, setFormData] = useState({
    designName: "",
    designCode: "",
    category: "",
    description: "",
    price: "",
    costPrice: "",
    stock: "",
    shippingWeight: "",
    ribbon: "",
    images: [] as string[],
  });

  // 1. Fetch Categories from Database
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data);
        if (data.length > 0) setFormData(prev => ({ ...prev, category: data[0].name }));
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCats();
  }, []);

  // 2. Auto Profit Calculation logic
  const priceNum = Number(formData.price) || 0;
  const costNum = Number(formData.costPrice) || 0;
  const profit = priceNum - costNum;
  const margin = priceNum > 0 ? ((profit / priceNum) * 100).toFixed(0) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.designName || !formData.designCode || !formData.price) {
      alert("Please fill Design Name, Design Code, and Price.");
      setLoading(false);
      return;
    }

    if (formData.images.length === 0) {
      alert("Please upload at least one image!");
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      category: formData.category || "General",
    };

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("✅ Product Created Successfully!");
      router.push("/admin/manage");
    } else {
      const err = await res.json().catch(() => null);
      alert(err?.message || "❌ Error creating product.");
    }
    setLoading(false);
  };

  const inputClass = "w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black text-gray-700 outline-none font-medium bg-white";
  const labelClass = "block text-sm font-black text-black mb-1 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-black text-black">ADD NEW PRODUCT</h1>
          <button onClick={handleSubmit} disabled={loading} className="bg-blue-600 text-white px-10 py-3 rounded-full font-black shadow-lg hover:bg-blue-700 transition active:scale-95">
            {loading ? "SAVING..." : "SAVE PRODUCT"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Main Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100">
              <h2 className="text-xl font-black text-black mb-6">BASIC INFO</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2 md:col-span-1">
                  <label className={labelClass}>Design Name</label>
                  <input type="text" className={inputClass} placeholder="e.g. Silk Floral"
                    value={formData.designName} onChange={e => setFormData({...formData, designName: e.target.value})} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className={labelClass}>Design Code (SKU)</label>
                  <input type="text" className={inputClass} placeholder="e.g. GX-001"
                    value={formData.designCode} onChange={e => setFormData({...formData, designCode: e.target.value})} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea rows={4} className={inputClass} placeholder="Describe the fabric and print..."
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100">
              <h2 className="text-xl font-black text-black mb-6">PRICING & PROFIT</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className={labelClass}>Selling Price (₹)</label>
                  <input type="number" className={inputClass} value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Cost Price (₹)</label>
                  <input type="number" className={inputClass} value={formData.costPrice}
                    onChange={e => setFormData({...formData, costPrice: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Est. Profit</p>
                  <p className="text-2xl font-black text-green-600">₹{profit}</p>
                </div>
                <div className="flex-1 border-l border-gray-200 pl-5">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Margin</p>
                  <p className="text-2xl font-black text-blue-600">{margin}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Images & Inventory */}
          <div className="space-y-8">
            {/* Image Upload */}
            <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100">
              <h2 className="text-xl font-black text-black mb-4">IMAGES</h2>
              <CldUploadWidget uploadPreset="greyexim_uploads" onSuccess={(res: any) => setFormData({...formData, images: [...formData.images, res.info.secure_url]})}>
                {({ open }: any) => (
                  <button type="button" onClick={() => open()} className="w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 text-gray-400 font-bold hover:bg-blue-50 hover:text-blue-600 transition flex flex-col items-center justify-center">
                    <span className="text-2xl mb-1">📸</span> Add Media
                  </button>
                )}
              </CldUploadWidget>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {formData.images.map((img, i) => (
                  <img key={i} src={img} className="w-full h-16 object-cover rounded-lg border border-gray-100" />
                ))}
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100">
              <label className={labelClass}>Category Selection</label>
              <select className={inputClass} value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                {categories.map((cat: any) => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Stock */}
            <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100">
              <label className={labelClass}>Initial Stock Qty</label>
              <input type="number" className={inputClass} placeholder="0"
                value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
