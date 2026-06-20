import { db, ensureDb, addLog, getSession } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token || !getSession(token)) {
    return null;
  }
  return true;
}

// GET /api/invite-codes — list all invite codes
export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    await ensureDb();
    const codes = await db.inviteCode.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(codes);
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// POST /api/invite-codes — create new invite code
export async function POST(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    await ensureDb();
    const { code, note } = await request.json();
    if (!code || !code.trim()) {
      return NextResponse.json({ error: "邀请码不能为空" }, { status: 400 });
    }
    const trimmed = code.trim();
    const existing = await db.inviteCode.findUnique({ where: { code: trimmed } });
    if (existing) {
      return NextResponse.json({ error: "邀请码已存在" }, { status: 409 });
    }
    const created = await db.inviteCode.create({
      data: { code: trimmed, note: note || "" },
    });
    await addLog("CREATE_INVITE_CODE", `创建邀请码: ${trimmed}, 备注: ${note || "无"}`);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

// PUT /api/invite-codes — toggle active or update note
export async function PUT(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    await ensureDb();
    const { id, active, note } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    }
    const updateData: { active?: boolean; note?: string } = {};
    if (active !== undefined) updateData.active = active;
    if (note !== undefined) updateData.note = note;

    const updated = await db.inviteCode.update({
      where: { id },
      data: updateData,
    });
    const detail = active !== undefined ? `切换邀请码状态: ${updated.code} -> ${active ? "启用" : "禁用"}` : `修改邀请码备注: ${updated.code} -> ${note}`;
    await addLog("UPDATE_INVITE_CODE", detail);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// DELETE /api/invite-codes — delete invite code
export async function DELETE(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    }
    const code = await db.inviteCode.findUnique({ where: { id } });
    if (!code) {
      return NextResponse.json({ error: "邀请码不存在" }, { status: 404 });
    }
    await db.inviteCode.delete({ where: { id } });
    await addLog("DELETE_INVITE_CODE", `删除邀请码: ${code.code}`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}