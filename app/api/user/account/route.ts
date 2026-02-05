import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Wishlist from "@/models/Wishlist";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user: any = await User.findOne({ email: session.user.email }).lean();

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: user.name || "",
    email: user.email || "",
    avatar: user.avatar || "",
    phone: user.phone || "",
    address: user.address || "",
    city: user.city || "",
    pincode: user.pincode || "",
    country: user.country || "India",
    marketingOptIn: Boolean(user.marketingOptIn),
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, phone, address, city, pincode, country, avatar, marketingOptIn } = body ?? {};

  await connectDB();

  const updated: any = await User.findOneAndUpdate(
    { email: session.user.email },
    {
      name: name || "",
      avatar: avatar || "",
      phone: phone || "",
      address: address || "",
      city: city || "",
      pincode: pincode || "",
      country: country || "India",
      marketingOptIn: Boolean(marketingOptIn),
    },
    { new: true }
  ).lean();

  // Keep wishlist entries in sync for outreach rules (opt-in + phone updates).
  await Wishlist.updateMany(
    { userEmail: session.user.email },
    {
      $set: {
        marketingOptIn: Boolean(updated?.marketingOptIn),
        userPhone: updated?.phone || "",
      },
    }
  );

  return NextResponse.json({
    success: true,
    user: {
      name: updated?.name || "",
      email: updated?.email || "",
      avatar: updated?.avatar || "",
      phone: updated?.phone || "",
      address: updated?.address || "",
      city: updated?.city || "",
      pincode: updated?.pincode || "",
      country: updated?.country || "India",
      marketingOptIn: Boolean(updated?.marketingOptIn),
    },
  });
}
