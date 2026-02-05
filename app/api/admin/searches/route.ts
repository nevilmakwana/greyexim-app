import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import SearchLog from "@/models/SearchLog";

async function requireAdminCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token === "authenticated";
}

export async function GET(req: Request) {
  try {
    const ok = await requireAdminCookie();
    if (!ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const daysRaw = Number(url.searchParams.get("days") || 30);
    const days = Number.isFinite(daysRaw) ? Math.min(365, Math.max(1, Math.floor(daysRaw))) : 30;

    await connectDB();

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const total = await SearchLog.countDocuments({ createdAt: { $gte: since } });

    const recent = await SearchLog.find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const top = await (SearchLog as any).aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$normalizedTerm",
          term: { $first: "$normalizedTerm" },
          count: { $sum: 1 },
          lastSearchedAt: { $max: "$createdAt" },
        },
      },
      { $sort: { count: -1, lastSearchedAt: -1 } },
      { $limit: 50 },
    ]);

    return NextResponse.json({ rangeDays: days, total, top, recent }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}

