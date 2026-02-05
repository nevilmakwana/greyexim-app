"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CldUploadWidget } from "next-cloudinary";

interface OrderItem {
  image: string;
  designName: string;
  designCode: string;
  quantity: number;
}

interface Order {
  _id: string;
  totalAmount: number;
  cartItems: OrderItem[];
  status?: string;
  trackingId?: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    country: "India",
    avatar: "",
    marketingOptIn: false,
  });

  const completionScore = () => {
    const fields = [
      profile.name,
      profile.phone,
      profile.address,
      profile.city,
      profile.pincode,
      profile.country,
      profile.avatar,
    ];
    const filled = fields.filter((f) => (f || "").toString().trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  };

  const statusLabel = (s?: string) => (s || "Received").toUpperCase();
  const statusColor = (s?: string) => {
    switch (s) {
      case "Delivered":
        return "bg-green-50 text-green-700 border-green-200";
      case "Shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Quality Check":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Printing":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Fabric Sourcing":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const trackingStepIndex = (s?: string) => {
    if (s === "Delivered") return 2;
    if (s === "Shipped") return 1;
    return 0;
  };

  useEffect(() => {
    if (status !== "authenticated") {
      setLoadingOrders(false);
      return;
    }

    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoadingProfile(false);
      return;
    }

    fetch("/api/user/account")
      .then((res) => res.json())
      .then((data) => {
        setProfile({
          name: data?.name || "",
          email: data?.email || "",
          phone: data?.phone || "",
          address: data?.address || "",
          city: data?.city || "",
          pincode: data?.pincode || "",
          country: data?.country || "India",
          avatar: data?.avatar || "",
          marketingOptIn: Boolean(data?.marketingOptIn),
        });
      })
      .finally(() => setLoadingProfile(false));
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white tracking-widest animate-pulse">LOADING PROFILE...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
        <h1 className="text-xl font-bold">Please login to view profile</h1>
        <Link
          href="/login"
          className="bg-black text-white px-6 py-3 rounded-full text-sm font-bold"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <main className="bg-gradient-to-b from-gray-50 via-white to-white min-h-screen pb-28 font-sans text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="flex items-start justify-between gap-6 pb-6 mb-6 border-b border-dashed">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-blue-600 font-black mb-2">
              Account
            </p>
            <h1 className="text-3xl font-black uppercase">My Profile</h1>
            <p className="text-gray-400 text-xs uppercase tracking-widest mt-1">
              {session?.user?.email}
            </p>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-4 py-2 bg-white border border-gray-200 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-red-50 transition shadow-sm"
          >
            Sign Out
          </button>
        </header>

        <section className="bg-white rounded-3xl border border-gray-100 p-5 mb-8 shadow-sm">
          <div className="flex items-center gap-4">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name || "Profile"}
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-black via-slate-700 to-slate-400 text-white flex items-center justify-center font-black shadow-sm">
                {(profile.name || session?.user?.name || "U").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <p className="font-black text-lg">{profile.name || session?.user?.name || "Your Name"}</p>
              <p className="text-xs text-gray-400">{profile.email || session?.user?.email}</p>
            </div>
            <Link
              href="/wishlist"
              className="text-[10px] uppercase tracking-widest font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full"
            >
              Wishlist
            </Link>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              <span>Profile Complete</span>
              <span>{completionScore()}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-black to-gray-700 rounded-full transition-all duration-500"
                style={{ width: `${completionScore()}%` }}
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 p-5 mb-10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">
              Shipping Details
            </h2>
            <button
              onClick={() => setIsEditing(true)}
              className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full"
            >
              Edit Profile
            </button>
          </div>

          {loadingProfile ? (
            <p className="text-center text-gray-400 text-sm">Loading profile...</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                <span className="text-gray-400 text-xs uppercase tracking-widest">Name</span>
                <span className="font-semibold">{profile.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                <span className="text-gray-400 text-xs uppercase tracking-widest">Phone</span>
                <span className="font-semibold">{profile.phone || "—"}</span>
              </div>
              <div className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Address</p>
                <p className="font-semibold text-sm">{profile.address || "—"}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {(profile.city || "—")} · {(profile.pincode || "—")} · {(profile.country || "—")}
                </p>
              </div>
            </div>
          )}
        </section>

        {saved && (
          <div className="fixed left-4 right-4 bottom-24 bg-black text-white text-xs font-black uppercase tracking-widest py-3 rounded-2xl text-center shadow-2xl">
            Profile saved successfully
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black uppercase tracking-widest">Order History</h2>
            <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">
              {orders.length} Total
            </span>
          </div>

          {loadingOrders ? (
            <p className="text-center text-gray-400">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="text-center bg-gray-50 p-10 rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">
                No Orders Yet
              </p>
              <Link
                href="/shop"
                className="inline-block mt-5 bg-black text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-md"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {orders.map((order) => (
                <div key={order._id} className="bg-white border rounded-3xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      Order #{order._id.slice(-8)}
                    </span>
                    <span className="text-xs font-bold text-black bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">
                      ₹{order.totalAmount}
                    </span>
                  </div>

                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColor(order.status)}`}
                  >
                    {statusLabel(order.status)}
                  </div>

                  {order.trackingId && (
                    <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
                            Tracking ID
                          </p>
                          <p className="text-xs font-semibold text-gray-900">{order.trackingId}</p>
                        </div>
                        <a
                          href={`https://t.17track.net/en#nums=${encodeURIComponent(order.trackingId)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] uppercase tracking-widest font-black text-blue-600"
                        >
                          Track Order
                        </a>
                      </div>

                      <div className="relative mt-4">
                        <div className="absolute left-3 right-3 top-[6px] h-[2px] bg-gray-200 rounded-full" />
                        <div className="flex items-start justify-between relative">
                          {["Packed", "In Transit", "Delivered"].map((step, idx) => {
                            const active = idx <= trackingStepIndex(order.status);
                            return (
                              <div key={step} className="flex flex-col items-center gap-2 w-1/3">
                                <div
                                  className={`w-3 h-3 rounded-full border ${
                                    active ? "bg-black border-black" : "bg-white border-gray-300"
                                  }`}
                                />
                                <span
                                  className={`text-[9px] uppercase tracking-widest font-black ${
                                    active ? "text-gray-900" : "text-gray-400"
                                  }`}
                                >
                                  {step}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    {["Received", "Fabric Sourcing", "Printing", "Quality Check", "Shipped", "Delivered"].map(
                      (step) => (
                        <span
                          key={step}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            step === order.status
                              ? "bg-black text-white border-black"
                              : "bg-gray-50 text-gray-400 border-gray-100"
                          }`}
                        >
                          {step}
                        </span>
                      )
                    )}
                  </div>

                  <div className="space-y-3 mt-4">
                    {order.cartItems?.map((item, i) => (
                      <div key={i} className="flex gap-4 items-center">
                        <img
                          src={item.image}
                          className="w-12 h-12 object-cover rounded-lg border"
                          alt={item.designName}
                        />
                        <div>
                          <p className="font-bold text-sm">
                            {item.quantity}× {item.designName}
                          </p>
                          <p className="text-xs text-gray-400 uppercase">{item.designCode}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center animate-profile-fade">
          <div className="w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto animate-profile-sheet">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest">Edit Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs font-black uppercase tracking-widest text-gray-400"
              >
                Close
              </button>
            </div>

            <div className="flex items-center gap-4 mb-5">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  className="w-14 h-14 rounded-full object-cover border"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-black via-gray-700 to-gray-400 text-white flex items-center justify-center font-black">
                  {(profile.name || session?.user?.name || "U").slice(0, 1).toUpperCase()}
                </div>
              )}
              <CldUploadWidget
                uploadPreset="greyexim_uploads"
                options={{ maxFiles: 1, multiple: false, folder: "greyexim/avatars" }}
                onSuccess={(res: any) => {
                  const url = res?.info?.secure_url;
                  if (url) {
                    setProfile((p) => ({ ...p, avatar: url }));
                  }
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    className="px-4 py-2 bg-gray-100 text-gray-900 rounded-full text-xs font-black uppercase tracking-widest"
                  >
                    Upload Avatar
                  </button>
                )}
              </CldUploadWidget>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Full Name"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold"
              />
              <input
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Phone Number"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold"
              />
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
                    Offers & Updates
                  </p>
                  <p className="text-xs text-gray-500">
                    Send me offers on email/WhatsApp
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setProfile((p) => ({ ...p, marketingOptIn: !p.marketingOptIn }))
                  }
                  className={`w-12 h-7 rounded-full border transition relative ${
                    profile.marketingOptIn
                      ? "bg-black border-black"
                      : "bg-white border-gray-200"
                  }`}
                  aria-label="Toggle marketing opt in"
                >
                  <span
                    className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition ${
                      profile.marketingOptIn ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
              <input
                value={profile.address}
                onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                placeholder="Address"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={profile.city}
                  onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                  placeholder="City"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold"
                />
                <input
                  value={profile.pincode}
                  onChange={(e) => setProfile((p) => ({ ...p, pincode: e.target.value }))}
                  placeholder="Pincode"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold"
                />
              </div>
              <input
                value={profile.country}
                onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
                placeholder="Country"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold"
              />

              <button
                onClick={async () => {
                  setSaving(true);
                  setSaved(false);
                  await fetch("/api/user/account", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(profile),
                  });
                  setSaving(false);
                  setSaved(true);
                  setIsEditing(false);
                  setTimeout(() => setSaved(false), 2000);
                }}
                className="w-full bg-black text-white py-3 rounded-2xl font-black uppercase text-xs tracking-widest"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Details"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
