import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");

  if (idsParam) {
    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length === 24);

    const products = await Product.find({ _id: { $in: ids } }).lean();
    return NextResponse.json(products);
  }

  const products = await Product.find().lean();
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      designName,
      designCode,
      category,
      description,
      price,
      stock,
      images,
    } = body ?? {};

    const normalizedCategory =
      typeof category === "string" && category.trim().length > 0
        ? category.trim()
        : "General";

    if (!designName || !designCode || price === undefined || price === "") {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedImages = Array.isArray(images)
      ? images
      : images
      ? [images]
      : [];

    const product = await Product.create({
      designName,
      designCode,
      category: normalizedCategory,
      description: description || "",
      price: Number(price),
      stock: Number(stock) || 0,
      images: normalizedImages,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { message: "Error creating product", error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
