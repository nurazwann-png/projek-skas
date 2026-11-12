import { NextResponse } from "next/server";
import { buangSesi } from "@/lib/pelayan/sesi";

export async function POST() {
  return buangSesi(NextResponse.json({ ok: true }));
}
