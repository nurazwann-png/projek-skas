// Nama daripada akaun Google KPM kadangkala disertai label organisasi atau jawatan,
// contohnya "PPD Dalat - Ahmad bin Ali" atau "Ahmad bin Ali (Guru)". Simpan nama sahaja.
// Mesti sepadan dengan bersihNama dalam public/assets/ppd-auth.js.
export function bersihNama(nama: string): string {
  let n = String(nama || "").replace(/\s+/g, " ").trim();
  n = n.replace(/^\(?\s*(PPD|PEJABAT PENDIDIKAN DAERAH|JPN|KPM)\b[^-–—:|()]*\)?\s*[-–—:|]\s*/i, "");
  for (let i = 0; i < 3; i++) n = n.replace(/\s*\([^()]*\)\s*$/, "").replace(/\s*[-–—]\s*(GURU|CIKGU|TEACHER|PENGETUA|GURU BESAR|GPK|PPD DALAT)\s*$/i, "");
  return n.replace(/\s+/g, " ").trim().toLocaleUpperCase("ms-MY");
}
