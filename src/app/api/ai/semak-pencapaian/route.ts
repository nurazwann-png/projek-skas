import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { penggunaSemasa } from "@/lib/pelayan/sesi";
import { aiSedia, klienAIDenganSandaran, MODEL_AI } from "@/lib/pelayan/ai";
import { PANDUAN_GURU, PANDUAN_SEKOLAH } from "@/lib/pelayan/peraturan-skpm";
import { bacaJson, konteksSkas, TAHUN_ASAS, type Panduan } from "@/lib/pelayan/panduan";

// Semak sama ada sijil/evidens (gambar atau PDF) layak sebagai Pencapaian Guru (SKPM 5.4.1)
// atau Pencapaian Sekolah (SKPM 5.4.2) berdasarkan Panduan Pelaksanaan SKPM Kualiti@Sekolah Tahun 2026.

export const maxDuration = 120;

const JENIS_IMEJ = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type JenisImej = (typeof JENIS_IMEJ)[number];
const SAIZ_MAKS = 10 * 1024 * 1024;

// Skema keputusan yang dipulangkan kepada aplikasi SK@S
const MEDAN_GURU = ["namaPenerima", "program", "penganjur", "tarikh", "peringkat", "pingat", "tahap", "peranan"];
const MEDAN_SEKOLAH = ["namaPenerima", "program", "penganjur", "tarikh", "peringkat", "pingat", "tahap", "bidang"];
const MEDAN_SKEMA: Record<string, object> = {
  namaPenerima: { type: ["string", "null"] },
  program: { type: ["string", "null"] },
  penganjur: { type: ["string", "null"] },
  tarikh: { type: ["string", "null"], description: "YYYY-MM-DD jika lengkap, atau YYYY" },
  peringkat: { type: ["string", "null"], enum: ["Antarabangsa", "Kebangsaan", "Negeri", "Bahagian", "Daerah", "Sekolah", "Lain-lain", null] },
  pingat: { type: ["string", "null"], enum: ["Emas", "Perak", "Gangsa", null], description: "Tahap penilaian rubrik jika ada; bukan kedudukan" },
  tahap: { type: ["string", "null"], enum: ["Tempat Pertama / Anugerah / Pengiktirafan", "Tempat Kedua", "Tempat Ketiga", "Saguhati", "Penyertaan", null] },
  peranan: { type: ["string", "null"], enum: ["Peserta", "Jurulatih", "Penyelidik", "Penerima Anugerah", "Pembimbing Murid", "Urus Setia / AJK", "Penceramah / Fasilitator", "Lain-lain", null] },
  bidang: { type: ["string", "null"], enum: ["Akademik", "Ko-Akademik", "Kokurikulum", "Hal Ehwal Murid", "Pengurusan Sekolah", null] },
};

function skema(sekolah: boolean) {
  const medan = sekolah ? MEDAN_SEKOLAH : MEDAN_GURU;
  // Semakan sekolah: AI mesti nyatakan sama ada sekolah pengguna tertulis sebagai penerima
  const tambahan = sekolah
    ? {
        sekolahSepadan: { type: "string", enum: ["sepadan", "tidak_sepadan", "tiada"], description: "Adakah sekolah pengguna tertulis sebagai penerima" },
        namaSekolahDikesan: { type: ["string", "null"], description: "Nama sekolah penerima seperti tertulis" },
      }
    : {};
  return {
  type: "object",
  additionalProperties: false,
  required: ["dokumenSah", "keputusan", "kategori", "ringkasan", "penerangan", "maklumat", "asal", "semakan", "rujukan", "cadangan", "keyakinan", ...Object.keys(tambahan)],
  properties: {
    ...tambahan,
    dokumenSah: { type: "boolean", description: "true jika dokumen ialah sijil/surat/evidens yang boleh dibaca" },
    keputusan: { type: "string", enum: ["layak", "tidak_layak", "perlu_semakan"] },
    kategori: {
      type: "string",
      enum: ["Pencapaian Guru (5.4.1)", "Kekuatan Kami (A1)", "Pencapaian Sekolah (5.4.2)", "Pencapaian Murid", "Sumbangan", "Latihan / Kursus", "Bukan pencapaian"],
    },
    ringkasan: { type: "string", description: "Satu ayat keputusan untuk guru" },
    penerangan: { type: "string", description: "2–4 ayat menerangkan sebab keputusan" },
    maklumat: {
      type: "object",
      additionalProperties: false,
      required: medan,
      properties: Object.fromEntries(medan.map((k) => [k, MEDAN_SKEMA[k]])),
    },
    asal: {
      type: "object",
      additionalProperties: false,
      description: "Sumber setiap medan maklumat",
      required: medan,
      properties: Object.fromEntries(medan.map((k) => [k, { type: ["string", "null"], enum: ["sijil", "sokongan", "disimpulkan", null] }])),
    },
    semakan: {
      type: "array",
      description: "Senarai semakan kriteria satu per satu",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kriteria", "status", "nota"],
        properties: {
          kriteria: { type: "string" },
          status: { type: "string", enum: ["lulus", "gagal", "tidak_pasti"] },
          nota: { type: "string" },
        },
      },
    },
    rujukan: { type: "array", items: { type: "string" }, description: "Contoh: 'Panduan ms 54: peringkat yang diambil kira'" },
    cadangan: { type: "string", description: "Tindakan seterusnya untuk pengguna" },
    keyakinan: { type: "number", description: "0 hingga 1" },
  },
  };
}
const SKEMA_GURU = skema(false);
const SKEMA_SEKOLAH = skema(true);

// Polisi organisasi KPM menyekat structured outputs di Vertex, jadi skema dihantar dalam prompt dan disahkan di sini.
const arahanJson = (s: object) =>
  `\n\nFORMAT JAWAPAN: Balas dengan SATU objek JSON sahaja, tanpa teks lain dan tanpa blok kod Markdown. Objek itu mesti mematuhi JSON Schema berikut dengan tepat (semua medan "required" wajib ada; gunakan null jika tiada maklumat):\n${JSON.stringify(s)}`;

// Tahun penilaian dan panduan aktif ditetapkan oleh Admin SK@S. Peraturan terbina dalam (2026) kekal sebagai asas;
// kemas kini di hujung prompt mengatasinya apabila tahun atau panduan berubah.
function sistem(sekolah: boolean, ctx: { tahun: number; panduan: Panduan | null }): string {
  let teks = sekolah ? PANDUAN_SEKOLAH : PANDUAN_GURU;
  const { tahun, panduan } = ctx;
  if (panduan || tahun !== TAHUN_ASAS) {
    teks += `\n\n## KEMAS KINI (diutamakan jika bercanggah dengan peraturan di atas)\nTahun penilaian semasa ialah ${tahun}. Semua syarat "tahun ${TAHUN_ASAS}" di atas hendaklah dibaca sebagai tahun ${tahun}, dan "${TAHUN_ASAS - 1} atau lebih awal" sebagai ${tahun - 1} atau lebih awal.`;
    if (panduan) {
      teks += `\nPanduan terkini: ${panduan.nama} (tahun ${panduan.tahun}). Peraturan berikut diekstrak daripada panduan itu dan MENGATASI peraturan di atas jika berbeza. Rujuk muka surat panduan terkini dalam penerangan.\n\n${sekolah ? panduan.peraturanSekolah : panduan.peraturanGuru}`;
    }
  }
  return teks + arahanJson(sekolah ? SKEMA_SEKOLAH : SKEMA_GURU);
}

type Skema = { type?: string | string[]; enum?: unknown[]; required?: string[]; properties?: Record<string, Skema>; items?: Skema };

function sahkan(nilai: unknown, s: Skema, laluan: string, ralat: string[]): void {
  if (ralat.length >= 10) return;
  const jenis = s.type === undefined ? [] : Array.isArray(s.type) ? s.type : [s.type];
  const sebenar = nilai === null ? "null" : Array.isArray(nilai) ? "array" : typeof nilai;
  if (jenis.length && !jenis.includes(sebenar)) {
    ralat.push(`${laluan}: jenis ${sebenar}, sepatutnya ${jenis.join(" atau ")}`);
    return;
  }
  if (s.enum && !s.enum.includes(nilai)) {
    ralat.push(`${laluan}: nilai ${JSON.stringify(nilai)} tidak dalam senarai dibenarkan`);
    return;
  }
  if (sebenar === "object" && s.properties) {
    const obj = nilai as Record<string, unknown>;
    for (const k of s.required ?? []) if (!(k in obj)) ralat.push(`${laluan}.${k}: tiada`);
    for (const k of Object.keys(obj)) {
      if (s.properties[k]) sahkan(obj[k], s.properties[k], `${laluan}.${k}`, ralat);
      else delete obj[k];
    }
  }
  if (sebenar === "array" && s.items) (nilai as unknown[]).forEach((x, i) => sahkan(x, s.items!, `${laluan}[${i}]`, ralat));
}


const MAKS_DOKUMEN = 5;
type Dokumen = { fail?: string; mimeType?: string; namaFail?: string };
type Badan = { dokumen?: Dokumen[]; namaGuru?: string; jenis?: "guru" | "sekolah"; namaSekolah?: string; kodSekolah?: string };

export async function POST(req: NextRequest) {
  // Hanya pengguna yang log masuk (perkhidmatan ini berbayar mengikut penggunaan)
  if (!(await penggunaSemasa(req))) return Response.json({ ralat: "Sila log masuk." }, { status: 401 });
  // Prototaip: hanya terima panggilan dari halaman portal sendiri (asal yang sama)
  const asal = req.headers.get("origin");
  if (asal && new URL(asal).host !== req.headers.get("host")) {
    return Response.json({ ralat: "Permintaan tidak dibenarkan." }, { status: 403 });
  }
  let badan: Badan;
  try {
    badan = await req.json();
  } catch {
    return Response.json({ ralat: "Data permintaan tidak sah." }, { status: 400 });
  }
  const { dokumen, namaGuru, namaSekolah, kodSekolah } = badan;
  const sekolah = badan.jenis === "sekolah";
  if (sekolah && !namaSekolah) {
    return Response.json({ ralat: "Nama sekolah pengguna diperlukan untuk semakan Pencapaian Sekolah." }, { status: 400 });
  }
  if (!Array.isArray(dokumen) || dokumen.length === 0) {
    return Response.json({ ralat: "Muat naik sekurang-kurangnya satu sijil." }, { status: 400 });
  }
  if (dokumen.length > MAKS_DOKUMEN) {
    return Response.json({ ralat: `Maksimum ${MAKS_DOKUMEN} fail bagi satu semakan.` }, { status: 400 });
  }
  const bersih = [];
  for (const d of dokumen) {
    const pdf = d.mimeType === "application/pdf";
    if (!d.fail || !d.mimeType || (!pdf && !JENIS_IMEJ.includes(d.mimeType as JenisImej))) {
      return Response.json({ ralat: "Muat naik gambar (JPG, PNG, WebP) atau fail PDF sahaja." }, { status: 400 });
    }
    bersih.push({ pdf, mimeType: d.mimeType, namaFail: d.namaFail, data: d.fail.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "") });
  }
  if (bersih.reduce((a, d) => a + (d.data.length * 3) / 4, 0) > SAIZ_MAKS) {
    return Response.json({ ralat: "Jumlah saiz fail melebihi 10MB. Kecilkan gambar atau mampatkan PDF." }, { status: 413 });
  }
  if (!aiSedia()) {
    return Response.json({ ralat: "Perkhidmatan AI belum dikonfigurasi di pelayan. Hubungi Unit ICT PPD Dalat." }, { status: 503 });
  }

  // Setiap dokumen dilabel sebelum kandungannya supaya AI tahu mana sijil utama dan mana sokongan
  const kandungan: Anthropic.Beta.Messages.BetaContentBlockParam[] = bersih.flatMap((d, i) => [
    { type: "text" as const, text: `Dokumen ${i + 1} — ${i === 0 ? "SIJIL UTAMA" : "DOKUMEN SOKONGAN"}${d.namaFail ? ` (fail: ${d.namaFail})` : ""}:` },
    d.pdf
      ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: d.data } }
      : { type: "image" as const, source: { type: "base64" as const, media_type: d.mimeType as JenisImej, data: d.data } },
  ]);

  const skop = bersih.length > 1 ? `${bersih.length} dokumen di atas (1 sijil utama, ${bersih.length - 1} dokumen sokongan) sebagai SATU pencapaian` : "sijil di atas";
  const ctx = await konteksSkas();
  const tahun = ctx.tahun;

  const mesej: Anthropic.Beta.Messages.BetaMessageParam[] = [
    {
      role: "user",
      content: [
        ...kandungan,
        {
          type: "text",
          text: sekolah
            ? `Semak ${skop}. Sekolah pengguna: ${namaSekolah}${kodSekolah ? ` (kod ${kodSekolah})` : ""}. Tentukan sama ada ia Pencapaian Sekolah 5.4.2 bagi tahun penilaian ${tahun} dengan sekolah ini sebagai penerima, tandakan sumber setiap maklumat, dan terangkan kepada Pentadbir Sekolah.`
            : `Semak ${skop}. Guru yang memuat naik: ${namaGuru || "tidak dinyatakan"}. Tentukan sama ada ia Pencapaian Guru 5.4.1 bagi tahun penilaian ${tahun}, tandakan sumber setiap maklumat, dan terangkan kepada guru.`,
        },
      ],
    },
  ];

  try {
    // Satu cubaan pembetulan jika JSON tidak mematuhi skema
    for (let cubaan = 0; cubaan < 2; cubaan++) {
      const res = await klienAIDenganSandaran().beta.messages.create({
        model: MODEL_AI,
        max_tokens: 16000,
        system: [{ type: "text", text: sistem(sekolah, ctx) }],
        messages: mesej,
      });

      if (res.stop_reason === "refusal") {
        return Response.json({ ralat: "AI tidak dapat menyemak dokumen ini. Cuba muat naik semula atau semak secara manual." }, { status: 422 });
      }
      const teks = res.content
        .filter((b) => b.type === "text")
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("");
      if (!teks.trim()) return Response.json({ ralat: "Tiada keputusan diterima daripada AI." }, { status: 502 });

      const ralat: string[] = [];
      let hasil: unknown;
      try {
        hasil = bacaJson(teks);
        sahkan(hasil, (sekolah ? SKEMA_SEKOLAH : SKEMA_GURU) as Skema, "$", ralat);
      } catch {
        ralat.push("jawapan bukan JSON yang sah");
      }
      if (!ralat.length) return Response.json({ hasil, model: res.model });

      console.error("semak-pencapaian: JSON tidak sah", ralat.join("; "));
      mesej.push({ role: "assistant", content: res.content });
      mesej.push({
        role: "user",
        content: `JSON anda tidak mematuhi skema: ${ralat.join("; ")}. Hantar semula SATU objek JSON lengkap yang betul sahaja, tanpa teks lain.`,
      });
    }
    return Response.json({ ralat: "Keputusan AI tidak dapat dibaca. Cuba lagi." }, { status: 502 });
  } catch (err) {
    if (err instanceof Anthropic.APIError) console.error("semak-pencapaian: ralat AI", err.status, err.message);
    if (err instanceof Anthropic.RateLimitError) {
      return Response.json({ ralat: "Terlalu banyak semakan serentak. Cuba lagi sebentar." }, { status: 429 });
    }
    if (err instanceof Anthropic.BadRequestError) {
      return Response.json({ ralat: "Fail tidak dapat diproses oleh AI (mungkin rosak atau dilindungi kata laluan)." }, { status: 400 });
    }
    if (err instanceof Anthropic.APIError) {
      return Response.json({ ralat: "Perkhidmatan AI tidak dapat dihubungi. Cuba lagi sebentar." }, { status: 502 });
    }
    if (err instanceof SyntaxError) {
      return Response.json({ ralat: "Keputusan AI tidak dapat dibaca. Cuba lagi." }, { status: 502 });
    }
    throw err;
  }
}
