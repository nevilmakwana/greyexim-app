"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (data.success) {
      router.push("/admin"); // ✅ Redirect to Dashboard
    } else {
      setError(true); // ❌ Wrong password
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 font-sans">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-96 text-center">
        <h1 className="text-2xl font-bold mb-2">Admin Login 🔒</h1>
        <p className="text-gray-500 mb-6">Enter password to manage store</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="password" 
            placeholder="Enter Password" 
            className="w-full p-4 border rounded-xl outline-none focus:ring-2 focus:ring-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-500 text-sm font-bold">❌ Wrong Password</p>}

          <button className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition">
            Unlock Dashboard
          </button>
        </form>
        
        <a href="/" className="block mt-6 text-sm text-gray-400 hover:text-black">← Back to Store</a>
      </div>
    </div>
  );
}