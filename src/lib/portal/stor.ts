// Akses bertaip kepada stor kongsi Portal PPD Dalat (public/assets/ppd-auth.js & ppd-data.js).
// Halaman React memuatkan skrip yang sama seperti halaman HTML supaya hanya ada SATU sumber data
// (localStorage) sepanjang tempoh penghijrahan aplikasi ke React.

export type UjianKey = "ar1" | "ar2" | "percubaan";

export interface Pelajar {
  id: string;
  muridId?: string;
  nama: string;
  jantina?: string;
  agama?: string;
  ses?: string;
  lokasi?: string;
  penginapan?: string;
}

export interface Kelas {
  id: string;
  sekolah: string;
  kodSekolah?: string;
  subjek: string;
  tingkatan: string;
  kelas: string;
  tahun?: string;
  guru: string;
  guruId?: string | null;
  pelajar: Pelajar[];
}

// undefined = belum diisi; null = tidak hadir (TH)
// sasaran = markah sasaran SPM (0–100) yang ditetapkan guru bagi murid itu dalam subjek tersebut (headcount)
export type Markah = Partial<Record<UjianKey, number | null>> & { sasaran?: number };
export type Marks = Record<string, Markah>;

export interface SekolahInduk {
  id: string;
  kod: string;
  nama: string;
  lokasi: string;
  zon: string;
}

export interface Pengguna {
  id: string;
  nama: string;
  emel: string;
  kodSekolah: string;
  org: string;
  roles: string[];
}

export type Tahap = "pengguna" | "sekolah" | "admin" | "superadmin";
export type PerananApp = "ppd_admin" | "school_admin" | "teacher";

export interface Sesi {
  uid: string;
  level: Tahap;
}

export interface Amaran {
  tahap: "merah" | "kuning";
  sekolah: string;
  tajuk: string;
  butiran: string;
}

export interface Peperiksaan {
  key: UjianKey;
  label: string;
  buka: string;
  tarikhAkhir: string;
}

export interface Peringatan {
  kelasId: string;
  dariId: string;
  dariNama: string;
  t: number;
}

export interface PPDAuthApi {
  session(): Sesi | null;
  currentUser(): Pengguna | null;
  findById(id: string): Pengguna | null;
  appRoleFor(u: Pengguna, level: Tahap, app: string): PerananApp;
  LEVELS: Record<Tahap, { label: string; color: string }>;
  initials(nama: string): string;
}

export interface PPDDataApi {
  sekolahList(): SekolahInduk[];
  PEPERIKSAAN_SEMASA: Peperiksaan;
  spm: { kelas(): Kelas[]; marks(): Marks };
  peringatan: {
    hantar(kelasId: string, dari: { id: string; nama: string }): Peringatan;
    untukKelas(kelasId: string): Peringatan | null;
  };
  amaranSPM(): Amaran[];
  hari(a: string | number, b?: Date): number;
}

declare global {
  interface Window {
    PPDAuth?: PPDAuthApi;
    PPDData?: PPDDataApi;
  }
}

const dimuat = new Map<string, Promise<void>>();

// Muat skrip klasik sekali sahaja; atribut data-* dihantar supaya document.currentScript.dataset berfungsi
export function muatSkrip(src: string, data: Record<string, string> = {}): Promise<void> {
  const ada = dimuat.get(src);
  if (ada) return ada;
  const janji = new Promise<void>((ok, gagal) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    Object.entries(data).forEach(([k, v]) => (s.dataset[k] = v));
    s.onload = () => ok();
    s.onerror = () => {
      dimuat.delete(src);
      gagal(new Error(`Gagal memuatkan ${src}`));
    };
    document.head.appendChild(s);
  });
  dimuat.set(src, janji);
  return janji;
}

export async function muatStorPortal(): Promise<{ auth: PPDAuthApi; data: PPDDataApi }> {
  // Penyegerakan dengan pelayan mesti dimuat dahulu: ia mengisi localStorage dengan keadaan terkini
  if (!(window as unknown as { PPDSegerak?: unknown }).PPDSegerak) await muatSkrip("/assets/ppd-segerak.js");
  if (!window.PPDAuth) await muatSkrip("/assets/ppd-auth.js");
  if (!window.PPDData) await muatSkrip("/assets/ppd-data.js");
  if (!window.PPDAuth || !window.PPDData) throw new Error("Stor portal tidak tersedia");
  return { auth: window.PPDAuth, data: window.PPDData };
}
