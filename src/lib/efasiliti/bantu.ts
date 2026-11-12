// Fungsi tulen e-Fasiliti: skop peranan, tapisan, peralihan status, ringkasan peta.
import type { PerananApp } from "@/lib/portal/stor";
import type { BorangAduan, SekolahPeta, StatusTiket, Tiket, TindakanTiket } from "./jenis";

const HARI_MS = 86400000;

export const aktif = (t: Tiket) => t.status !== "Selesai" && t.status !== "Ditolak";

// Sama seperti PPDData.hari(): bilangan hari penuh sejak tarikh
export function hariSejak(tarikh: string, kini: Date = new Date()): number | null {
  const n = Math.floor((kini.getTime() - new Date(tarikh).getTime()) / HARI_MS);
  return Number.isFinite(n) ? n : null;
}

// Cap masa garis masa: data benih "YYYY-MM-DD HH:mm", rekod baharu "DD/MM/YYYY HH:mm" (ms-MY)
export function tarikhGarisMasa(s: string): Date | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  const my = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  const d = iso ? new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3])) : my ? new Date(Date.UTC(+my[3], +my[2] - 1, +my[1])) : null;
  return d && Number.isFinite(d.getTime()) ? d : null;
}

// Aduan aktif: hari sejak dilaporkan. Aduan selesai/ditolak: hari dari laporan hingga ditutup (jika tarikh tutup boleh dibaca).
export function hariTerbuka(t: Tiket, kini: Date = new Date()): number | null {
  if (aktif(t)) return hariSejak(t.tarikh, kini);
  const tutup = [...(t.timeline || [])].reverse().find((x) => x.status === t.status);
  const d = tutup && tarikhGarisMasa(tutup.tarikh);
  const mula = new Date(t.tarikh).getTime();
  if (!d || !Number.isFinite(mula)) return null;
  return Math.max(0, Math.floor((d.getTime() - mula) / HARI_MS));
}

export function fmtTarikh(iso: string): string {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : iso;
}

// Cap masa garis masa — format yang sama dengan aplikasi asal
export function sekarang(): string {
  return new Date().toLocaleString("ms-MY", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
}

export function tarikhHariIni(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* ── Skop peranan (sama seperti aplikasi asal) ── */
// Guru: aduan sendiri di sekolahnya; Pentadbir Sekolah: semua aduan sekolahnya; Admin PPD: seluruh daerah
export function skopTiket(tiket: Tiket[], peranan: PerananApp, sekolahSaya: string, uid: string): Tiket[] {
  if (peranan === "ppd_admin") return tiket;
  return tiket.filter((t) => t.sekolah === sekolahSaya && (peranan !== "teacher" || t.pelaporId === uid));
}

// Pautan terus ?tiket=: Admin PPD semua tiket; yang lain tiket sekolah sendiri sahaja
export function bolehLihat(t: Tiket, peranan: PerananApp, sekolahSaya: string): boolean {
  return peranan === "ppd_admin" || t.sekolah === sekolahSaya;
}

/* ── Tapisan senarai ── */
export interface Tapisan {
  cari: string;
  status: string;
  keutamaan: string;
  zon: string;
}
export const TAPISAN_KOSONG: Tapisan = { cari: "", status: "", keutamaan: "", zon: "" };

export function tapisTiket(tiket: Tiket[], f: Tapisan): Tiket[] {
  const q = f.cari.trim().toLowerCase();
  return tiket.filter(
    (t) =>
      (!f.status || t.status === f.status) &&
      (!f.keutamaan || t.keutamaan === f.keutamaan) &&
      (!f.zon || t.zon === f.zon) &&
      (!q || [t.id, t.tajuk, t.sekolah, t.kategori].some((v) => String(v ?? "").toLowerCase().includes(q))),
  );
}

export function keteranganTapisan(f: Tapisan): string {
  const b = [f.status && `status ${f.status}`, f.keutamaan && `keutamaan ${f.keutamaan}`, f.zon, f.cari.trim() && `carian "${f.cari.trim()}"`].filter(Boolean);
  return b.length ? `Tapisan: ${b.join(" · ")}` : "Semua aduan";
}

/* ── Aduan baharu ── */
export function idBaharu(tiket: Tiket[], tahun: string): string {
  const maks = tiket.reduce((m, t) => Math.max(m, +(/(\d+)$/.exec(t.id)?.[1] ?? 0)), 0);
  return `TKT-${tahun}-${String(maks + 1).padStart(3, "0")}`;
}

export function binaTiket(tiket: Tiket[], b: BorangAduan, pelapor: { id: string; nama: string }, sekolah: string, zon: string): Tiket {
  const tarikh = tarikhHariIni();
  return {
    id: idBaharu(tiket, tarikh.slice(0, 4)),
    tajuk: b.tajuk,
    kategori: b.kategori,
    butiran: b.butiran,
    sekolah,
    zon,
    tarikh,
    pelaporId: pelapor.id,
    status: "Baru",
    keutamaan: b.keutamaan,
    gambar: b.gambar.length ? b.gambar : null,
    notaPJ: null,
    notaPPD: null,
    timeline: [{ tarikh: sekarang(), tindakan: `Aduan dihantar oleh ${pelapor.nama}`, oleh: sekolah, status: "Baru" }],
  };
}

/* ── Peralihan status (Admin PPD sahaja) ── */
// Status yang mesti dimiliki tiket sebelum tindakan dibenarkan
export const STATUS_PRASYARAT: Record<TindakanTiket, StatusTiket> = { sah: "Baru", tolak: "Baru", lulus: "Disemak PJ", selesai: "Lulus Bajet" };

export function kenaTindakan(t: Tiket, tindakan: TindakanTiket, nota = ""): Tiket {
  const tambah = (status: StatusTiket, teks: string, oleh: string, lain: Partial<Tiket> = {}): Tiket => ({
    ...t,
    ...lain,
    status,
    timeline: [...(t.timeline || []), { tarikh: sekarang(), tindakan: teks, oleh, status }],
  });
  switch (tindakan) {
    case "sah": return tambah("Disemak PJ", `Aduan disahkan oleh PJ. ${nota}`, "Penolong Jurutera", { notaPJ: nota });
    case "tolak": return tambah("Ditolak", `Aduan ditolak oleh PJ.${nota ? ` Sebab: ${nota}` : ""}`, "Penolong Jurutera");
    case "lulus": return tambah("Lulus Bajet", "Bajet diluluskan oleh PPD Dalat.", "PPD Dalat");
    case "selesai": return tambah("Selesai", "Kerja pembaikan disahkan selesai oleh PPD.", "PPD Dalat");
  }
}

export function mesejTindakan(id: string, tindakan: TindakanTiket): string {
  return {
    sah: `Aduan ${id} disahkan dan dihantar ke PPD.`,
    tolak: `Aduan ${id} ditolak.`,
    lulus: `Bajet untuk ${id} diluluskan.`,
    selesai: `Aduan ${id} ditandakan Selesai.`,
  }[tindakan];
}

/* ── Peta aduan aktif ── */
export interface TitikPeta {
  kod: string;
  nama: string;
  x: number;
  y: number;
  saiz: number; // 0–1 mengikut bilangan aduan aktif
  tahap: "hijau" | "kuning" | "merah";
  nilai: string;
  sub: string;
}

// Saiz ikut bilangan aduan aktif; warna ikut usia aduan tertua (ambang sama seperti aplikasi asal)
export function titikPeta(sekolah: SekolahPeta[], tiket: Tiket[], kini: Date = new Date()): TitikPeta[] {
  const a = tiket.filter(aktif);
  const bil = (nama: string) => a.filter((t) => t.sekolah === nama);
  const maks = Math.max(1, ...sekolah.map((s) => bil(s.nama).length));
  return sekolah.map((s) => {
    const milik = bil(s.nama);
    const tertua = Math.max(0, ...milik.map((t) => hariSejak(t.tarikh, kini) ?? 0));
    const kritikal = milik.filter((t) => t.keutamaan === "Kritikal").length;
    return {
      kod: s.kod,
      nama: s.nama,
      x: s.x,
      y: s.y,
      saiz: milik.length / maks,
      tahap: tertua > 30 ? "merah" : milik.length && (kritikal || tertua > 14) ? "kuning" : "hijau",
      nilai: `${milik.length} aduan aktif${kritikal ? ` · ${kritikal} kritikal` : ""}`,
      sub: milik.length ? `tertua ${tertua} hari` : "tiada tunggakan",
    };
  });
}

// Hanya data URL imej dibenarkan dipaparkan (stor boleh diubah oleh aplikasi lain)
export function gambarTiket(t: Tiket): string[] {
  return Array.isArray(t.gambar) ? t.gambar.filter((g) => typeof g === "string" && g.startsWith("data:image/")) : [];
}
