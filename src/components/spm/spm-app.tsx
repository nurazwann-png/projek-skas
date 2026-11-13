"use client";

// Analitik SPM (React + komponen gaya Tremor).
// Menggantikan public/spm-analytics.html: paparan Admin PPD, Pentadbir Sekolah dan Guru.
import { CheckCircle2, LineChart as IkonCarta } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SkopCartaKonteks } from "@/components/tremor/charts";
import { TabNavigation } from "@/components/tremor/ui";
import { muatSkrip, muatStorPortal, type PPDAuthApi, type PPDDataApi, type Pengguna, type PerananApp, type Sesi } from "@/lib/portal/stor";
import { analisisDaerah } from "@/lib/spm/analitik";
import type { PropTab } from "./kongsi";
import { TabBench, TabJurang, TabSubjek } from "./tab-analisis";
import { TabDaerah, TabKedudukan, TabSemak } from "./tab-ringkasan";
import { PaparanGuru } from "./guru/paparan-guru";
import { PaparanPentadbir } from "./pentadbir/paparan-pentadbir";
import { PanelHeadcount } from "./headcount";
import { TabIntervensi, TabLaporan, TabRamal } from "./tab-tindakan";

const TAB = [
  { id: "daerah", label: "Analitik Daerah" },
  { id: "kedudukan", label: "Kedudukan Sekolah" },
  { id: "jurang", label: "Analisis Jurang" },
  { id: "semak", label: "Semak Sekolah" },
  { id: "bench", label: "Penanda Aras" },
  { id: "subjek", label: "Analisis Subjek" },
  { id: "intervensi", label: "Intervensi" },
  { id: "ramal", label: "Ramalan GPS" },
  { id: "headcount", label: "Headcount" },
  { id: "laporan", label: "Laporan Daerah" },
] as const;
type TabId = (typeof TAB)[number]["id"];

type Keadaan =
  | { status: "memuat" }
  | { status: "ralat"; mesej: string }
  | { status: "sedia"; auth: PPDAuthApi; data: PPDDataApi; pengguna: Pengguna; sesi: Sesi; peranan: PerananApp };

export function SpmApp() {
  const [k, setK] = useState<Keadaan>({ status: "memuat" });
  const [tab, setTab] = useState<TabId>("daerah");
  const [versi, setVersi] = useState(0);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let batal = false;
    muatStorPortal()
      .then(({ auth, data }) => {
        if (batal) return;
        const sesi = auth.session();
        const pengguna = sesi && auth.findById(sesi.uid);
        if (!sesi || !pengguna) return location.replace("/welcome.html");
        // Analitik SPM hanya untuk SMK dan pegawai PPD
        if (!auth.aksesApp(pengguna, "spm")) return location.replace("/ppd-dalat.html");
        const peranan = auth.appRoleFor(pengguna, sesi.level, "spm");
        const dariHash = TAB.find((t) => t.id === location.hash.slice(1));
        if (dariHash) setTab(dariHash.id);
        setK({ status: "sedia", auth, data, pengguna, sesi, peranan });
      })
      .catch((e: Error) => !batal && setK({ status: "ralat", mesej: e.message }));
    return () => {
      batal = true;
    };
  }, []);

  const sedia = k.status === "sedia";
  const admin = sedia && k.peranan === "ppd_admin";
  // Butang "Urus Peranan" di jalur atas (skrip kongsi yang sama dengan aplikasi lain)
  useEffect(() => {
    if (sedia) muatSkrip("/assets/ppd-roles.js", { app: "spm" }).catch(() => {});
  }, [sedia]);

  // Kira semula apabila stor berubah di tab pelayar lain, atau peranan pengguna ditukar
  useEffect(() => {
    const segar = () => setVersi((v) => v + 1);
    const peranan = () => location.reload();
    window.addEventListener("storage", segar);
    window.addEventListener("ppd-peranan-berubah", peranan);
    return () => {
      window.removeEventListener("storage", segar);
      window.removeEventListener("ppd-peranan-berubah", peranan);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const data = sedia ? k.data : null;
  const d = useMemo(() => {
    void versi;
    return data && admin ? analisisDaerah(data.spm.kelas(), data.spm.marks(), data.sekolahList(), data.PEPERIKSAAN_SEMASA) : null;
  }, [data, admin, versi]);
  const amaran = useMemo(() => {
    void versi;
    return data ? data.amaranSPM() : [];
  }, [data, versi]);

  const pilihTab = useCallback((id: TabId) => {
    setTab(id);
    history.replaceState(null, "", id === "daerah" ? location.pathname : `#${id}`);
    window.scrollTo({ top: 0 });
  }, []);
  const segar = useCallback(() => setVersi((v) => v + 1), []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" style={{ fontFamily: "var(--ppd-font, system-ui, sans-serif)" }}>
      <link rel="stylesheet" href="/assets/ppd-theme.css" precedence="default" />

      <div className="ppd-strip">
        <div className="ppd-strip-l">
          <a href="/ppd-dalat.html">
            <svg viewBox="0 0 24 24" aria-hidden><polyline points="15 18 9 12 15 6" /></svg>
            Portal PPD Dalat
          </a>
          <span className="ppd-strip-sep">|</span>
          <span className="ppd-strip-app">Analitik SPM</span>
        </div>
        <div className="ppd-strip-r">
          <span className="ppd-flag" />
          <span>Portal rasmi KPM</span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 pt-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#b7791f]/10 text-[#b7791f]"><IkonCarta className="size-5" aria-hidden /></span>
            <div className="min-w-0">
              <h1 className="truncate text-base leading-tight font-semibold text-gray-900">Analitik SPM</h1>
              <p className="truncate text-xs text-gray-500">Sijil Pelajaran Malaysia · Daerah Dalat{d ? ` · ${d.peperiksaan.label}` : ""}</p>
            </div>
          </div>
          {sedia && (
            <div className="flex items-center gap-2.5 text-sm">
              <span className="rounded-full bg-[#13406e]/10 px-2.5 py-1 text-xs font-semibold text-[#13406e]">{k.sesi.level === "superadmin" ? "Superadmin" : admin ? "Admin SPM" : k.peranan === "school_admin" ? "Pentadbir Sekolah" : "Guru"}</span>
              <span className="hidden text-gray-600 sm:inline">{k.pengguna.nama}</span>
            </div>
          )}
        </div>
        {admin ? (
          <div className="mx-auto mt-2 max-w-7xl px-4 sm:px-6">
            <TabNavigation tab={[...TAB]} aktif={tab} pilih={pilihTab} label="Bahagian Analitik SPM" />
          </div>
        ) : (
          <div className="h-3" />
        )}
      </header>

      <SkopCartaKonteks.Provider value={sedia ? { peranan: admin ? "ppd_admin" : k.peranan === "school_admin" ? "school_admin" : "teacher", label: admin ? "Daerah Dalat" : k.pengguna.org } : null}>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {k.status === "memuat" && <Rangka />}
        {k.status === "ralat" && <div role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-900 ring-1 ring-red-600/20 ring-inset">Data portal tidak dapat dimuatkan ({k.mesej}). Muat semula halaman, atau kembali ke Portal PPD Dalat.</div>}
        {sedia && k.peranan === "teacher" && <PaparanGuru data={k.data} pengguna={k.pengguna} segar={segar} makluman={setToast} versi={versi} />}
        {sedia && k.peranan === "school_admin" && <PaparanPentadbir data={k.data} pengguna={k.pengguna} segar={segar} makluman={setToast} versi={versi} />}
        {sedia && admin && d && (d.sekolah.length === 0 ? <div className="rounded-md bg-white p-8 text-center text-sm text-gray-500 ring-1 ring-gray-200 ring-inset">Belum ada kelas atau markah direkodkan oleh mana-mana sekolah.</div> : <Kandungan tab={tab} prop={{ d, data: k.data, pengguna: k.pengguna, amaran, segar, makluman: setToast }} />)}
      </main>
      </SkopCartaKonteks.Provider>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4">
        {toast && (
          <div className="pointer-events-auto flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">
            <CheckCircle2 className="size-4 text-emerald-400" aria-hidden /> {toast}
          </div>
        )}
      </div>
    </div>
  );
}

function Kandungan({ tab, prop }: { tab: TabId; prop: PropTab }) {
  switch (tab) {
    case "daerah": return <TabDaerah {...prop} />;
    case "kedudukan": return <TabKedudukan {...prop} />;
    case "jurang": return <TabJurang {...prop} />;
    case "semak": return <TabSemak {...prop} />;
    case "bench": return <TabBench {...prop} />;
    case "subjek": return <TabSubjek {...prop} />;
    case "intervensi": return <TabIntervensi {...prop} />;
    case "ramal": return <TabRamal {...prop} />;
    case "headcount": return <PanelHeadcount kelas={prop.data.spm.kelas()} marks={prop.data.spm.marks()} tajuk="Headcount daerah" />;
    case "laporan": return <TabLaporan />;
  }
}

function Rangka() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Memuatkan data">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-lg bg-gray-200/70" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="h-80 rounded-lg bg-gray-200/70" />
        <div className="h-80 rounded-lg bg-gray-200/70" />
      </div>
    </div>
  );
}
