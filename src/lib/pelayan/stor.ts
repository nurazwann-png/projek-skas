// Stor kongsi portal dalam PostgreSQL.
// Aplikasi (HTML asal dan React) masih membaca/menulis kunci localStorage yang sama; public/assets/ppd-segerak.js
// menyegerakkan kunci-kunci itu dengan jadual stor_item, satu baris bagi setiap item supaya dua pengguna yang
// mengubah item berlainan (cth. markah murid berlainan) tidak saling menimpa.
import { db, type Pertanyaan } from "./db";
import benihOrganisasi from "./benih-organisasi.json";
import { bersihNama } from "./nama";

export type JenisKoleksi = "senarai" | "peta" | "nilai";
export interface TakrifKoleksi {
  jenis: JenisKoleksi;
  id?: string[]; // medan pengenal bagi "senarai" (digabung dengan ":")
}

// Mesti sepadan dengan apa yang ditulis oleh aplikasi ke localStorage
export const KOLEKSI: Record<string, TakrifKoleksi> = {
  ppd_users: { jenis: "senarai", id: ["id"] },
  ppd_organisasi: { jenis: "senarai", id: ["kod"] },
  ppd_audit: { jenis: "senarai", id: ["t", "olehId"] },
  ppd_pengumuman: { jenis: "senarai", id: ["id"] },
  skas_kelas: { jenis: "senarai", id: ["id"] },
  skas_marks: { jenis: "peta" },
  ppd_skas_rekod: { jenis: "peta" },
  ppd_efasiliti_tiket: { jenis: "senarai", id: ["id"] },
  ppd_peringatan: { jenis: "senarai", id: ["kelasId"] },
  ppd_spm_intervensi: { jenis: "senarai", id: ["id"] },
  ppd_skas_maklumbalas_ai: { jenis: "senarai", id: ["t", "olehId"] },
  ppd_skas_sekolah: { jenis: "peta" }, // Pencapaian Sekolah 5.4.2, ikut kod sekolah
  ppd_skas_panduan: { jenis: "senarai", id: ["id"] }, // Panduan SKPM yang dimuat naik (peraturan + rujukan)
  ppd_skas_tetapan: { jenis: "nilai" }, // { tahunPenilaian, panduanAktif }
  ppd_profil: { jenis: "peta" }, // profil guru ikut id pengguna: jawatan, mata pelajaran, tahun mula
  ppd_profil_sekolah: { jenis: "peta" }, // profil sekolah ikut kod: alamat, hubungan, gred, bilangan
};
// Kunci berawalan (satu nilai bagi setiap akhiran)
export const AWALAN: Record<string, TakrifKoleksi> = {
  "skas_gps_sejarah:": { jenis: "nilai" },
  "skas_gps_sasaran:": { jenis: "nilai" },
};
const TERTIB = "__tertib";

export interface PenggunaStor {
  id: string;
  nama: string;
  emel: string;
  kodSekolah: string;
  org?: string;
  roles: string[];
}

export const DOMAIN_RASMI = ["moe.gov.my", "moe-dl.edu.my"];
export const DOMAIN_ADMIN = "moe.gov.my"; // Admin PPD & Superadmin mesti menggunakan emel @moe.gov.my
export const domain = (emel: string) => emel.trim().toLowerCase().split("@")[1] || "";
export const perananTinggi = (r: string) => r === "superadmin" || r.startsWith("admin_");
export const modDemo = () => process.env.MOD_DEMO === "1";

const DEMO_PENGGUNA: PenggunaStor[] = [
  { id: "u_norliza", nama: "NORLIZA BINTI AHMAD", emel: "norliza.ahmad@moe.gov.my", kodSekolah: "PPDDLT", roles: ["superadmin"] },
  { id: "u_azlan", nama: "AZLAN BIN HAMID", emel: "azlan.hamid@moe.gov.my", kodSekolah: "PPDDLT", roles: ["admin_skas", "admin_spm", "admin_efasiliti"] },
  { id: "u_razif", nama: "RAZIF BIN OTHMAN", emel: "razif.othman@moe-dl.edu.my", kodSekolah: "YEA6101", roles: ["sekolah_skas", "sekolah_spm", "sekolah_efasiliti"] },
  { id: "u_salmah", nama: "SALMAH BINTI JALIL", emel: "salmah.jalil@moe-dl.edu.my", kodSekolah: "YEA6102", roles: ["sekolah_efasiliti"] },
  { id: "u_azman", nama: "AZMAN BIN HARUN", emel: "azman.harun@moe-dl.edu.my", kodSekolah: "YEA6101", roles: [] },
];
const DEMO_ORGANISASI = [
  { kod: "YEA6101", nama: "SMK DALAT", lokasi: "Bandar", jenis: "Sekolah" },
  { kod: "YEA6102", nama: "SMK OYA", lokasi: "Luar Bandar", jenis: "Sekolah" },
  { kod: "YEA6103", nama: "SMK BATANG IGAN", lokasi: "Pedalaman", jenis: "Sekolah" },
  { kod: "YEA6104", nama: "SMK AGAMA IGAN", lokasi: "Luar Bandar", jenis: "Sekolah" },
  { kod: "PPDDLT", nama: "PPD DALAT", lokasi: "Bandar", jenis: "Pejabat" },
];

function takrif(kunci: string): { t: TakrifKoleksi; koleksi: string; idTetap?: string } | null {
  if (KOLEKSI[kunci]) return { t: KOLEKSI[kunci], koleksi: kunci, idTetap: KOLEKSI[kunci].jenis === "nilai" ? "_" : undefined };
  for (const a of Object.keys(AWALAN)) {
    if (kunci.startsWith(a) && kunci.length > a.length) return { t: AWALAN[a], koleksi: a, idTetap: kunci.slice(a.length) };
  }
  return null;
}

async function upsert(q: Pertanyaan, koleksi: string, id: string, nilai: unknown, oleh: string | null) {
  await q.query(
    `INSERT INTO stor_item (koleksi, id, nilai, oleh) VALUES ($1, $2, $3::jsonb, $4)
     ON CONFLICT (koleksi, id) DO UPDATE SET nilai = EXCLUDED.nilai, oleh = EXCLUDED.oleh, dikemas = now()`,
    [koleksi, id, JSON.stringify(nilai), oleh],
  );
}

// Benih kali pertama: senarai sekolah (sebenar, atau contoh dalam mod demo) dan akaun demo
let benihSiap: Promise<void> | null = null;
function pastikanBenih() {
  if (!benihSiap) {
    benihSiap = (async () => {
      const p = await db();
      await p.transaksi(async (q) => {
        const ada = await q.query<{ koleksi: string }>(`SELECT DISTINCT koleksi FROM stor_item WHERE koleksi IN ('ppd_organisasi','ppd_users')`);
        const set = new Set(ada.rows.map((r) => r.koleksi));
        if (!set.has("ppd_organisasi")) {
          const senarai = modDemo() ? DEMO_ORGANISASI : (benihOrganisasi as typeof DEMO_ORGANISASI);
          for (const o of senarai) await upsert(q, "ppd_organisasi", o.kod, o, null);
          await upsert(q, TERTIB, "ppd_organisasi", senarai.map((o) => o.kod), null);
        }
        if (!set.has("ppd_users") && modDemo()) {
          for (const u of DEMO_PENGGUNA) await upsert(q, "ppd_users", u.id, u, null);
          await upsert(q, TERTIB, "ppd_users", DEMO_PENGGUNA.map((u) => u.id), null);
        }
      });
    })().catch((e) => { benihSiap = null; throw e; });
  }
  return benihSiap;
}

type Baris = { koleksi: string; id: string; nilai: unknown };

function bina(baris: Baris[]): Record<string, unknown> {
  const ikut = new Map<string, Baris[]>();
  for (const b of baris) (ikut.get(b.koleksi) || ikut.set(b.koleksi, []).get(b.koleksi)!).push(b);
  const tertib = new Map((ikut.get(TERTIB) || []).map((b) => [b.id, b.nilai as string[]]));
  const keluar: Record<string, unknown> = {};
  for (const [kunci, t] of Object.entries(KOLEKSI)) {
    const b = ikut.get(kunci);
    if (!b || !b.length) continue;
    if (kunci === "ppd_users") {
      // Nama Google kadangkala berlabel ("PPD Dalat - …", "… (Guru)"); pulangkan nama sahaja
      const susun = tertib.get(kunci) || [];
      const kedudukan = new Map(susun.map((id, i) => [id, i]));
      keluar[kunci] = [...b]
        .sort((a, c) => (kedudukan.get(a.id) ?? 1e9) - (kedudukan.get(c.id) ?? 1e9))
        .map((x) => { const u = x.nilai as PenggunaStor; return { ...u, nama: bersihNama(u.nama) }; });
    } else if (t.jenis === "peta") keluar[kunci] = Object.fromEntries(b.map((x) => [x.id, x.nilai]));
    else if (t.jenis === "nilai") keluar[kunci] = b[0].nilai;
    else if (kunci === "ppd_audit") {
      keluar[kunci] = b.map((x) => x.nilai as { t: number }).sort((a, c) => c.t - a.t).slice(0, 500);
    } else {
      const susun = tertib.get(kunci) || [];
      const kedudukan = new Map(susun.map((id, i) => [id, i]));
      keluar[kunci] = [...b]
        .sort((a, c) => (kedudukan.get(a.id) ?? 1e9) - (kedudukan.get(c.id) ?? 1e9))
        .map((x) => x.nilai);
    }
  }
  for (const a of Object.keys(AWALAN)) for (const b of ikut.get(a) || []) keluar[a + b.id] = b.nilai;
  return keluar;
}

export async function bacaSemua(): Promise<Record<string, unknown>> {
  await pastikanBenih();
  const p = await db();
  const r = await p.query<Baris>(`SELECT koleksi, id, nilai FROM stor_item ORDER BY dikemas`);
  return bina(r.rows);
}

export async function bacaKoleksi<T = unknown>(kunci: string): Promise<T | undefined> {
  await pastikanBenih();
  const p = await db();
  const r = await p.query<Baris>(`SELECT koleksi, id, nilai FROM stor_item WHERE koleksi = $1 OR (koleksi = $2 AND id = $1) ORDER BY dikemas`, [kunci, TERTIB]);
  return bina(r.rows)[kunci] as T | undefined;
}

// Maklumat yang boleh dilihat sebelum log masuk: senarai sekolah (untuk pendaftaran); akaun demo dalam mod demo sahaja
export async function bacaAwam() {
  const semua = await bacaSemua();
  return {
    ppd_organisasi: semua.ppd_organisasi ?? [],
    ...(modDemo() ? { ppd_users: semua.ppd_users ?? [] } : {}),
  };
}

export async function senaraiPengguna(): Promise<PenggunaStor[]> {
  return ((await bacaKoleksi<PenggunaStor[]>("ppd_users")) || []).map((u) => ({ ...u, roles: u.roles || [] }));
}
export async function cariPengguna(id: string) {
  return (await senaraiPengguna()).find((u) => u.id === id) || null;
}
export async function cariPenggunaEmel(emel: string) {
  const e = emel.trim().toLowerCase();
  return (await senaraiPengguna()).find((u) => u.emel.trim().toLowerCase() === e) || null;
}
export async function tambahPengguna(u: PenggunaStor, oleh: string | null) {
  const p = await db();
  await p.transaksi(async (q) => {
    await upsert(q, "ppd_users", u.id, u, oleh);
    const t = await q.query<{ nilai: string[] }>(`SELECT nilai FROM stor_item WHERE koleksi = $1 AND id = 'ppd_users'`, [TERTIB]);
    await upsert(q, TERTIB, "ppd_users", [...(t.rows[0]?.nilai || []), u.id], oleh);
  });
}
export async function tambahAudit(e: Record<string, unknown> & { t: number; olehId: string | null }) {
  const p = await db();
  await upsert(p, "ppd_audit", `${e.t}:${e.olehId ?? ""}`, e, e.olehId);
}

/* ── Penulisan daripada pelayar ─────────────────────────────────────────── */
export interface Op {
  k: string;
  set?: Record<string, unknown>;
  del?: string[];
  tertib?: string[];
}
export interface Ditolak { k: string; id?: string; sebab: string }

const sama = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const tanpa = (u: PenggunaStor | undefined) => (u ? { ...u, roles: undefined, org: undefined } : undefined);

// Siapa boleh mengubah akaun & peranan: Superadmin semua; Admin X hanya Pentadbir Sekolah X bagi orang lain.
function semakPengguna(aktor: PenggunaStor, lama: PenggunaStor | undefined, baru: PenggunaStor | undefined): string | null {
  if (baru) {
    const tinggi = (baru.roles || []).filter(perananTinggi);
    const tinggiLama = new Set((lama?.roles || []).filter(perananTinggi));
    // Peranan Admin/Superadmin BAHARU hanya untuk emel @moe.gov.my (yang sedia ada tidak ditarik secara senyap)
    if (tinggi.some((r) => !tinggiLama.has(r)) && domain(baru.emel) !== DOMAIN_ADMIN) {
      return `Peranan Admin dan Superadmin hanya untuk emel @${DOMAIN_ADMIN}.`;
    }
  }
  if (aktor.roles.includes("superadmin")) return null;
  if (!lama || !baru) return "Hanya Superadmin boleh mendaftar atau memadam pengguna.";
  if (!sama(tanpa(lama), tanpa(baru))) {
    // Pengguna boleh membetulkan NAMA sendiri sahaja (emel, sekolah dan peranan kekal)
    const tanpaNama = (u: PenggunaStor) => ({ ...tanpa(u), nama: undefined });
    const namaSahaja = lama.id === aktor.id && sama(tanpaNama(lama), tanpaNama(baru))
      && sama([...(lama.roles || [])].sort(), [...(baru.roles || [])].sort()) && bersihNama(baru.nama).length >= 3;
    if (!namaSahaja) return "Hanya Superadmin boleh mengubah maklumat pengguna.";
  }
  const appAdmin = new Set(aktor.roles.filter((r) => r.startsWith("admin_")).map((r) => r.slice(6)));
  const a = new Set(lama.roles || []), b = new Set(baru.roles || []);
  const beza = [...a].filter((r) => !b.has(r)).concat([...b].filter((r) => !a.has(r)));
  if (!beza.length) return null;
  if (lama.id === aktor.id) return "Anda tidak boleh mengubah peranan sendiri.";
  for (const r of beza) {
    if (!r.startsWith("sekolah_") || !appAdmin.has(r.slice(8))) return "Anda tiada kebenaran untuk menetapkan peranan ini.";
  }
  return null;
}

export async function tulis(aktor: PenggunaStor, ops: Op[]): Promise<Ditolak[]> {
  await pastikanBenih();
  const p = await db();
  const ditolak: Ditolak[] = [];
  const adminApa = aktor.roles.some(perananTinggi);
  const superadmin = aktor.roles.includes("superadmin");

  await p.transaksi(async (q) => {
    for (const op of ops) {
      const tk = takrif(op.k);
      if (!tk) { ditolak.push({ k: op.k, sebab: "Kunci tidak dikenali." }); continue; }
      const { koleksi, idTetap } = tk;
      let set = Object.entries(op.set || {});
      let del = op.del || [];
      if (idTetap !== undefined) {
        set = set.filter(([id]) => id === "_").map(([, v]) => [idTetap, v]);
        del = del.includes("_") ? [idTetap] : [];
      }

      if (koleksi === "ppd_organisasi" && !superadmin) { ditolak.push({ k: op.k, sebab: "Hanya Superadmin boleh mengurus senarai sekolah." }); continue; }
      if (koleksi === "ppd_pengumuman" && !adminApa) { ditolak.push({ k: op.k, sebab: "Hanya Admin PPD boleh mengurus pengumuman." }); continue; }
      const adminSkas = superadmin || aktor.roles.includes("admin_skas");
      if ((koleksi === "ppd_skas_panduan" || koleksi === "ppd_skas_tetapan") && !adminSkas) { ditolak.push({ k: op.k, sebab: "Hanya Admin SK@S boleh mengurus panduan dan tahun penilaian." }); continue; }
      // Rekod guru: setiap guru hanya menulis rekod sendiri (kunci = id pengguna)
      if (koleksi === "ppd_skas_rekod" && !adminSkas) {
        const lain = [...set.map(([id]) => id), ...del].filter((id) => id !== aktor.id);
        if (lain.length) { ditolak.push({ k: op.k, sebab: "Anda hanya boleh mengubah rekod pencapaian sendiri." }); continue; }
      }
      // Profil guru: diri sendiri, atau Pentadbir SK@S bagi guru di sekolahnya
      if (koleksi === "ppd_profil" && !adminSkas) {
        const ids = [...set.map(([id]) => id), ...del].filter((id) => id !== aktor.id);
        if (ids.length) {
          const r = await q.query<{ id: string; nilai: PenggunaStor }>(`SELECT id, nilai FROM stor_item WHERE koleksi = 'ppd_users' AND id = ANY($1::text[])`, [ids]);
          const sekolahSama = aktor.roles.includes("sekolah_skas") && r.rows.length === ids.length && r.rows.every((x) => x.nilai.kodSekolah === aktor.kodSekolah);
          if (!sekolahSama) { ditolak.push({ k: op.k, sebab: "Anda hanya boleh mengubah profil sendiri." }); continue; }
        }
      }
      // Profil sekolah dan Pencapaian Sekolah: Pentadbir SK@S sekolah hanya menulis sekolah sendiri (kunci = kod sekolah)
      if (koleksi === "ppd_profil_sekolah" && !adminSkas) {
        const lain = [...set.map(([id]) => id), ...del].filter((id) => id !== aktor.kodSekolah);
        if (!aktor.roles.includes("sekolah_skas") || lain.length) { ditolak.push({ k: op.k, sebab: "Hanya Pentadbir SK@S sekolah ini boleh mengubah profil sekolah." }); continue; }
      }
      if (koleksi === "ppd_skas_sekolah" && !adminSkas) {
        const boleh = aktor.roles.includes("sekolah_skas");
        const lain = [...set.map(([id]) => id), ...del].filter((id) => id !== aktor.kodSekolah);
        if (!boleh || lain.length) { ditolak.push({ k: op.k, sebab: "Hanya Pentadbir SK@S sekolah ini boleh mengubah pencapaian sekolah." }); continue; }
      }

      if (koleksi === "ppd_users") {
        const sedia = await q.query<{ id: string; nilai: PenggunaStor }>(`SELECT id, nilai FROM stor_item WHERE koleksi = 'ppd_users'`);
        // Bandingkan dengan nama yang telah dibersihkan, sama seperti yang dihantar kepada pelayar
        const lama = new Map(sedia.rows.map((r) => [r.id, { ...r.nilai, nama: bersihNama(r.nilai.nama) }]));
        let gagal = false;
        for (const [id, v] of set) {
          const sebab = semakPengguna(aktor, lama.get(id), v as PenggunaStor);
          if (sebab) { ditolak.push({ k: op.k, id, sebab }); gagal = true; }
        }
        for (const id of del) {
          const sebab = id === aktor.id ? "Anda tidak boleh memadam akaun sendiri." : semakPengguna(aktor, lama.get(id), undefined);
          if (sebab) { ditolak.push({ k: op.k, id, sebab }); gagal = true; }
        }
        // Mesti kekal sekurang-kurangnya seorang Superadmin
        if (!gagal && superadmin) {
          const akhir = new Map(lama);
          for (const [id, v] of set) akhir.set(id, v as PenggunaStor);
          for (const id of del) akhir.delete(id);
          const adaSuper = [...akhir.values()].some((u) => (u.roles || []).includes("superadmin"));
          if (!adaSuper && [...lama.values()].some((u) => (u.roles || []).includes("superadmin"))) {
            ditolak.push({ k: op.k, sebab: "Sekurang-kurangnya seorang Superadmin diperlukan." }); gagal = true;
          }
        }
        if (gagal) continue; // seluruh op pengguna ditolak supaya pelayar memuat semula keadaan sebenar
        set = set.map(([id, v]) => [id, { ...(v as PenggunaStor), nama: bersihNama((v as PenggunaStor).nama) }]);
      }

      if (koleksi === "ppd_audit") {
        // Log audit: tambah sahaja, atas nama pelaku sebenar; pemadaman (had 500 di pelayar) diabaikan
        for (const [id, v] of set) {
          const e = v as { olehId?: string | null };
          if (e && e.olehId && e.olehId !== aktor.id) continue;
          await q.query(`INSERT INTO stor_item (koleksi, id, nilai, oleh) VALUES ($1, $2, $3::jsonb, $4) ON CONFLICT DO NOTHING`, [koleksi, id, JSON.stringify(v), aktor.id]);
        }
        continue;
      }

      for (const [id, v] of set) await upsert(q, koleksi, String(id), v, aktor.id);
      if (del.length) await q.query(`DELETE FROM stor_item WHERE koleksi = $1 AND id = ANY($2::text[])`, [koleksi, del]);
      if (op.tertib && tk.t.jenis === "senarai") await upsert(q, TERTIB, koleksi, op.tertib.map(String), aktor.id);
    }
  });
  return ditolak;
}
