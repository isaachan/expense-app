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

export async function POST(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    await ensureDb();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      const dateStr = row["日期"] || row["date"] || row["Date"];
      const amount = row["金额"] || row["amount"] || row["Amount"];
      const category = row["分类"] || row["category"] || row["Category"];
      const note = row["备注"] || row["note"] || row["Note"] || "";

      if (!dateStr || amount == null || !category) {
        skipped++;
        continue;
      }

      const date = new Date(String(dateStr));
      if (isNaN(date.getTime())) {
        skipped++;
        continue;
      }

      await db.expense.create({
        data: {
          date,
          amount: parseFloat(String(amount)),
          category: String(category),
          note: String(note),
        },
      });
      imported++;
    }

    await addLog("IMPORT", `导入 Excel: 成功 ${imported} 条, 跳过 ${skipped} 条`);

    return NextResponse.json({ imported, skipped });
  } catch (error) {
    return NextResponse.json({ error: "Failed to import" }, { status: 500 });
  }
}