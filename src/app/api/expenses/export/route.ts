import { db, ensureDb, getSession, addLog } from "@/lib/db";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
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
    const expenses = await db.expense.findMany({ orderBy: { date: "desc" } });

    const data = expenses.map((e) => ({
      日期: e.date.toISOString().split("T")[0],
      金额: e.amount,
      分类: e.category,
      备注: e.note,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "账目");

    ws["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 30 }];

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    await addLog("EXPORT", `导出 Excel, 共 ${expenses.length} 条`);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="expenses_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}