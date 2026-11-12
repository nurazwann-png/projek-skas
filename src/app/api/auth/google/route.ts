import { NextResponse, type NextRequest } from "next/server";
import { cariPenggunaEmel, tambahAudit, tambahPengguna, type PenggunaStor } from "@/lib/pelayan/stor";
import { emelSuperadmin, sahkanGoogle, tetapPra, tetapSesi } from "@/lib/pelayan/sesi";

// Log masuk dengan ID token Google (Google Identity Services).
export async function POST(req: NextRequest) {
  const { kredensial } = await req.json().catch(() => ({}));
  if (typeof kredensial !== "string") return NextResponse.json({ ok: false, mesej: "Permintaan tidak sah." }, { status: 400 });
  const g = await sahkanGoogle(kredensial);
  if (!g.ok) return NextResponse.json(g, { status: 403 });

  let u = await cariPenggunaEmel(g.emel);
  if (!u && emelSuperadmin().includes(g.emel)) {
    // Superadmin pertama ditetapkan oleh pentadbir sistem melalui SUPERADMIN_EMEL
    const baru: PenggunaStor = { id: "u_" + Date.now().toString(36), nama: g.nama.toLocaleUpperCase("ms-MY"), emel: g.emel, kodSekolah: "PPDDLT", roles: ["superadmin"] };
    await tambahPengguna(baru, null);
    await tambahAudit({ t: Date.now(), olehId: baru.id, olehNama: baru.nama, olehTahap: "superadmin", tempat: "welcome", tindakan: "daftar-sendiri", sasaranId: baru.id, sasaranNama: baru.nama, kodSekolah: "PPDDLT" });
    u = baru;
  }
  if (!u) return tetapPra(NextResponse.json({ ok: false, perluDaftar: true, emel: g.emel, nama: g.nama }), g.emel, g.nama);
  return tetapSesi(NextResponse.json({ ok: true, uid: u.id }), u.id);
}
