"use client";

// e-Fasiliti — aduan & pemantauan fasiliti sekolah (React + komponen gaya Tremor).
// Dipindahkan daripada public/e-fasiliti.html; stor (localStorage melalui assets/ppd-data.js) kekal dikongsi dengan aplikasi HTML.
import { CheckCircle2, CircleAlert, School, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { TabNavigation } from "@/components/tremor/ui";
import { STATUS_PRASYARAT, binaTiket, bolehLihat, kenaTindakan, mesejTindakan, skopTiket } from "@/lib/efasiliti/bantu";
import type { BorangAduan, DataEfasiliti, JenisMakluman, ModDialog, PropPaparan, TindakanTiket } from "@/lib/efasiliti/jenis";
import { muatSkrip, muatStorPortal, type PPDAuthApi, type Pengguna, type PerananApp, type Sesi } from "@/lib/portal/stor";
import { CSS_CETAK, RingkasanCetak, type Cetakan } from "./cetak";
import { DialogTiket } from "./dialog-tiket";
import { PaparanPJ } from "./paparan-pj";
import { PaparanPPD } from "./paparan-ppd";
import { PaparanSekolah } from "./paparan-sekolah";

type TabId = "pj" | "ppd" | "baru" | "saya";

type Keadaan =
  | { status: "memuat" }
  | { status: "ralat"; mesej: string }
  | { status: "sedia"; auth: PPDAuthApi; data: DataEfasiliti; pengguna: Pengguna; sesi: Sesi; peranan: PerananApp; sekolahSaya: string };

const LABEL_PERANAN: Record<PerananApp, string> = { ppd_admin: "Admin e-Fasiliti", school_admin: "Pentadbir Sekolah", teacher: "Aduan saya" };

export function EfasilitiApp() {
  const [k, setK] = useState<Keadaan>({ status: "memuat" });
  const [tab, setTab] = useState<TabId>("baru");
  const [versi, setVersi] = useState(0);
  const [toast, setToast] = useState<{ mesej: string; jenis: JenisMakluman } | null>(null);
  const [dialog, setDialog] = useState<{ id: string; mod: ModDialog } | null>(null);
  const [cetakan, setCetakan] = useState<Cetakan | null>(null);

  useEffect(() => {
    let batal = false;
    muatStorPortal()
      .then(({ auth, data: stor }) => {
        if (batal) return;
        const sesi = auth.session();
        const pengguna = sesi && auth.findById(sesi.uid);
        if (!sesi || !pengguna) return location.replace("/welcome.html");
        const data = stor as unknown as DataEfasiliti;
        const peranan = auth.appRoleFor(pengguna, sesi.level, "efasiliti");
        const sekolahSaya = data.sekolahUser(pengguna)?.nama || pengguna.org;
        const admin = peranan === "ppd_admin";
        setTab(admin ? "ppd" : "baru");
        // Pautan terus dari papan pemuka: /e-fasiliti?tiket=<id>
        const idPautan = new URLSearchParams(location.search).get("tiket");
        const t = idPautan ? data.efasiliti.tiket().find((x) => x.id === idPautan) : null;
        if (t && bolehLihat(t, peranan, sekolahSaya)) {
          if (!admin) setTab("saya");
          setDialog({ id: t.id, mod: "lihat" });
        }
        if (idPautan) history.replaceState(null, "", location.pathname);
        setK({ status: "sedia", auth, data, pengguna, sesi, peranan, sekolahSaya });
      })
      .catch((e: Error) => !batal && setK({ status: "ralat", mesej: e.message }));
    return () => {
      batal = true;
    };
  }, []);

  const sedia = k.status === "sedia";
  // Butang "Urus Peranan" di jalur atas (skrip kongsi yang sama dengan aplikasi lain)
  useEffect(() => {
    if (sedia) muatSkrip("/assets/ppd-roles.js", { app: "efasiliti" }).catch(() => {});
  }, [sedia]);

  // Baca semula apabila stor berubah di tab pelayar lain, atau peranan pengguna ditukar
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
    const t = setTimeout(() => setToast(null), toast.jenis === "ralat" ? 6000 : 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const data = sedia ? k.data : null;
  const pengguna = sedia ? k.pengguna : null;
  const peranan = sedia ? k.peranan : null;
  const sekolahSaya = sedia ? k.sekolahSaya : "";
  const admin = peranan === "ppd_admin";

  const semua = useMemo(() => {
    void versi;
    return data ? data.efasiliti.tiket() : [];
  }, [data, versi]);
  const tiket = useMemo(() => (pengguna && peranan ? skopTiket(semua, peranan, sekolahSaya, pengguna.id) : []), [semua, pengguna, peranan, sekolahSaya]);

  const makluman = useCallback((mesej: string, jenis: JenisMakluman = "ok") => setToast({ mesej, jenis }), []);
  const buka = useCallback((id: string, mod: ModDialog = "lihat") => setDialog({ id, mod }), []);

  // Semua penulisan membaca stor TERKINI dahulu supaya perubahan dari tab/aplikasi lain tidak ditimpa
  const hantar = useCallback(
    (b: BorangAduan): string | null => {
      if (!data || !pengguna) return null;
      const kini = data.efasiliti.tiket();
      const zon = data.sekolahList().find((s) => s.nama === sekolahSaya)?.zon || "Zon 1";
      const baharu = binaTiket(kini, b, pengguna, sekolahSaya, zon);
      if (!data.efasiliti.save([...kini, baharu])) {
        makluman(b.gambar.length ? "Aduan tidak disimpan: storan pelayar penuh. Kurangkan gambar dan cuba lagi." : "Aduan tidak disimpan: storan pelayar penuh.", "ralat");
        return null;
      }
      setVersi((v) => v + 1);
      setTab("saya");
      makluman(`Aduan ${baharu.id} berjaya dihantar.`);
      return baharu.id;
    },
    [data, pengguna, sekolahSaya, makluman],
  );

  const laksana = useCallback(
    (id: string, tindakan: TindakanTiket, nota = ""): boolean => {
      if (!data || !admin) return false;
      const kini = data.efasiliti.tiket();
      const t = kini.find((x) => x.id === id);
      setVersi((v) => v + 1);
      if (!t || t.status !== STATUS_PRASYARAT[tindakan]) {
        makluman(`Status ${id} telah berubah. Senarai dikemas kini; sila semak semula.`, "ralat");
        return false;
      }
      if (!data.efasiliti.save(kini.map((x) => (x.id === id ? kenaTindakan(x, tindakan, nota) : x)))) {
        makluman("Perubahan tidak disimpan: storan pelayar penuh.", "ralat");
        return false;
      }
      makluman(mesejTindakan(id, tindakan), tindakan === "tolak" ? "ralat" : "ok");
      return true;
    },
    [data, admin, makluman],
  );

  const cetak = useCallback(
    (senarai: PropPaparan["tiket"], keterangan: string) => {
      const tarikh = new Date().toLocaleString("ms-MY", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
      flushSync(() => setCetakan({ senarai, keterangan, tarikh, oleh: pengguna?.nama ?? "" }));
      window.print();
    },
    [pengguna],
  );

  const pilihTab = useCallback((id: TabId) => {
    setTab(id);
    window.scrollTo({ top: 0 });
  }, []);

  const senaraiTab: { id: TabId; label: string }[] = admin
    ? [
        { id: "pj", label: "Semakan PJ" },
        { id: "ppd", label: "Kelulusan PPD" },
      ]
    : [
        { id: "baru", label: "Aduan Baharu" },
        { id: "saya", label: `${peranan === "teacher" ? "Aduan Saya" : "Rekod Aduan Sekolah"} (${tiket.length})` },
      ];

  const tiketDialog = dialog && peranan ? (semua.find((t) => t.id === dialog.id && bolehLihat(t, peranan, sekolahSaya)) ?? null) : null;
  const prop: PropPaparan | null = sedia ? { tiket, data: k.data, pengguna: k.pengguna, peranan: k.peranan, sekolahSaya, buka, laksana, makluman, cetak } : null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 print:min-h-0 print:bg-white" style={{ fontFamily: "var(--ppd-font, system-ui, sans-serif)" }}>
      <link rel="stylesheet" href="/assets/ppd-theme.css" precedence="default" />
      <style>{CSS_CETAK}</style>

      <div className="print:hidden">
        <div className="ppd-strip">
          <div className="ppd-strip-l">
            <a href="/ppd-dalat.html">
              <svg viewBox="0 0 24 24" aria-hidden><polyline points="15 18 9 12 15 6" /></svg>
              Portal PPD Dalat
            </a>
            <span className="ppd-strip-sep">|</span>
            <span className="ppd-strip-app">e-Fasiliti · Pengurusan Fasiliti</span>
          </div>
          <div className="ppd-strip-r">
            <span className="ppd-flag" />
            <span>Portal rasmi KPM</span>
          </div>
        </div>

        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 pt-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#1d5fa0]/10 text-[#1d5fa0]"><Wrench className="size-5" aria-hidden /></span>
              <div className="min-w-0">
                <h1 className="truncate text-base leading-tight font-semibold text-gray-900">e-Fasiliti</h1>
                <p className="truncate text-xs text-gray-500">Sistem Aduan &amp; Pemantauan Fasiliti Sekolah</p>
              </div>
            </div>
            {sedia && (
              <div className="flex min-w-0 items-center gap-2.5 text-sm">
                <span className="shrink-0 rounded-full bg-[#13406e]/10 px-2.5 py-1 text-xs font-semibold text-[#13406e]">{k.sesi.level === "superadmin" ? "Superadmin" : LABEL_PERANAN[k.peranan]}</span>
                {admin ? (
                  <span className="hidden truncate text-gray-600 sm:inline">{k.pengguna.nama}</span>
                ) : (
                  <span className="flex min-w-0 items-center gap-1.5 text-gray-700"><School className="size-4 shrink-0 text-[#13406e]" aria-hidden /><span className="truncate font-medium">{sekolahSaya}</span></span>
                )}
              </div>
            )}
          </div>
          <div className="mx-auto mt-2 max-w-7xl px-4 sm:px-6">
            {sedia ? <TabNavigation tab={senaraiTab} aktif={tab} pilih={pilihTab} label="Bahagian e-Fasiliti" /> : <div className="h-[42px]" />}
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {k.status === "memuat" && <Rangka />}
          {k.status === "ralat" && <div role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-900 ring-1 ring-red-600/20 ring-inset">Data portal tidak dapat dimuatkan ({k.mesej}). Muat semula halaman, atau kembali ke Portal PPD Dalat.</div>}
          {prop && (tab === "pj" && admin ? <PaparanPJ {...prop} /> : tab === "ppd" && admin ? <PaparanPPD {...prop} /> : <PaparanSekolah {...prop} tab={tab === "saya" ? "saya" : "baru"} hantar={hantar} />)}
        </main>

        <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4">
          {toast && (
            <div role={toast.jenis === "ralat" ? "alert" : "status"} className="pointer-events-auto flex max-w-md items-start gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">
              {toast.jenis === "ralat" ? <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />}
              <span>{toast.mesej}</span>
            </div>
          )}
        </div>
      </div>

      <DialogTiket tiket={tiketDialog} mod={dialog?.mod ?? "lihat"} bolehSemak={admin} tutup={() => setDialog(null)} laksana={laksana} />
      <RingkasanCetak cetakan={cetakan} />
    </div>
  );
}

function Rangka() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Memuatkan data">
      <div className="h-16 rounded-lg bg-gray-200/70" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-lg bg-gray-200/70" />)}
      </div>
      <div className="h-80 rounded-lg bg-gray-200/70" />
    </div>
  );
}
