import { useEffect } from "react";
import { muatSkrip } from "./stor";

// Lawatan berpandu kali pertama (public/assets/ppd-lawatan.js) untuk halaman React
export type Langkah = { sel?: string; alt?: string; tajuk: string; teks: string };
type PPDLawatan = { mula(id: string, langkah: Langkah[], o?: { paksa?: boolean }): boolean };

export function mulaLawatan(id: string, langkah: Langkah[], paksa = false) {
  muatSkrip("/assets/ppd-lawatan.js").then(() => {
    (window as unknown as { PPDLawatan?: PPDLawatan }).PPDLawatan?.mula(id, langkah, { paksa });
  }).catch(() => {});
}

export function useLawatan(id: string, langkah: Langkah[]) {
  useEffect(() => {
    const t = setTimeout(() => mulaLawatan(id, langkah), 800);
    return () => clearTimeout(t);
    // Sekali sahaja semasa paparan dibuka; langkah ialah pemalar modul
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}
