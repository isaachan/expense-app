import { NextResponse } from "next/server";
import { db, ensureDb, setSession, addLog } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    await ensureDb();
    const { code } = await request.json();

    if (!code || !code.trim()) {
      return NextResponse.json({ error: "请输入邀请码" }, { status: 400 });
    }

    const inviteCode = await db.inviteCode.findUnique({
      where: { code: code.trim() },
    });

    if (!inviteCode) {
      await addLog("LOGIN_FAILED", `邀请码不存在: ${code.trim()}`);
      return NextResponse.json({ error: "邀请码错误" }, { status: 403 });
    }

    if (!inviteCode.active) {
      await addLog("LOGIN_FAILED", `邀请码已禁用: ${code.trim()}`);
      return NextResponse.json({ error: "邀请码已失效" }, { status: 403 });
    }

    // Increment used count
    await db.inviteCode.update({
      where: { id: inviteCode.id },
      data: { usedCount: { increment: 1 } },
    });

    await addLog("LOGIN_SUCCESS", `使用邀请码: ${code.trim()}`);

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