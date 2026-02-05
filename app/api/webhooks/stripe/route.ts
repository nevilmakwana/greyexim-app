import { NextResponse } from "next/server";
import crypto from "crypto";

import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

function timingSafeEqualHex(a: string, b: string) {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function verifyStripeSignature(payload: string, sigHeader: string, secret: string) {
  // Header example: "t=123,v1=abc,v1=def"
  const parts = sigHeader.split(",").map((p) => p.trim());
  const tPart = parts.find((p) => p.startsWith("t="));
  const v1Parts = parts.filter((p) => p.startsWith("v1="));
  if (!tPart || v1Parts.length === 0) return false;

  const timestamp = tPart.slice(2);
  const signed = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
  return v1Parts.some((p) => timingSafeEqualHex(expected, p.slice(3)));
}

export async function POST(req: Request) {
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
    if (!secret) {
      return NextResponse.json({ message: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
    }

    const sig = req.headers.get("stripe-signature") || "";
    const payload = await req.text();

    if (!sig || !verifyStripeSignature(payload, sig, secret)) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    const event: any = JSON.parse(payload);
    const type = String(event?.type || "");

    await connectDB();

    if (type === "checkout.session.completed") {
      const session = event?.data?.object || {};
      const orderId = session?.metadata?.orderId || session?.client_reference_id || "";
      const paymentIntent = session?.payment_intent || "";

      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          $set: {
            paymentMethod: "STRIPE",
            paymentStatus: "paid",
            paymentProvider: "stripe",
            paymentId: paymentIntent || session.id || "",
            stripeSessionId: session.id || "",
          },
        });
      }
    }

    if (type === "checkout.session.expired") {
      const session = event?.data?.object || {};
      const orderId = session?.metadata?.orderId || session?.client_reference_id || "";
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, { $set: { paymentStatus: "failed" } });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ message: "Webhook error", error: error.message }, { status: 500 });
  }
}

