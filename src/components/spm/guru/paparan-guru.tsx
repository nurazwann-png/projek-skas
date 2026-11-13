"use client";

// Analitik SPM — paparan Guru: Kelas Saya → Urus Murid → Rekod Markah → Analisis Kelas → Status Pengisian.
// Stor kongsi (localStorage melalui PPDData) kekal sebagai satu-satunya sumber data; bentuk data tidak diubah.
import { useCallback, useEffect, useMemo, useState } from "react";
import { TabNavigation } from "@/components/tremor/ui";
import type { Kelas, Marks, UjianKey } from "@/lib/portal/stor";
import { UJIAN } from "@/lib/spm/analitik";
import { kelasGuru, simpanStor, type PropGuru } from "@/lib/spm/guru";
import { SepandukPeringatan, type PropTabGuru } from "./kongsi";
import { ModalPelajar, TabAnalisis } from "./tab-analisis";
import { TabKelas } from "./tab-kelas";
import { TabRekod, type StatusSimpan } from "./tab-rekod";
import { TabStatus } from "./tab-status";
import { useLawatan, type Langkah } from "@/lib/portal/lawatan";

const LAWATAN: Langkah[] = [
  { tajuk: "Analitik SPM: paparan guru", teks: "Di sini anda mengisi markah murid dan memantau prestasi kelas yang anda ajar. Markah disimpan secara automatik, termasuk semasa luar talian." },
  { sel: '[data-tab="kelas"]', tajuk: "Kelas Saya", teks: "Senarai kelas dan subjek yang anda ajar. Klik kelas untuk mula mengisi markah." },
  { sel: '[data-tab="rekod"]', tajuk: "Rekod Markah", teks: "Pilih peperiksaan, kemudian isi markah terus dalam jadual. Untuk ramai murid, muat turun <b>templat Excel</b>, isi, dan <b>muat naik Excel</b>; pratonton dipaparkan sebelum disimpan. Lajur <b>Sasaran</b> ialah sasaran SPM setiap murid." },
  { sel: '[data-tab="analisis"]', tajuk: "Analisis Kelas", teks: "GPS kelas, taburan gred dan murid berisiko. Klik nama murid untuk melihat prestasinya merentas peperiksaan." },
  { sel: '[data-tab="status"]', tajuk: "Status Pengisian", teks: "Berapa markah yang belum diisi bagi setiap kelas sebelum tarikh akhir. Peringatan daripada pentadbir sekolah juga dipaparkan di sini." },
];

const TAB = [
  { id: "kelas", label: "Kelas Saya" },
  { id: "rekod", label: "Rekod Markah" },
  { id: "analisis", label: "Analisis Kelas" },
  { id: "status", label: "Status Pengisian" },
] as const;
type TabId = (typeof TAB)[number]["id"];

interface Navigasi {
  tab: TabId;
  kelasId: string | null;
  ujian: UjianKey | null;
  paparan: "kelas" | "murid";
}

// Pautan terus daripada "Tugasan Saya" portal: ?kelas=<id>&ujian=<key> membuka pengisian markah kelas itu
function navigasiAwal(kelas: Kelas[]): Navigasi {
  const asas: Navigasi = { tab: "kelas", kelasId: null, ujian: null, paparan: "kelas" };
  if (typeof window === "undefined") return asas;
  const q = new URLSearchParams(window.location.search);
  const kid = q.get("kelas");
  if (!kid || !kelas.some((k) => k.id === kid)) return asas;
  const uj = UJIAN.find((u) => u.key === q.get("ujian"));
  return { ...asas, tab: "rekod", kelasId: kid, ujian: uj ? uj.key : null };
}

export function PaparanGuru({ data, pengguna, segar, makluman, versi }: PropGuru) {
  const [lokal, setLokal] = useState(0);
  const [simpanan, setSimpanan] = useState<StatusSimpan>({ masa: null, gagal: false });
  const [nav, setNav] = useState<Navigasi>(() => navigasiAwal(kelasGuru(data, pengguna.id)));
  const [pelajarId, setPelajarId] = useState<string | null>(null);
  useLawatan("spm-guru", LAWATAN);

  // Baca semula stor setiap kali ia berubah (versi daripada induk, lokal selepas tulisan sendiri)
  const { kelas, marks } = useMemo<{ kelas: Kelas[]; marks: Marks }>(() => {
    void versi;
    void lokal;
    return { kelas: kelasGuru(data, pengguna.id), marks: data.spm.marks() };
  }, [data, pengguna.id, versi, lokal]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (!q.has("kelas") && !q.has("ujian")) return;
    q.delete("kelas");
    q.delete("ujian");
    const baki = q.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${baki ? `?${baki}` : ""}${window.location.hash}`);
  }, []);

  const tulis = useCallback<PropTabGuru["tulis"]>(
    (ubah) => {
      const ok = simpanStor(data, ubah);
      setSimpanan({ masa: ok ? new Date() : null, gagal: !ok });
      if (!ok) makluman("Gagal disimpan. Semak storan pelayar anda.");
      setLokal((v) => v + 1);
      segar();
      return ok;
    },
    [data, makluman, segar],
  );

  const pergi = useCallback((n: Partial<Navigasi>) => {
    setNav((lama) => ({ ...lama, ...n }));
    if (n.tab) window.scrollTo({ top: 0 });
  }, []);
  // Tukar kelas: ujian yang sedang diisi ditutup supaya markah tidak terisi dalam ujian yang salah
  const bukaRekod = useCallback((kelasId: string, ujian?: UjianKey) => setNav((lama) => ({ tab: "rekod", kelasId, paparan: "kelas", ujian: ujian ?? (lama.kelasId === kelasId ? lama.ujian : null) })), []);
  const bukaMurid = useCallback((kelasId: string) => setNav((lama) => ({ tab: "kelas", kelasId, paparan: "murid", ujian: lama.kelasId === kelasId ? lama.ujian : null })), []);
  const pilihKelas = useCallback((kelasId: string) => setNav((lama) => ({ ...lama, kelasId, ujian: lama.kelasId === kelasId ? lama.ujian : null })), []);

  const kelasAktif = kelas.find((k) => k.id === nav.kelasId) ?? null;
  const prop: PropTabGuru = { data, pengguna, kelas, marks, tulis, makluman, bukaRekod, bukaMurid, bukaPelajar: setPelajarId };

  return (
    <div className="space-y-5">
      <div className="border-b border-gray-200">
        <TabNavigation tab={[...TAB]} aktif={nav.tab} pilih={(id) => pergi({ tab: id, ...(id === "kelas" ? { paparan: "kelas" as const } : {}) })} label="Bahagian paparan guru" />
      </div>

      {nav.tab !== "rekod" && <SepandukPeringatan {...prop} />}

      <div role="tabpanel" aria-label={TAB.find((t) => t.id === nav.tab)?.label}>
        {nav.tab === "kelas" && <TabKelas {...prop} paparan={nav.paparan} kelasAktif={kelasAktif} kembali={() => pergi({ paparan: "kelas" })} />}
        {nav.tab === "rekod" && <TabRekod {...prop} kelasAktif={kelasAktif} ujianAktif={kelasAktif ? nav.ujian : null} pilihKelas={pilihKelas} pilihUjian={(ujian) => pergi({ ujian })} simpanan={simpanan} />}
        {nav.tab === "analisis" && <TabAnalisis {...prop} kelasAktif={kelasAktif} pilihKelas={pilihKelas} />}
        {nav.tab === "status" && <TabStatus {...prop} />}
      </div>

      <ModalPelajar pelajarId={pelajarId} kelas={kelas} marks={marks} tutup={() => setPelajarId(null)} />
    </div>
  );
}

export type { PropGuru };
