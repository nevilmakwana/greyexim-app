import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

// 1. GET: Sabhi orders fetch karne ke liye (Admin Pipeline ke liye)
export async function GET() {
  try {
    // Database connection ensure karein
    await connectDB();

    // Sabhi orders fetch karein aur latest orders ko upar rakhein
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .lean(); // Lean() use karne se performance fast hoti hai aur plain JSON milta hai

    // Agar orders mil jayein toh response bhejrein
    return NextResponse.json(orders, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0", // Taaki hamesha fresh data dikhe
      },
    });
  } catch (error: any) {
    console.error("Admin GET Orders Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

// 2. PATCH: Order status update karne ke liye (Manufacturing Flow management)
export async function PATCH(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { orderId, newStatus } = body;

    // Validation: Check karein ki zaroori fields hain ya nahi
    if (!orderId || !newStatus) {
      return NextResponse.json(
        { error: "Order ID and New Status are required" },
        { status: 400 }
      );
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true, runValidators: true } // Validators run karein taaki galat status set na ho
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error: any) {
    console.error("Admin PATCH Order Error:", error);
    return NextResponse.json(
      { error: "Update Failed", message: error.message },
      { status: 500 }
    );
  }
}