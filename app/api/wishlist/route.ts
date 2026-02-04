import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Wishlist from "@/models/Wishlist";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, productId } = await req.json();

    if (!email || !productId) {
      return NextResponse.json({ error: "Email and ProductId are required" }, { status: 400 });
    }

    // 1. User dhoondein taaki uska ObjectId mil sake
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Check karein ki kya ye item pehle se wishlist mein hai
    const existing = await Wishlist.findOne({ 
      userId: user._id, 
      productId: new mongoose.Types.ObjectId(productId) 
    });

    if (existing) {
      return NextResponse.json({ message: "Already in wishlist" }, { status: 400 });
    }

    // 3. Naya item create karein (userId ke saath)
    const newItem = await Wishlist.create({ 
      userId: user._id,
      userEmail: email, 
      productId: new mongoose.Types.ObjectId(productId) 
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error("Wishlist Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ Wishlist fetch karne ke liye GET method
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const items = await Wishlist.find({ userEmail: email })
      .populate("productId") // Product details fetch karne ke liye
      .sort({ addedAt: -1 });

    return NextResponse.json(items, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { email, productId } = await req.json();

    if (!email || !productId) {
      return NextResponse.json(
        { error: "Email and ProductId are required" },
        { status: 400 }
      );
    }

    const deleted = await Wishlist.findOneAndDelete({
      userEmail: email,
      productId: new mongoose.Types.ObjectId(productId),
    });

    if (!deleted) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
