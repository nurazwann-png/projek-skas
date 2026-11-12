"use client";

// Paparan Guru (aduan sendiri) dan Pentadbir Sekolah (semua aduan sekolah): borang aduan baharu + rekod aduan.
import { Camera, Eye, ImagePlus, Send, Trash2 } from "lucide-react";
import { useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Button, Card, Input, Label, Select, Table, TableRoot, Td, Textarea, Th } from "@/components/tremor/ui";
import { fmtTarikh } from "@/lib/efasiliti/bantu";
import { kecilkanGambar } from "@/lib/efasiliti/gambar";
import { KATEGORI, KEUTAMAAN, MAKS_GAMBAR, type BorangAduan, type Keutamaan, type PropPaparan } from "@/lib/efasiliti/jenis";
import { cn } from "@/lib/utils";
import { AliranKerja, BarEksport, Kosong, LencanaKeutamaan, LencanaStatus, Penapis, useTapis } from "./kongsi";

export function PaparanSekolah(p: PropPaparan & { tab: "baru" | "saya"; hantar: (b: BorangAduan) => string | null }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Aduan kerosakan sekolah</h2>
        <p className="mt-0.5 max-w-[62ch] text-sm text-gray-500">Laporkan kerosakan infrastruktur dan jejak status tindakan dari semakan Penolong Jurutera hingga pembaikan selesai.</p>
      </div>
      <AliranKerja aktif="sekolah" />
      {p.tab === "baru" ? <BorangAduanBaharu sekolahSaya={p.sekolahSaya} hantar={p.hantar} makluman={p.makluman} /> : <RekodAduan {...p} />}
    </div>
  );
}

/* ── Borang aduan baharu ── */
type Medan = "tajuk" | "kategori" | "keutamaan" | "butiran";
const KOSONG: Record<Medan, string> = { tajuk: "", kategori: "", keutamaan: "", butiran: "" };
const RALAT: Record<Medan, string> = {
  tajuk: "Masukkan tajuk aduan.",
  kategori: "Pilih kategori kerosakan.",
  keutamaan: "Pilih tahap keutamaan.",
  butiran: "Nyatakan butiran kerosakan.",
};

function BorangAduanBaharu({ sekolahSaya, hantar, makluman }: Pick<PropPaparan, "sekolahSaya" | "makluman"> & { hantar: (b: BorangAduan) => string | null }) {
  const id = useId();
  const [nilai, setNilai] = useState(KOSONG);
  const [ralat, setRalat] = useState<Partial<Record<Medan, boolean>>>({});
  const [gambar, setGambar] = useState<string[]>([]);
  const [memproses, setMemproses] = useState(false);
  const [gagalSimpan, setGagalSimpan] = useState(false);
  const borang = useRef<HTMLFormElement>(null);

  const set = (k: Medan, v: string) => {
    setNilai((n) => ({ ...n, [k]: v }));
    setRalat((r) => ({ ...r, [k]: false }));
  };

  const pilihGambar = async (e: ChangeEvent<HTMLInputElement>) => {
    const fail = [...(e.target.files ?? [])];
    e.target.value = ""; // benarkan fail yang sama dipilih semula
    const baki = MAKS_GAMBAR - gambar.length;
    if (!fail.length || baki <= 0) return;
    if (fail.length > baki) makluman(`Maksimum ${MAKS_GAMBAR} gambar bagi setiap aduan. ${fail.length - baki} gambar tidak ditambah.`, "ralat");
    setMemproses(true);
    const baharu: string[] = [];
    for (const f of fail.slice(0, baki)) {
      try {
        baharu.push(await kecilkanGambar(f));
      } catch (err) {
        makluman(err instanceof Error ? `${err.message}.` : "Gambar tidak dapat diproses.", "ralat");
      }
    }
    setGambar((g) => [...g, ...baharu].slice(0, MAKS_GAMBAR));
    setGagalSimpan(false);
    setMemproses(false);
  };

  const serah = (e: FormEvent) => {
    e.preventDefault();
    const medan = Object.keys(KOSONG) as Medan[];
    const tiada = medan.filter((k) => !nilai[k].trim());
    if (tiada.length) {
      setRalat(Object.fromEntries(tiada.map((k) => [k, true])));
      makluman("Sila lengkapkan semua medan bertanda *", "ralat");
      borang.current?.querySelector<HTMLElement>(`#${CSS.escape(`${id}-${tiada[0]}`)}`)?.focus();
      return;
    }
    const idTiket = hantar({ tajuk: nilai.tajuk.trim(), kategori: nilai.kategori, keutamaan: nilai.keutamaan as Keutamaan, butiran: nilai.butiran.trim(), gambar });
    setGagalSimpan(!idTiket); // berjaya: aplikasi beralih ke tab rekod dan borang ini dinyahlekap
  };

  const prop = (k: Medan) => ({
    id: `${id}-${k}`,
    value: nilai[k],
    "aria-invalid": !!ralat[k],
    "aria-describedby": ralat[k] ? `${id}-${k}-ralat` : undefined,
    "aria-required": true,
    className: cn(ralat[k] && "border-red-600 focus:border-red-600 focus:ring-red-600/20"),
  });
  const Ralat = ({ k }: { k: Medan }) => (ralat[k] ? <p id={`${id}-${k}-ralat`} className="mt-1 text-xs font-medium text-red-700">{RALAT[k]}</p> : null);
  const Wajib = () => <span className="text-red-700" aria-hidden> *</span>;
  const penuh = gambar.length >= MAKS_GAMBAR;
  const butangFail = cn(
    "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-xs transition hover:bg-gray-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#c8962a]",
    (penuh || memproses) && "pointer-events-none opacity-50",
  );

  return (
    <Card>
      <form ref={borang} onSubmit={serah} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`${id}-sekolah`}>Nama sekolah</Label>
            <Input id={`${id}-sekolah`} value={sekolahSaya} readOnly className="bg-gray-50 text-gray-600" />
          </div>
          <div>
            <Label htmlFor={`${id}-tajuk`}>Tajuk aduan<Wajib /></Label>
            <Input {...prop("tajuk")} type="text" maxLength={100} placeholder="Contoh: Paip bocor di makmal sains" onChange={(e) => set("tajuk", e.target.value)} />
            <Ralat k="tajuk" />
          </div>
          <div>
            <Label htmlFor={`${id}-kategori`}>Kategori kerosakan<Wajib /></Label>
            <Select {...prop("kategori")} onChange={(e) => set("kategori", e.target.value)}>
              <option value="">Pilih kategori</option>
              {KATEGORI.map((k) => <option key={k}>{k}</option>)}
            </Select>
            <Ralat k="kategori" />
          </div>
          <div>
            <Label htmlFor={`${id}-keutamaan`}>Tahap keutamaan<Wajib /></Label>
            <Select {...prop("keutamaan")} onChange={(e) => set("keutamaan", e.target.value)}>
              <option value="">Pilih keutamaan</option>
              {KEUTAMAAN.map((k) => <option key={k}>{k}</option>)}
            </Select>
            <Ralat k="keutamaan" />
            <p className="mt-1 text-xs text-gray-500">Kritikal: membahayakan keselamatan murid atau menghentikan PdP.</p>
          </div>
        </div>

        <div>
          <Label htmlFor={`${id}-butiran`}>Butiran kerosakan<Wajib /></Label>
          <Textarea {...prop("butiran")} rows={4} placeholder="Nyatakan lokasi tepat (blok, aras, bilik), bila mula berlaku, dan kesan kepada murid atau PdP." onChange={(e) => set("butiran", e.target.value)} />
          <Ralat k="butiran" />
        </div>

        <fieldset>
          <legend className="mb-1 block text-sm font-medium text-gray-900">Gambar kerosakan <span className="font-normal text-gray-500">(pilihan, sehingga {MAKS_GAMBAR})</span></legend>
          <div className="flex flex-wrap gap-2">
            <label className={butangFail}>
              <Camera className="size-4" aria-hidden /> Ambil gambar
              <input type="file" accept="image/*" capture="environment" multiple className="sr-only" onChange={pilihGambar} disabled={penuh || memproses} />
            </label>
            <label className={butangFail}>
              <ImagePlus className="size-4" aria-hidden /> Pilih dari galeri
              <input type="file" accept="image/*" multiple className="sr-only" onChange={pilihGambar} disabled={penuh || memproses} />
            </label>
          </div>
          <p className="mt-1.5 text-xs text-gray-500" aria-live="polite">
            {memproses ? "Memproses gambar…" : `${gambar.length} daripada ${MAKS_GAMBAR} gambar dilampirkan. Gambar dikecilkan secara automatik sebelum disimpan.`}
          </p>
          {gambar.length > 0 && (
            <ul className="mt-2 grid grid-cols-3 gap-2 sm:max-w-md">
              {gambar.map((src, i) => (
                <li key={i} className="relative overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Gambar ${i + 1} yang dilampirkan`} className="aspect-square w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setGambar((g) => g.filter((_, k) => k !== i));
                      setGagalSimpan(false);
                    }}
                    className="absolute top-1 right-1 grid size-8 place-items-center rounded-md bg-white/95 text-red-700 shadow-sm ring-1 ring-gray-300 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-[#c8962a]"
                    aria-label={`Buang gambar ${i + 1}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        {gagalSimpan && (
          <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-900 ring-1 ring-red-600/20 ring-inset">
            <b>Aduan tidak disimpan.</b> Storan pelayar ini sudah penuh. {gambar.length ? "Buang satu atau lebih gambar, kemudian hantar semula." : "Hubungi pentadbir portal untuk mengosongkan storan."} Maklumat yang anda isi masih ada di borang ini.
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500">Medan bertanda <span className="text-red-700">*</span> wajib diisi.</p>
          <Button type="submit" disabled={memproses} className="w-full px-5 py-2.5 sm:w-auto"><Send className="size-4" aria-hidden /> Hantar laporan</Button>
        </div>
      </form>
    </Card>
  );
}

/* ── Rekod aduan ── */
function RekodAduan({ tiket, peranan, sekolahSaya, buka, cetak, makluman }: PropPaparan) {
  const guru = peranan === "teacher";
  const { tapisan, setTapisan, ditapis, adaTapisan, keterangan } = useTapis(tiket);
  return (
    <Card className="p-0 sm:p-0">
      <div className="space-y-3 border-b border-gray-200 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">{guru ? "Aduan yang anda hantar bagi " : "Semua aduan "}<b className="text-gray-900">{sekolahSaya}</b></p>
          {!guru && <BarEksport senarai={ditapis} keterangan={`${sekolahSaya} · ${keterangan}`} cetak={cetak} makluman={makluman} />}
        </div>
        {tiket.length > 0 && <Penapis tapisan={tapisan} ubah={setTapisan} />}
      </div>
      {tiket.length === 0 ? (
        <Kosong tajuk={guru ? "Anda belum menghantar aduan" : "Tiada aduan untuk sekolah ini"} sub="Aduan yang dihantar akan dipaparkan di sini." />
      ) : ditapis.length === 0 ? (
        <Kosong tajuk="Tiada aduan sepadan dengan tapisan" sub="Ubah atau set semula tapisan." />
      ) : (
        <TableRoot>
          <Table className="border-b-0">
            <thead>
              <tr>
                <Th>ID tiket</Th>
                <Th>Tajuk</Th>
                <Th>Kategori</Th>
                <Th>Tarikh</Th>
                <Th>Keutamaan</Th>
                <Th>Status</Th>
                <Th><span className="sr-only">Tindakan</span></Th>
              </tr>
            </thead>
            <tbody>
              {ditapis.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <Td className="font-mono text-xs whitespace-nowrap">{t.id}</Td>
                  <Td className="min-w-44 font-medium text-gray-900">{t.tajuk}</Td>
                  <Td className="whitespace-nowrap">{t.kategori}</Td>
                  <Td className="whitespace-nowrap">{fmtTarikh(t.tarikh)}</Td>
                  <Td><LencanaKeutamaan keutamaan={t.keutamaan} /></Td>
                  <Td><LencanaStatus status={t.status} /></Td>
                  <Td><Button variant="secondary" onClick={() => buka(t.id)} aria-label={`Butiran ${t.id}`}><Eye className="size-4" aria-hidden /> Butiran</Button></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableRoot>
      )}
      {adaTapisan && ditapis.length > 0 && <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500 sm:px-5">Memaparkan {ditapis.length} daripada {tiket.length} aduan.</p>}
    </Card>
  );
}
