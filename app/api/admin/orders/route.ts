import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

async function requireAdminCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token === "authenticated";
}

// Admin: GET all orders (pipeline)
export async function GET() {
  try {
    const ok = await requireAdminCookie();
    if (!ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json(orders, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", message: error?.message || "Failed to load orders" },
      { status: 500 }
    );
  }
}

// Admin: PATCH order status
export async function PATCH(req: Request) {
  try {
    const ok = await requireAdminCookie();
    if (!ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { orderId, newStatus } = body || {};

    if (!orderId || !newStatus) {
      return NextResponse.json(
        { error: "Order ID and New Status are required" },
        { status: 400 }
      );
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Update Failed", message: error?.message || "Failed to update" },
      { status: 500 }
    );
  }
}

