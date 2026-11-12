// Ringkasan untuk window.print(): tersembunyi di skrin, satu-satunya kandungan semasa mencetak.
import { LAJUR_RINGKASAN, TAJUK_RINGKASAN, barisRingkasan } from "@/lib/efasiliti/eksport";
import type { Tiket } from "@/lib/efasiliti/jenis";

export interface Cetakan {
  senarai: Tiket[];
  keterangan: string;
  tarikh: string;
  oleh: string;
}

// Sembunyikan semua yang berada di luar pokok React (dialog Urus Peranan, portal) semasa mencetak
export const CSS_CETAK = `@media print {
  @page { margin: 14mm; }
  html, body { background: #fff !important; }
  body > *:not(:has(#ef-cetak)) { display: none !important; }
  #ef-cetak { font-size: 10.5pt; color: #000; }
  #ef-cetak table { width: 100%; border-collapse: collapse; }
  #ef-cetak th, #ef-cetak td { border: 1px solid #9ca3af; padding: 4px 6px; text-align: left; vertical-align: top; }
  #ef-cetak th { background: #f3f4f6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  #ef-cetak thead { display: table-header-group; }
  #ef-cetak tr { break-inside: avoid; }
}`;

export function RingkasanCetak({ cetakan }: { cetakan: Cetakan | null }) {
  if (!cetakan) return null;
  const baris = barisRingkasan(cetakan.senarai);
  return (
    <section id="ef-cetak" className="hidden print:block">
      <h1 style={{ fontSize: "15pt", fontWeight: 700 }}>{TAJUK_RINGKASAN}</h1>
      <p style={{ margin: "2px 0 0" }}>Dicetak pada {cetakan.tarikh} oleh {cetakan.oleh}</p>
      <p style={{ margin: "2px 0 10px" }}>{cetakan.keterangan} · {baris.length} aduan</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Bil.</th>
            {LAJUR_RINGKASAN.map((l) => <th key={l} scope="col">{l}</th>)}
          </tr>
        </thead>
        <tbody>
          {baris.map((b, i) => (
            <tr key={b.id}>
              <td>{i + 1}</td>
              <td style={{ whiteSpace: "nowrap" }}>{b.id}</td>
              <td>{b.sekolah}</td>
              <td>{b.tajuk}</td>
              <td>{b.kategori}</td>
              <td>{b.keutamaan}</td>
              <td>{b.status}</td>
              <td style={{ whiteSpace: "nowrap" }}>{b.tarikhPapar}</td>
              <td style={{ textAlign: "right" }}>{b.hari ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 8, fontSize: "9pt" }}>Hari terbuka: bagi aduan aktif, bilangan hari sejak dilaporkan; bagi aduan selesai atau ditolak, bilangan hari sehingga ditutup.</p>
    </section>
  );
}
