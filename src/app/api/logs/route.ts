import { db, ensureDb, getSession } from "@/lib/db";
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

// GET /api/logs — list operation logs, with optional filters
export async function GET(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    const where = action ? { action } : {};

    const [logs, total] = await Promise.all([
      db.operationLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.operationLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, page, pageSize });
  } catch {
    return NextResponse.json({ error: "获取日志失败" }, { status: 500 });
  }
}