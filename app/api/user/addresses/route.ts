import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

function normalizeString(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function asBool(v: unknown) {
  return v === true || v === "true" || v === 1 || v === "1";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user: any = await User.findOne({ email }).lean();
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

  const addresses = Array.isArray(user.addresses) ? user.addresses : [];
  addresses.sort((a: any, b: any) => Number(Boolean(b?.isDefault)) - Number(Boolean(a?.isDefault)));

  return NextResponse.json({ addresses }, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const label = normalizeString(body?.label) || "Home";
  const name = normalizeString(body?.name);
  const phone = normalizeString(body?.phone);
  const address = normalizeString(body?.address);
  const city = normalizeString(body?.city);
  const pincode = normalizeString(body?.pincode);
  const country = normalizeString(body?.country) || "India";
  const isDefault = asBool(body?.isDefault);

  await connectDB();
  const user: any = await User.findOne({ email });
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

  if (isDefault) {
    user.addresses = (user.addresses || []).map((a: any) => ({ ...a.toObject?.(), isDefault: false }));
  }

  user.addresses = user.addresses || [];
  user.addresses.push({ label, name, phone, address, city, pincode, country, isDefault: isDefault || user.addresses.length === 0 });

  // If it's the first address, force default.
  if (user.addresses.length === 1) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  return NextResponse.json({ success: true, addresses: user.addresses }, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const addressId = normalizeString(body?.id);
  if (!addressId) return NextResponse.json({ message: "Address id required" }, { status: 400 });

  await connectDB();
  const user: any = await User.findOne({ email });
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

  const addr = (user.addresses || []).id(addressId);
  if (!addr) return NextResponse.json({ message: "Address not found" }, { status: 404 });

  const next = {
    label: normalizeString(body?.label) || addr.label,
    name: normalizeString(body?.name) || addr.name,
    phone: normalizeString(body?.phone) || addr.phone,
    address: normalizeString(body?.address) || addr.address,
    city: normalizeString(body?.city) || addr.city,
    pincode: normalizeString(body?.pincode) || addr.pincode,
    country: normalizeString(body?.country) || addr.country,
    isDefault: asBool(body?.isDefault),
  };

  if (next.isDefault) {
    user.addresses = (user.addresses || []).map((a: any) => ({ ...a.toObject?.(), isDefault: false }));
  }

  Object.assign(addr, { ...next, isDefault: next.isDefault || addr.isDefault });
  await user.save();

  return NextResponse.json({ success: true, addresses: user.addresses }, { status: 200 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = normalizeString(url.searchParams.get("id"));
  if (!id) return NextResponse.json({ message: "Address id required" }, { status: 400 });

  await connectDB();
  const user: any = await User.findOne({ email });
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

  const existing = (user.addresses || []).id(id);
  if (!existing) return NextResponse.json({ message: "Address not found" }, { status: 404 });

  const wasDefault = Boolean(existing.isDefault);
  existing.deleteOne();
  await user.save();

  // Ensure there is always a default if any address remains.
  if (wasDefault && user.addresses?.length) {
    user.addresses[0].isDefault = true;
    await user.save();
  }

  return NextResponse.json({ success: true, addresses: user.addresses || [] }, { status: 200 });
}

