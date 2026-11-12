import type { NextRequest } from "next/server";
import { penggunaSemasa } from "@/lib/pelayan/sesi";
import { kelasBolehDiingatkan, muatData } from "@/lib/pelayan/ringkasan";
import { tulis } from "@/lib/pelayan/stor";

// Melaksanakan cadangan pembantu yang telah DISAHKAN oleh pengguna di skrin: peringatan pengisian markah.
// Kebenaran disemak semula di sini; senarai kelas daripada pelayar tidak dipercayai begitu sahaja.
export async function POST(req: NextRequest) {
  const aktor = await penggunaSemasa(req);
  if (!aktor) return Response.json({ ralat: "Sila log masuk." }, { status: 401 });
  const asal = req.headers.get("origin");
  if (asal && new URL(asal).host !== req.headers.get("host")) return Response.json({ ralat: "Permintaan tidak dibenarkan." }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(b?.kelasIds) ? b.kelasIds.map(String).slice(0, 40) : [];
  const boleh = kelasBolehDiingatkan(await muatData(aktor), ids);
  if (!boleh.length) return Response.json({ ralat: "Tiada peringatan boleh dihantar." }, { status: 403 });
  const t = Date.now();
  const set = Object.fromEntries(boleh.map((k) => [k.kelasId, { kelasId: k.kelasId, dariId: aktor.id, dariNama: aktor.nama, t }]));
  const ditolak = await tulis(aktor, [{ k: "ppd_peringatan", set }]);
  if (ditolak.length) return Response.json({ ralat: ditolak[0].sebab }, { status: 403 });
  return Response.json({ ok: true, dihantar: boleh.map((k) => k.label) });
}
