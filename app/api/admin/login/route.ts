import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    // Check against the secret password in .env
    if (password === process.env.ADMIN_PASSWORD) {
      
      // ✅ Password Correct! Set a cookie (The "VIP Pass")
      // Note: In Next.js 15, cookies() is awaited
      const cookieStore = await cookies();
      cookieStore.set("admin_token", "authenticated", {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false }, { status: 401 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}