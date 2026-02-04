import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";

// 1. GET: Fetch all categories from the database
export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ createdAt: -1 });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching categories", error },
      { status: 500 }
    );
  }
}

// 2. POST: Create a new category
export async function POST(req: Request) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { name, slug, image, description } = body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return NextResponse.json(
        { message: "Category with this slug already exists" },
        { status: 400 }
      );
    }

    const newCategory = await Category.create({
      name,
      slug,
      image,
      description,
    });

    return NextResponse.json(
      { message: "Category created successfully", category: newCategory },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: "Error creating category", error },
      { status: 500 }
    );
  }
}

// ✅ 3. DELETE: Remove a category by ID (NEW FEATURE)
export async function DELETE(req: Request) {
  try {
    await connectDB();
    
    // Get the ID from the URL search parameters (e.g., /api/categories?id=123)
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Category ID is required" },
        { status: 400 }
      );
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: "Error deleting category", error },
      { status: 500 }
    );
  }
}