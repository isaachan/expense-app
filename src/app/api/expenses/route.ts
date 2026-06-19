import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const expenses = await db.expense.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}