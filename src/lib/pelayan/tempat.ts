import organisasi from "./benih-organisasi.json";

// Padanan nama tempat (sekolah seliaan atau PPD Dalat) yang ditaip pengguna, untuk alat arah Pembantu AI.
// Nama rasmi menggunakan singkatan EMIS (SG, KG, ST), jadi bentuk penuh dinormalkan dahulu.

export type Tempat = { kod: string; nama: string };

const SENARAI: Tempat[] = (organisasi as { kod: string; nama: string }[]).map((o) => ({ kod: o.kod, nama: o.nama }));

const GANTI: [RegExp, string][] = [
  [/\bPEJABAT PENDIDIKAN DAERAH( DALAT)?\b/g, "PPD DALAT"],
  [/\bPPD\b(?! DALAT)/g, "PPD DALAT"],
  [/\bSEKOLAH MENENGAH KEBANGSAAN\b/g, "SMK"],
  [/\bSEKOLAH JENIS KEBANGSAAN (CINA|\(C\))/g, "SJKC"],
  [/\bSJK ?\(?C\)?(?=\s|$)/g, "SJKC"],
  [/\bSEKOLAH KEBANGSAAN\b/g, "SK"],
  [/\bSUNGAI\b/g, "SG"],
  [/\bKAMPUNG\b|\bKAMPONG\b/g, "KG"],
  [/\bSAINT\b|\bSANTA\b/g, "ST"],
];

function normal(s: string): string {
  let t = s.toUpperCase().replace(/[^A-Z0-9() ]+/g, " ");
  for (const [re, ke] of GANTI) t = t.replace(re, ke);
  return t.replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
}

export type HasilCari = { tempat: Tempat } | { ralat: string; calon: string[] };

export function cariTempat(q: string): HasilCari {
  const n = normal(q || "");
  if (!n) return { ralat: "Nama tempat kosong.", calon: [] };
  const kod = SENARAI.find((t) => t.kod.toUpperCase() === n.replace(/\s/g, ""));
  if (kod) return { tempat: kod };
  const tepat = SENARAI.filter((t) => normal(t.nama) === n);
  if (tepat.length === 1) return { tempat: tepat[0] };
  // Semua perkataan dalam carian mesti ada dalam nama (contoh "rasau" → SK SG RASAU)
  const kata = n.split(" ");
  const calon = SENARAI.filter((t) => { const nm = ` ${normal(t.nama)} `; return kata.every((k) => nm.includes(` ${k} `) || nm.includes(k)); });
  if (calon.length === 1) return { tempat: calon[0] };
  if (calon.length > 1) return { ralat: `"${q}" sepadan dengan lebih daripada satu tempat.`, calon: calon.map((t) => t.nama) };
  return { ralat: `Tiada sekolah seliaan bernama "${q}".`, calon: SENARAI.map((t) => t.nama) };
}
