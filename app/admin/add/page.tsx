"use client";

import { useState, useEffect, useCallback } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { useRouter } from "next/navigation";

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  const fetchCats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setDbCategories(data);
        setFormData((prev) => {
          if (prev.category) return prev;
          const first = data?.[0]?.name;
          return first ? { ...prev, category: first } : prev;
        });
      } else {
        setDbCategories([]);
      }
    } catch (error) {
      console.error("Failed to fetch categories", error);
      setDbCategories([]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }, []);

  useEffect(() => {
    fetchCats();
  }, [fetchCats]);

  const price = Number(formData.price) || 0;
  const cost = Number(formData.costPrice) || 0;
  const profit = price - cost;
  const margin = price > 0 ? ((profit / price) * 100).toFixed(0) : 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      alert("✅ Product Added Successfully!");
      router.push("/admin/manage");
    } else {
      const err = await res.json().catch(() => null);
      alert(err?.message || "❌ Failed to add product.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit}>
        
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-6">
            {/* ✅ Main Heading: Black */}
            <h1 className="text-4xl font-black text-black">Add New Product</h1>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transition active:scale-95">
                {loading ? "Saving..." : "Save Product"}
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-8">
                
                {/* Product Info */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    {/* ✅ Section Heading: Black */}
                    <h2 className="text-xl font-black text-black mb-6">Product Info</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                            {/* ✅ Input Text: Dark Gray */}
                            <input type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 outline-none" 
                                placeholder="e.g. Red Floral Scarf"
                                value={formData.designName} onChange={(e) => setFormData((prev) => ({ ...prev, designName: e.target.value }))} 
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Ribbon (Optional)</label>
                            <input type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 outline-none" 
                                placeholder="e.g. New Arrival"
                                value={formData.ribbon} onChange={(e) => setFormData((prev) => ({ ...prev, ribbon: e.target.value }))} 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                        {/* ✅ Textarea Text: Dark Gray */}
                        <textarea rows={5} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 outline-none" 
                            placeholder="Describe your product..."
                            value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} 
                        />
                    </div>
                </div>

                {/* Pricing & Profit */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-black text-black mb-6">Pricing</h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Price (₹)</label>
                            <input type="number" className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 outline-none" 
                                value={formData.price} onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Cost of Goods (₹)</label>
                            <input type="number" className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 outline-none" 
                                value={formData.costPrice} onChange={(e) => setFormData((prev) => ({ ...prev, costPrice: e.target.value }))} 
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 font-bold uppercase">Profit</p>
                            <p className="text-lg font-black text-green-600">₹{profit}</p>
                        </div>
                        <div className="flex-1 border-l border-gray-200 pl-4">
                            <p className="text-xs text-gray-500 font-bold uppercase">Margin</p>
                            <p className="text-lg font-black text-blue-600">{margin}%</p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <input type="checkbox" id="onSale" className="w-5 h-5 accent-blue-600" 
                            checked={formData.onSale} onChange={(e) => setFormData((prev) => ({ ...prev, onSale: e.target.checked }))} 
                        />
                        <label htmlFor="onSale" className="font-bold text-gray-700 cursor-pointer">On Sale?</label>
                    </div>
                </div>

                {/* Inventory & Shipping */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-black text-black mb-6">Inventory & Shipping</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">SKU (Code)</label>
                            <input type="text" className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 outline-none" 
                                value={formData.designCode} onChange={(e) => setFormData((prev) => ({ ...prev, designCode: e.target.value }))} 
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Stock Status</label>
                            <select className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700 outline-none">
                                <option>In Stock</option>
                                <option>Out of Stock</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Shipping Weight (kg)</label>
                            <input type="number" className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 outline-none" 
                                value={formData.shippingWeight} onChange={(e) => setFormData((prev) => ({ ...prev, shippingWeight: e.target.value }))} 
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                         <label className="block text-sm font-bold text-gray-700 mb-1">Quantity Available</label>
                         <input type="number" className="w-full md:w-1/3 p-3 border border-gray-300 rounded-lg text-gray-700 outline-none" 
                            value={formData.stock} onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))} 
                        />
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-8">
                {/* Images */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-black text-black mb-6">Images</h2>
                    <CldUploadWidget
                      uploadPreset="greyexim_uploads"
                      onSuccess={(res: any) =>
                        setFormData((prev) => ({
                          ...prev,
                          images: [...prev.images, res?.info?.secure_url].filter(Boolean) as string[],
                        }))
                      }
                    >
                        {({ open }: any) => (
                            <button type="button" onClick={() => open()} className="w-full h-32 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition flex flex-col items-center justify-center">
                                <span className="text-2xl mb-2">📸</span>
                                Add Images
                            </button>
                        )}
                    </CldUploadWidget>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {formData.images.map((img, i) => (
                            <img key={i} src={img} alt="Preview" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                        ))}
                    </div>
                </div>

                {/* Category Selection */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-black">Category</h2>
                        <button 
                          type="button" 
                          onClick={fetchCats}
                          className={`p-2 rounded-full hover:bg-gray-100 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                        </button>
                    </div>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {dbCategories.length > 0 ? (
                            dbCategories.map((cat) => (
                                <div key={cat._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition group">
                                    <input 
                                        type="radio" 
                                        id={cat._id}
                                        name="category" 
                                        checked={formData.category === cat.name}
                                        onChange={() => setFormData((prev) => ({ ...prev, category: cat.name }))}
                                        className="w-4 h-4 text-blue-600 cursor-pointer accent-blue-600"
                                    />
                                    {/* ✅ Category Labels: Dark Gray */}
                                    <label htmlFor={cat._id} className="text-gray-700 cursor-pointer w-full capitalize font-bold group-hover:text-black">
                                      {cat.name}
                                    </label>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-400 italic py-2">
                              No categories found. Create one in{" "}
                              <button
                                type="button"
                                onClick={() => router.push("/admin/categories/new")}
                                className="text-blue-600 font-bold underline underline-offset-2"
                              >
                                Categories
                              </button>
                              .
                            </p>
                        )}
                    </div>
                </div>
            </div>

        </div>
        </form>
      </div>
    </div>
  );
}
