import { NextResponse } from "next/server";
import { getSession, removeSession } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (sessionToken) {
    removeSession(sessionToken);
  }

  cookieStore.delete("session");

  return NextResponse.json({ success: true });
}