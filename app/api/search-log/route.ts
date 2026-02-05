import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import SearchLog from "@/models/SearchLog";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawTerm = typeof body?.term === "string" ? body.term : "";
    const rawSource = typeof body?.source === "string" ? body.source : "unknown";

    const term = rawTerm.trim().slice(0, 80);
    const normalizedTerm = term.toLowerCase();
    const source = rawSource.trim().slice(0, 40) || "unknown";

    // Keep DB clean: ignore empty / 1-character searches (usually accidental taps).
    if (normalizedTerm.length < 2) {
      return NextResponse.json({ success: true, skipped: true }, { status: 200 });
    }

    const session = await getServerSession(authOptions).catch(() => null);
    const userEmail = session?.user?.email || "";

    await connectDB();
    await SearchLog.create({ term, normalizedTerm, userEmail, source });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to log search" },
      { status: 500 }
    );
  }
}

