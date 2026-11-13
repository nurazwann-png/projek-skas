import type { NextRequest } from "next/server";
import { penggunaSemasa } from "@/lib/pelayan/sesi";
import { gantiKoleksi, modDemo } from "@/lib/pelayan/stor";
import { janaDataUjian } from "@/lib/pelayan/benih-ujian";

// Muat data ujian penuh (29 sekolah EMIS, guru ikut bilangan sebenar). MOD_DEMO dan Superadmin sahaja:
// koleksi yang dijana DIGANTI sepenuhnya, jadi tidak boleh dijalankan pada sistem sebenar.
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!modDemo()) return Response.json({ ralat: "Mod demo tidak aktif." }, { status: 404 });
  const aktor = await penggunaSemasa(req);
  if (!aktor?.roles.includes("superadmin")) return Response.json({ ralat: "Superadmin sahaja." }, { status: 403 });
  const asal = req.headers.get("origin");
  if (asal && new URL(asal).host !== req.headers.get("host")) return Response.json({ ralat: "Permintaan tidak dibenarkan." }, { status: 403 });

  const data = janaDataUjian();
  await gantiKoleksi(data, aktor.id);
  const bil = (k: string) => {
    const v = data[k];
    return Array.isArray(v) ? v.length : v && typeof v === "object" ? Object.keys(v).length : 0;
  };
  return Response.json({
    ok: true,
    sekolah: bil("ppd_organisasi") - 1,
    pengguna: bil("ppd_users"),
    kelas: bil("skas_kelas"),
    markah: bil("skas_marks"),
    guruAdaRekodSkas: bil("ppd_skas_rekod"),
    aduan: bil("ppd_efasiliti_tiket"),
  });
}
