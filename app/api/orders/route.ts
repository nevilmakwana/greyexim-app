import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";

function norm(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

// GET: All orders (used by admin panels in this codebase).
export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(orders, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error: any) {
    console.error("GET Orders Error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}

// POST: Create an order (guest checkout supported).
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionEmail = session?.user?.email || "";

    const body = await req.json();

    const customerName = norm(body?.customerName);
    const email = norm(body?.email) || sessionEmail;
    const phone = norm(body?.phone);

    const address = norm(body?.address || body?.shippingAddress?.address);
    const city = norm(body?.city || body?.shippingAddress?.city);
    const pincode = norm(body?.pincode || body?.shippingAddress?.pincode || body?.zip);
    const country = norm(body?.country || body?.shippingAddress?.country) || "India";

    const cartItems = Array.isArray(body?.cartItems) ? body.cartItems : [];
    const subtotalAmount = Number(body?.subtotalAmount ?? body?.totalAmount ?? 0);
    const shippingAmount = Number(body?.shippingAmount ?? 0);
    const taxAmount = Number(body?.taxAmount ?? 0);
    const discountAmount = Number(body?.discountAmount ?? 0);
    const promoCode = norm(body?.promoCode);
    const totalAmount = Number(body?.totalAmount ?? 0);

    const paymentMethod = norm(body?.paymentMethod) || "COD";
    const paymentStatus = norm(body?.paymentStatus) || (paymentMethod === "COD" ? "unpaid" : "pending");
    const paymentProvider = norm(body?.paymentProvider);
    const paymentId = norm(body?.paymentId);
    const stripeSessionId = norm(body?.stripeSessionId);

    if (!customerName || !email || !phone || !address || !city || !pincode) {
      return NextResponse.json({ message: "Missing required customer/shipping fields" }, { status: 400 });
    }
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ message: "Cart items required" }, { status: 400 });
    }
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return NextResponse.json({ message: "Total amount must be > 0" }, { status: 400 });
    }

    await connectDB();

    const userEmail = sessionEmail || norm(body?.user) || "";

    const order = await Order.create({
      user: userEmail || undefined,
      isGuest: !sessionEmail,
      customerName,
      email,
      phone,
      shippingAddress: { address, city, pincode, country },
      cartItems: cartItems.map((i: any) => ({
        product: i.product || i._id,
        designName: norm(i.designName) || "Unnamed Design",
        designCode: norm(i.designCode) || "N/A",
        price: Number(i.price) || 0,
        quantity: Number(i.quantity) || 1,
        image: norm(i.image) || (Array.isArray(i.images) ? norm(i.images[0]) : ""),
      })),
      subtotalAmount: Number.isFinite(subtotalAmount) && subtotalAmount > 0 ? subtotalAmount : totalAmount,
      shippingAmount: Number.isFinite(shippingAmount) ? shippingAmount : 0,
      taxAmount: Number.isFinite(taxAmount) ? taxAmount : 0,
      discountAmount: Number.isFinite(discountAmount) ? discountAmount : 0,
      promoCode,
      totalAmount,
      currency: norm(body?.currency) || "INR",
      paymentMethod,
      paymentStatus,
      paymentProvider,
      paymentId,
      stripeSessionId,
      status: "Received",
    });

    // Attach to user if logged in
    if (sessionEmail) {
      await User.updateOne({ email: sessionEmail }, { $addToSet: { orders: order._id } });
    }

    return NextResponse.json({ success: true, orderId: String(order._id) }, { status: 201 });
  } catch (error: any) {
    console.error("POST Order Error:", error);
    return NextResponse.json({ error: "Order create failed", message: error.message }, { status: 500 });
  }
}

// PATCH: Update order status (used by admin manufacturing flow).
export async function PATCH(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { orderId, newStatus } = body;

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: "Order ID and New Status are required" }, { status: 400 });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error: any) {
    console.error("PATCH Order Error:", error);
    return NextResponse.json({ error: "Update Failed", message: error.message }, { status: 500 });
  }
}

