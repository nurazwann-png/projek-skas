import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { penggunaSemasa } from "@/lib/pelayan/sesi";
import { aiSedia, klienAI, MODEL_AI } from "@/lib/pelayan/ai";
import { tulis } from "@/lib/pelayan/stor";
import { bacaJson, konteksSkas, type Panduan, type Rujukan } from "@/lib/pelayan/panduan";
import { PANDUAN_GURU, PANDUAN_SEKOLAH } from "@/lib/pelayan/peraturan-skpm";

// Admin SK@S memuat naik Panduan Pelaksanaan SKPM baharu. Teks PDF diekstrak di pelayar (dengan penanda muka surat);
// di sini AI mengekstrak peraturan 5.4.1/5.4.2 dan petikan rujukan. Hasil disimpan tetapi TIDAK diaktifkan:
// Admin menyemak dahulu, kemudian mengaktifkannya dalam SK@S.

export const maxDuration = 300;
const TEKS_MAKS = 700_000;

const SISTEM = `Anda membantu Admin SK@S, Pejabat Pendidikan Daerah (PPD) Dalat, Sarawak. Anda diberi teks penuh sebuah Panduan Pelaksanaan SKPM Kualiti@Sekolah (Jemaah Nazir, KPM). Setiap muka surat ditanda "=== Muka surat N ===".

Tugas: ekstrak peraturan yang diperlukan untuk menyemak evidens Pencapaian Guru (Aspek 5.4.1) dan Pencapaian Sekolah (Aspek 5.4.2), supaya ia boleh menggantikan peraturan semasa dalam sistem semakan AI.

Prinsip:
- Setia kepada teks panduan. Jangan tambah peraturan yang tiada dalam panduan dan jangan buang syarat yang ada.
- Tulis dalam Bahasa Melayu yang jelas, sebagai senarai bernombor, dan sertakan rujukan muka surat (contohnya "(ms 54)") pada setiap peraturan.
- Liputi sekurang-kurangnya: peringkat yang diambil kira, tahap pencapaian, peranan guru (5.4.1), syarat tahun penilaian, pencapaian yang dikira dan tidak dikira, contoh anugerah dalam jadual panduan, penerima mesti sekolah sebagai entiti (5.4.2), sijil kepakaran/pentauliahan yang dikira, serta keperluan evidens (format, Google Drive, MoEIS).
- Nombor muka surat ialah nombor penanda "=== Muka surat N ===" kecuali panduan mencetak nombornya sendiri dengan jelas; utamakan nombor bercetak jika ada.
- Petikan rujukan mestilah petikan tepat daripada teks (paling banyak 300 aksara setiap satu).

FORMAT JAWAPAN: Balas dengan SATU objek JSON sahaja, tanpa teks lain dan tanpa blok kod Markdown:
{"tahun": nombor tahun penilaian panduan atau null,
 "tajuk": "tajuk panduan seperti tertulis",
 "peraturanGuru": "peraturan 5.4.1 sebagai senarai bernombor",
 "peraturanSekolah": "peraturan 5.4.2 sebagai senarai bernombor",
 "rujukan": [{"tajuk": "bahagian/perkara", "muka": "ms N", "petikan": "petikan tepat"}],
 "perubahan": "ringkasan perbezaan penting berbanding PERATURAN SEMASA yang diberi (senarai ringkas), atau null jika tiada perbezaan ketara"}
"rujukan" mesti mengandungi 8 hingga 14 petikan yang paling berguna untuk menyemak 5.4.1 dan 5.4.2.`;

const teksOk = (v: unknown, min = 1) => typeof v === "string" && v.trim().length >= min;

export async function POST(req: NextRequest) {
  const aktor = await penggunaSemasa(req);
  if (!aktor) return Response.json({ ralat: "Sila log masuk." }, { status: 401 });
  if (!aktor.roles.includes("superadmin") && !aktor.roles.includes("admin_skas")) {
    return Response.json({ ralat: "Hanya Admin SK@S boleh memuat naik panduan." }, { status: 403 });
  }
  const asal = req.headers.get("origin");
  if (asal && new URL(asal).host !== req.headers.get("host")) return Response.json({ ralat: "Permintaan tidak dibenarkan." }, { status: 403 });
  if (!aiSedia()) return Response.json({ ralat: "Perkhidmatan AI belum dikonfigurasi di pelayan." }, { status: 503 });

  const b = await req.json().catch(() => ({}));
  const teks = typeof b?.teks === "string" ? b.teks : "";
  const namaFail = typeof b?.namaFail === "string" ? b.namaFail.slice(0, 200) : "panduan.pdf";
  const halaman = Number(b?.halaman) || 0;
  if (teks.length < 2000) return Response.json({ ralat: "Teks panduan terlalu pendek. Pastikan PDF mengandungi teks (bukan imej imbasan)." }, { status: 400 });
  if (teks.length > TEKS_MAKS) return Response.json({ ralat: "Panduan terlalu panjang untuk diproses." }, { status: 413 });

  const semasa = await konteksSkas();
  const peraturanSemasa = semasa.panduan
    ? `Panduan aktif: ${semasa.panduan.nama}\n\n5.4.1:\n${semasa.panduan.peraturanGuru}\n\n5.4.2:\n${semasa.panduan.peraturanSekolah}`
    : `Peraturan terbina dalam (Panduan SKPM 2026):\n\n${PANDUAN_GURU}\n\n${PANDUAN_SEKOLAH}`;

  let hasil: Record<string, unknown> | null = null;
  try {
    const res = await klienAI().messages.stream({
      model: MODEL_AI,
      max_tokens: 32000,
      system: SISTEM,
      messages: [{ role: "user", content: `PERATURAN SEMASA (untuk perbandingan sahaja):\n\n${peraturanSemasa}\n\n---\n\nTEKS PANDUAN BAHARU (${namaFail}):\n\n${teks}` }],
    }).finalMessage();
    if (res.stop_reason === "refusal") return Response.json({ ralat: "AI tidak dapat memproses panduan ini." }, { status: 422 });
    const jawapan = res.content.filter((x): x is Anthropic.TextBlock => x.type === "text").map((x) => x.text).join("");
    hasil = bacaJson(jawapan) as Record<string, unknown>;
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error("panduan: ralat AI", err.status, err.message);
      return Response.json({ ralat: "Perkhidmatan AI tidak dapat dihubungi. Cuba lagi." }, { status: 502 });
    }
    if (err instanceof SyntaxError) return Response.json({ ralat: "Hasil analisis AI tidak dapat dibaca. Cuba lagi." }, { status: 502 });
    throw err;
  }

  if (!hasil || !teksOk(hasil.peraturanGuru, 200) || !teksOk(hasil.peraturanSekolah, 200)) {
    return Response.json({ ralat: "AI tidak menemui peraturan 5.4.1 dan 5.4.2 dalam dokumen ini. Pastikan fail ialah Panduan Pelaksanaan SKPM." }, { status: 422 });
  }
  const rujukan: Rujukan[] = (Array.isArray(hasil.rujukan) ? hasil.rujukan : [])
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r) => ({ tajuk: String(r.tajuk || "").slice(0, 160), muka: String(r.muka || "").slice(0, 30), petikan: String(r.petikan || "").slice(0, 400) }))
    .filter((r) => r.petikan)
    .slice(0, 16);
  const tahunDikesan = Number(hasil.tahun);
  const panduan: Panduan = {
    id: "pd" + Date.now(),
    nama: teksOk(hasil.tajuk) ? String(hasil.tajuk).slice(0, 200) : namaFail,
    namaFail,
    tahun: Number.isInteger(tahunDikesan) && tahunDikesan > 2000 && tahunDikesan < 2100 ? tahunDikesan : new Date().getFullYear(),
    dimuatNaik: new Date().toISOString(),
    oleh: aktor.nama,
    halaman,
    peraturanGuru: String(hasil.peraturanGuru),
    peraturanSekolah: String(hasil.peraturanSekolah),
    rujukan,
    perubahan: teksOk(hasil.perubahan) ? String(hasil.perubahan) : null,
  };
  const ditolak = await tulis(aktor, [{ k: "ppd_skas_panduan", set: { [panduan.id]: panduan } }]);
  if (ditolak.length) return Response.json({ ralat: ditolak[0].sebab }, { status: 403 });
  return Response.json({ panduan });
}
