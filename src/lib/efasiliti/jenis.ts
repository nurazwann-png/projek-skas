// Jenis data e-Fasiliti. Bentuk tiket MESTI sama dengan public/assets/ppd-data.js kerana stor (localStorage)
// dikongsi dengan aplikasi HTML asal sepanjang tempoh penghijrahan ke React.
import type { Amaran, Pengguna, PerananApp, SekolahInduk } from "@/lib/portal/stor";

export const STATUS = ["Baru", "Disemak PJ", "Lulus Bajet", "Dalam Kerja", "Selesai", "Ditolak"] as const;
export type StatusTiket = (typeof STATUS)[number];

export const KEUTAMAAN = ["Kritikal", "Tinggi", "Sederhana", "Rendah"] as const;
export type Keutamaan = (typeof KEUTAMAAN)[number];

export const KATEGORI = ["Elektrik", "Paip & Sanitasi", "Bumbung", "Struktur & Pagar", "Cat & Kemasan", "Tandas", "Lain-lain"] as const;

export const MAKS_GAMBAR = 3;

export interface EntriGarisMasa {
  tarikh: string;
  tindakan: string;
  oleh: string;
  status: StatusTiket;
}

export interface Tiket {
  id: string;
  tajuk: string;
  kategori: string;
  butiran: string;
  sekolah: string;
  kodSekolah?: string;
  zon: string;
  tarikh: string; // YYYY-MM-DD
  pelaporId: string | null;
  status: StatusTiket;
  keutamaan: Keutamaan;
  // Baharu (React): gambar kerosakan sebagai data URL JPEG. Aplikasi asal menulis null.
  gambar?: string[] | null;
  notaPJ: string | null;
  notaPPD: string | null;
  timeline: EntriGarisMasa[];
}

export interface SekolahPeta extends SekolahInduk {
  x: number;
  y: number;
}

export interface AmaranTiket extends Amaran {
  tiket: string;
}

// Bahagian window.PPDData yang digunakan oleh e-Fasiliti
export interface DataEfasiliti {
  sekolahList(): SekolahPeta[];
  efasiliti: {
    tiket(): Tiket[];
    save(senarai: Tiket[]): boolean;
    bukaHari(t: Tiket): number;
    aktif(t: Tiket): boolean;
  };
  amaranEfasiliti(): AmaranTiket[];
  sekolahUser(u: Pengguna | null): SekolahPeta | null;
}

export interface BorangAduan {
  tajuk: string;
  kategori: string;
  keutamaan: Keutamaan;
  butiran: string;
  gambar: string[];
}

export type TindakanTiket = "sah" | "tolak" | "lulus" | "selesai";
export type ModDialog = "lihat" | "semak";
export type JenisMakluman = "ok" | "ralat";

export interface PropPaparan {
  tiket: Tiket[]; // tiket dalam skop peranan pengguna
  data: DataEfasiliti;
  pengguna: Pengguna;
  peranan: PerananApp;
  sekolahSaya: string;
  buka(id: string, mod?: ModDialog): void;
  laksana(id: string, tindakan: TindakanTiket, nota?: string): boolean;
  makluman(mesej: string, jenis?: JenisMakluman): void;
  cetak(senarai: Tiket[], keterangan: string): void;
}
