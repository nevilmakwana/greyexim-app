import { NextResponse } from "next/server";
import crypto from "crypto";

import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

function getOrigin(req: Request) {
  const envOrigin =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (envOrigin) return envOrigin.replace(/\/$/, "");
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function formEncode(params: Record<string, string>) {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

export async function POST(req: Request) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY || "";
    if (!secret) {
      return NextResponse.json(
        { message: "Stripe not configured (missing STRIPE_SECRET_KEY)" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const orderId = String(body?.orderId || "").trim();
    if (!orderId) return NextResponse.json({ message: "orderId required" }, { status: 400 });

    await connectDB();
    const order: any = await Order.findById(orderId).lean();
    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

    const origin = getOrigin(req);

    // Stripe requires the amount in the smallest currency unit.
    const amountPaise = Math.max(Math.round(Number(order.totalAmount || 0) * 100), 0);
    if (!amountPaise) return NextResponse.json({ message: "Invalid order amount" }, { status: 400 });

    const successUrl = `${origin}/order-success`;
    const cancelUrl = `${origin}/checkout?canceled=1`;

    // Create a single "order" line item (keeps payload small and stable).
    const params: Record<string, string> = {
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": (order.currency || "INR").toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(amountPaise),
      "line_items[0][price_data][product_data][name]": `GreyExim Order (${order.cartItems?.length || 0} item${(order.cartItems?.length || 0) === 1 ? "" : "s"})`,
      customer_email: String(order.email || ""),
      client_reference_id: String(orderId),
      "metadata[orderId]": String(orderId),
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}`,
      cancel_url: cancelUrl,
    };

    // Idempotency: stable key per order.
    const idemKey = crypto.createHash("sha256").update(`checkout_session:${orderId}`).digest("hex");

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": idemKey,
      },
      body: formEncode(params),
    });

    const data: any = await res.json();
    if (!res.ok) {
      console.error("Stripe session create failed:", data);
      return NextResponse.json({ message: "Stripe session create failed", error: data }, { status: 500 });
    }

    // Save session id on order for later reconciliation
    await Order.findByIdAndUpdate(orderId, {
      $set: {
        paymentMethod: "STRIPE",
        paymentStatus: "pending",
        paymentProvider: "stripe",
        stripeSessionId: data.id || "",
      },
    });

    return NextResponse.json({ url: data.url, sessionId: data.id }, { status: 200 });
  } catch (error: any) {
    console.error("Stripe session error:", error);
    return NextResponse.json({ message: "Stripe session error", error: error.message }, { status: 500 });
  }
}

