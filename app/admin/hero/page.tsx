"use client";

import { useEffect, useState } from "react";
import { CldUploadWidget } from "next-cloudinary";

interface Slide {
  _id: string;
  image: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  order?: number;
}

export default function AdminHeroSlides() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    image: "",
    title: "",
    subtitle: "",
    ctaText: "Shop Collection",
    ctaLink: "/shop",
    order: 0,
  });

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hero-slides");
      const data = await res.json();
      setSlides(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleCreate = async () => {
    if (!form.image || !form.title) {
      alert("Image and title are required.");
      return;
    }
    const res = await fetch("/api/hero-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({
        image: "",
        title: "",
        subtitle: "",
        ctaText: "Shop Collection",
        ctaLink: "/shop",
        order: 0,
      });
      fetchSlides();
    } else {
      const err = await res.json().catch(() => null);
      alert(err?.message || "Failed to create slide");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/hero-slides?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSlides((prev) => prev.filter((s) => s._id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tighter">Hero Slides</h1>
        <button
          onClick={handleCreate}
          className="bg-black text-white px-6 py-3 rounded-full font-bold"
        >
          Save Slide
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-black mb-4">Slide Image</h2>
            <CldUploadWidget
              uploadPreset="greyexim_uploads"
              onSuccess={(res: any) =>
                setForm((prev) => ({ ...prev, image: res.info.secure_url }))
              }
            >
              {({ open }: any) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 text-gray-400 font-bold hover:bg-blue-50 hover:text-blue-600 transition flex flex-col items-center justify-center"
                >
                  Upload Image
                </button>
              )}
            </CldUploadWidget>
            {form.image && (
              <img
                src={form.image}
                alt="Preview"
                className="mt-4 w-full h-40 object-cover rounded-xl border"
              />
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-black mb-4">Content</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="w-full p-3 border rounded-xl"
                placeholder="Title (e.g. Premium Digital Scarves)"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
              <input
                className="w-full p-3 border rounded-xl"
                placeholder="Subtitle (optional)"
                value={form.subtitle}
                onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
              />
              <input
                className="w-full p-3 border rounded-xl"
                placeholder="CTA Text"
                value={form.ctaText}
                onChange={(e) => setForm((p) => ({ ...p, ctaText: e.target.value }))}
              />
              <input
                className="w-full p-3 border rounded-xl"
                placeholder="CTA Link"
                value={form.ctaLink}
                onChange={(e) => setForm((p) => ({ ...p, ctaLink: e.target.value }))}
              />
              <input
                className="w-full p-3 border rounded-xl"
                type="number"
                placeholder="Order (0 = first)"
                value={form.order}
                onChange={(e) =>
                  setForm((p) => ({ ...p, order: Number(e.target.value) || 0 }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-black mb-4">Existing Slides</h2>
        {loading ? (
          <p>Loading...</p>
        ) : slides.length === 0 ? (
          <p className="text-gray-400">No slides yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {slides.map((slide) => (
              <div key={slide._id} className="bg-white border rounded-2xl overflow-hidden">
                <img src={slide.image} alt={slide.title} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h3 className="font-bold">{slide.title}</h3>
                  <p className="text-sm text-gray-500">{slide.subtitle}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-400">Order: {slide.order ?? 0}</span>
                    <button
                      onClick={() => handleDelete(slide._id)}
                      className="text-xs bg-black text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
