import { NextResponse, type NextRequest } from "next/server";
import { cariPenggunaEmel, DOMAIN_RASMI, domain, modDemo } from "@/lib/pelayan/stor";
import { tetapSesi } from "@/lib/pelayan/sesi";

// Log masuk tanpa Google untuk demonstrasi dan pembangunan. Dimatikan kecuali MOD_DEMO=1.
export async function POST(req: NextRequest) {
  if (!modDemo()) return NextResponse.json({ ok: false, mesej: "Mod demo tidak aktif." }, { status: 404 });
  const { emel } = await req.json().catch(() => ({}));
  const e = String(emel || "").trim().toLowerCase();
  const u = await cariPenggunaEmel(e);
  if (u) return tetapSesi(NextResponse.json({ ok: true, uid: u.id }), u.id);
  if (!DOMAIN_RASMI.includes(domain(e))) {
    return NextResponse.json({ ok: false, mesej: `Emel ini belum berdaftar. Pendaftaran hanya untuk emel rasmi KPM (${DOMAIN_RASMI.map((d) => "@" + d).join(" atau ")}).` }, { status: 403 });
  }
  return NextResponse.json({ ok: false, perluDaftar: true, emel: e, nama: "" });
}
