import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Wishlist from "@/models/Wishlist";

type Channel = "email" | "whatsapp" | "both";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { wishlistId, channel } = await req.json();
    if (!wishlistId || !channel) {
      return NextResponse.json({ error: "wishlistId and channel required" }, { status: 400 });
    }

    await connectDB();
    const item: any = await Wishlist.findById(wishlistId)
      .populate("productId")
      .lean();
    if (!item) {
      return NextResponse.json({ error: "Wishlist item not found" }, { status: 404 });
    }

    if (!item.marketingOptIn) {
      return NextResponse.json({ error: "User has not opted in" }, { status: 403 });
    }

    const product: any = item.productId || {};
    const productName = product.designName || "your saved product";
    const productCode = product.designCode || "";
    const productPrice = product.price ? `₹${product.price}` : "";

    const subject = `GreyExim: ${productName}`;
    const body = `Hi,\n\nWe noticed you saved \"${productName}\" in your wishlist.\nWould you like a special offer or more details?\n\n${productName} ${productCode}\n${productPrice}\n\nThanks,\nGreyExim Team`;

    const results: any = {};

    if (channel === "email" || channel === "both") {
      const resendKey = process.env.RESEND_API_KEY;
      const resendFrom = process.env.RESEND_FROM_EMAIL;
      if (!resendKey || !resendFrom) {
        return NextResponse.json({ error: "Resend not configured" }, { status: 400 });
      }

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: item.userEmail,
          subject,
          text: body,
        }),
      });
      results.email = await emailRes.json();
    }

    if (channel === "whatsapp" || channel === "both") {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_WHATSAPP_FROM;
      if (!sid || !token || !from) {
        return NextResponse.json({ error: "Twilio WhatsApp not configured" }, { status: 400 });
      }
      const to = item.userPhone ? `whatsapp:${item.userPhone}` : "";
      if (!to) {
        return NextResponse.json({ error: "User phone missing" }, { status: 400 });
      }

      const form = new URLSearchParams();
      form.append("From", `whatsapp:${from}`);
      form.append("To", to);
      form.append("Body", `Hi! We saw you saved \"${productName}\" in your GreyExim wishlist. Want a special offer?`);

      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: form.toString(),
        }
      );
      results.whatsapp = await twilioRes.json();
    }

    return NextResponse.json({ success: true, results }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
