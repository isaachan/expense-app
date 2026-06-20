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

export async function GET(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, m] = month.split("-").map(Number);
      startDate = new Date(year, m - 1, 1);
      endDate = new Date(year, m, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const expenses = await db.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "desc" },
    });

    const categoryMap = new Map<string, number>();
    let totalAmount = 0;
    let dailyMap = new Map<string, number>();

    for (const e of expenses) {
      totalAmount += e.amount;
      categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amount);
      const dayKey = e.date.toISOString().split("T")[0];
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + e.amount);
    }

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount);

    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalCount: expenses.length,
      categoryBreakdown,
      dailyTrend,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}