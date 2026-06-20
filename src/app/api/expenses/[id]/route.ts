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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    await ensureDb();
    const { id } = await params;
    const expense = await db.expense.findUnique({ where: { id } });
    if (expense) {
      await addLog("DELETE_EXPENSE", `删除: ${expense.date.toISOString().split("T")[0]} ${expense.amount}元 [${expense.category}] ${expense.note}`);
    }
    await db.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    await ensureDb();
    const { id } = await params;
    const body = await request.json();
    const { date, amount, category, note } = body;

    const old = await db.expense.findUnique({ where: { id } });

    const expense = await db.expense.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(amount != null && { amount: parseFloat(amount) }),
        ...(category && { category }),
        ...(note !== undefined && { note }),
      },
    });

    if (old) {
      await addLog("UPDATE_EXPENSE", `修改: ${old.date.toISOString().split("T")[0]} ${old.amount}元 -> ${date || old.date} ${amount ?? old.amount}元 [${category || old.category}]`);
    }

    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}