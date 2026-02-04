"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CategoryListPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Delete this category?")) {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Deleted!");
        fetchCategories(); // Refresh list
      }
    }
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black">Categories</h1>
          <Link href="/admin/categories/new" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">
            + Add New
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-4 font-bold">Image</th>
                <th className="p-4 font-bold">Name</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat: any) => (
                <tr key={cat._id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <img src={cat.image || "/no-image.png"} className="w-12 h-12 rounded object-cover" />
                  </td>
                  <td className="p-4 font-medium text-black">{cat.name}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(cat._id)} className="text-red-600 font-bold">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}