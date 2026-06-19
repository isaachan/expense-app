import { NextResponse } from "next/server";
import { db, ensureDb, getSession } from "@/lib/db";
import { cookies } from "next/headers";

// GET: list all whitelisted users
export async function GET() {
  await ensureDb();
  const users = await db.whitelistUser.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

// POST: add user to whitelist (requires admin secret or existing session)
export async function POST(request: Request) {
  try {
    await ensureDb();
    const body = await request.json();
    const { openid, nickname, secret } = body;

    if (!openid) {
      return NextResponse.json({ error: "openid is required" }, { status: 400 });
    }

    // Auth check: either provide admin secret or be an existing authenticated user
    const adminSecret = process.env.ADMIN_SECRET;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    const session = sessionToken ? getSession(sessionToken) : null;

    if (adminSecret && secret !== adminSecret && !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const user = await db.whitelistUser.upsert({
      where: { openid },
      update: { nickname: nickname || "" },
      create: { openid, nickname: nickname || "" },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add user" }, { status: 500 });
  }
}

// DELETE: remove user from whitelist
export async function DELETE(request: Request) {
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const openid = searchParams.get("openid");

    if (!openid) {
      return NextResponse.json({ error: "openid is required" }, { status: 400 });
    }

    await db.whitelistUser.delete({ where: { openid } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove user" }, { status: 500 });
  }
}