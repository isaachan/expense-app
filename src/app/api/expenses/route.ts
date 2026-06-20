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

export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    await ensureDb();
    const expenses = await db.expense.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    await ensureDb();
    const body = await request.json();
    const { date, amount, category, note } = body;

    if (!date || amount == null || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const expense = await db.expense.create({
      data: {
        date: new Date(date),
        amount: parseFloat(amount),
        category,
        note: note || "",
      },
    });

    await addLog("CREATE_EXPENSE", `新增: ${date} ${amount}元 [${category}] ${note || ""}`);

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}