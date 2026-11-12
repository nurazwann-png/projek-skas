import { NextResponse, type NextRequest } from "next/server";
import { bacaKoleksi, cariPenggunaEmel, DOMAIN_RASMI, domain, modDemo, tambahAudit, tambahPengguna, type PenggunaStor } from "@/lib/pelayan/stor";
import { bacaPra, tetapSesi } from "@/lib/pelayan/sesi";

// Pendaftaran kali pertama. Emel datang daripada identiti Google yang telah disahkan (kuki pra-daftar);
// dalam mod demo sahaja emel boleh dihantar terus.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const pra = await bacaPra(req);
  const emel = (pra?.emel || (modDemo() ? String(b.emel || "") : "")).trim().toLowerCase();
  const gagal = (medan: string, msg: string, status = 400) => NextResponse.json({ ok: false, medan, msg }, { status });
  if (!emel) return gagal("emel", "Sila log masuk dengan Google dahulu.", 401);
  if (!DOMAIN_RASMI.includes(domain(emel))) return gagal("emel", `Hanya emel rasmi KPM (${DOMAIN_RASMI.map((d) => "@" + d).join(" atau ")}) boleh mendaftar.`);
  if (await cariPenggunaEmel(emel)) return gagal("emel", "Emel ini sudah berdaftar. Sila log masuk.");
  const nama = String(b.nama || "").replace(/\s+/g, " ").trim().toLocaleUpperCase("ms-MY");
  if (nama.length < 3) return gagal("nama", "Masukkan nama penuh seperti dalam rekod rasmi.");
  const kod = String(b.kodSekolah || "").replace(/\s+/g, "").toUpperCase();
  const org = ((await bacaKoleksi<{ kod: string }[]>("ppd_organisasi")) || []).find((o) => o.kod === kod);
  if (!org) return gagal("kod", "Pilih kod sekolah anda.");

  const u: PenggunaStor = { id: "u_" + Date.now().toString(36), nama, emel, kodSekolah: kod, roles: [] };
  await tambahPengguna(u, null);
  await tambahAudit({ t: Date.now(), olehId: u.id, olehNama: u.nama, olehTahap: "pengguna", tempat: "welcome", tindakan: "daftar-sendiri", sasaranId: u.id, sasaranNama: u.nama, kodSekolah: kod });
  return tetapSesi(NextResponse.json({ ok: true, uid: u.id }), u.id);
}
