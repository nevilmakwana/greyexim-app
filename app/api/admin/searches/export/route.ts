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
    const days = Number.isFinite(daysRaw)
      ? Math.min(365, Math.max(1, Math.floor(daysRaw)))
      : 30;

    await connectDB();

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const top = await (SearchLog as any).aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$normalizedTerm",
          term: { $first: "$normalizedTerm" },
          count: { $sum: 1 },
          lastSearchedAt: { $max: "$createdAt" },
          uniqueUsers: {
            $addToSet: {
              $cond: [{ $ifNull: ["$userEmail", false] }, "$userEmail", null],
            },
          },
        },
      },
      {
        $addFields: {
          uniqueUsersCount: {
            $size: {
              $filter: { input: "$uniqueUsers", as: "u", cond: { $ne: ["$$u", null] } },
            },
          },
        },
      },
      { $sort: { count: -1, lastSearchedAt: -1 } },
      { $limit: 1000 },
    ]);

    const header = ["term", "count", "unique_users", "last_searched_at"];
    const rows = [header.join(",")];

    for (const row of top as any[]) {
      const term = (row?.term || "").toString().replace(/,/g, " ");
      const count = row?.count ?? 0;
      const uniqueUsers = row?.uniqueUsersCount ?? 0;
      const last = row?.lastSearchedAt ? new Date(row.lastSearchedAt).toISOString() : "";
      rows.push([term, count, uniqueUsers, last].join(","));
    }

    const csv = rows.join("\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=search_terms_last_${days}_days.csv`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Export failed" },
      { status: 500 }
    );
  }
}

