import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import HeroSlide from "@/models/HeroSlide";

export async function GET() {
  try {
    await connectDB();
    const slides = await HeroSlide.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    return NextResponse.json(slides);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      image,
      title,
      subtitle,
      ctaText,
      ctaLink,
      order,
      isActive,
    } = body ?? {};

    if (!image || !title) {
      return NextResponse.json(
        { message: "Image and title are required" },
        { status: 400 }
      );
    }

    const slide = await HeroSlide.create({
      image,
      title,
      subtitle: subtitle || "",
      ctaText: ctaText || "Shop Collection",
      ctaLink: ctaLink || "/shop",
      order: Number(order) || 0,
      isActive: isActive !== false,
    });

    return NextResponse.json(slide, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Slide id is required" },
        { status: 400 }
      );
    }

    await HeroSlide.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
