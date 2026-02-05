import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Wishlist from "@/models/Wishlist";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const items = await Wishlist.find().populate("productId").sort({ addedAt: -1 }).lean();

    const header = [
      "email",
      "phone",
      "product_name",
      "product_code",
      "price",
      "added_at",
      "opt_in",
      "lead_status",
      "lead_notes",
    ];

    const rows = [header.join(",")];
    for (const item of items as any[]) {
      const p = item.productId || {};
      const line = [
        item.userEmail || "",
        item.userPhone || "",
        (p.designName || "").replace(/,/g, " "),
        (p.designCode || "").replace(/,/g, " "),
        p.price || "",
        item.addedAt ? new Date(item.addedAt).toISOString() : "",
        item.marketingOptIn ? "yes" : "no",
        item.leadStatus || "",
        (item.leadNotes || "").replace(/,/g, " "),
      ];
      rows.push(line.join(","));
    }

    const csv = rows.join("\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=wishlist_leads.csv",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
