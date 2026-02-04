"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCategoryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // ✅ AUTO-SLUG LOGIC: If user types the Name, update the Slug automatically
    if (name === "name") {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") // Replace spaces/special chars with -
        .replace(/^-+|-+$/g, "");    // Remove leading/trailing -
        
      setFormData({ 
        ...formData, 
        name: value, 
        slug: generatedSlug 
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      alert("Category Created Successfully!");
      router.push("/admin/categories");
    } else {
      const errorData = await res.json();
      alert(errorData.message || "Error creating category");
    }
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen flex justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
        <h1 className="text-2xl font-bold mb-6 text-black">Add New Category</h1>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Category Name</label>
            <input
              type="text"
              name="name"
              required
              className="w-full border border-gray-300 rounded-lg p-3 text-black outline-none focus:border-blue-500"
              placeholder="e.g. Silk Collection"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">URL Slug (Auto-generated)</label>
            <input
              type="text"
              name="slug"
              required
              className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-500 outline-none"
              placeholder="silk-collection"
              value={formData.slug}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows={3}
              className="w-full border border-gray-300 rounded-lg p-3 text-black outline-none focus:border-blue-500"
              placeholder="Describe this category..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Image URL</label>
            <input
              type="text"
              name="image"
              className="w-full border border-gray-300 rounded-lg p-3 text-black outline-none focus:border-blue-500"
              placeholder="https://example.com/image.jpg"
              value={formData.image}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push("/admin/categories")}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold transition shadow-md"
            >
              Save Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}