import { NextResponse, type NextRequest } from "next/server";
import { bacaAwam, bacaSemua, modDemo, tulis, type Op } from "@/lib/pelayan/stor";
import { penggunaSemasa } from "@/lib/pelayan/sesi";

const TANPA_CACHE = { "Cache-Control": "no-store" };

// Keadaan penuh stor kongsi bagi pengguna yang log masuk; sebelum log masuk hanya maklumat awam (senarai sekolah).
export async function GET(req: NextRequest) {
  const u = await penggunaSemasa(req);
  const asas = { demo: modDemo(), clientId: process.env.GOOGLE_CLIENT_ID || null };
  if (!u) return NextResponse.json({ ...asas, pengguna: null, stor: await bacaAwam() }, { status: 401, headers: TANPA_CACHE });
  return NextResponse.json({ ...asas, pengguna: { id: u.id }, stor: await bacaSemua() }, { headers: TANPA_CACHE });
}

export async function POST(req: NextRequest) {
  const u = await penggunaSemasa(req);
  if (!u) return NextResponse.json({ ralat: "Sila log masuk." }, { status: 401, headers: TANPA_CACHE });
  let ops: Op[];
  try {
    const b = await req.json();
    ops = Array.isArray(b?.ops) ? b.ops : [];
  } catch {
    return NextResponse.json({ ralat: "Permintaan tidak sah." }, { status: 400, headers: TANPA_CACHE });
  }
  const ditolak = await tulis(u, ops);
  return NextResponse.json({ ok: true, ditolak }, { headers: TANPA_CACHE });
}
