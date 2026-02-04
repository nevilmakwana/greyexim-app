import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import products from "@/models/Product";
import categories from "@/models/Category";
// import Order from "@/models/Order"; // Uncomment once you have an Order model

export async function GET() {
  try {
    await connectDB();

    // Fetch counts in parallel for better performance
    const [totalProducts, activeCategories] = await Promise.all([
      products.countDocuments(),
      categories.countDocuments({ isActive: true }),
      // Order.countDocuments({ status: 'new' }) // Example for new orders
    ]);

    return NextResponse.json({
      totalProducts,
      activeCategories,
      newOrders: 0, // Replace with real count once Order model is ready
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching dashboard stats", error },
      { status: 500 }
    );
  }
}