import { NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    const inviteCode = process.env.INVITE_CODE;

    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code not configured" }, { status: 500 });
    }

    if (!code || code !== inviteCode) {
      return NextResponse.json({ error: "邀请码错误" }, { status: 403 });
    }

    const sessionToken = crypto.randomUUID();
    setSession(sessionToken, { role: "user" });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}