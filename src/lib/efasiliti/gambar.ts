// Kecilkan gambar dalam pelayar sebelum disimpan ke localStorage (kuota stor terhad, ~5MB seluruh portal).

function muatImej(fail: File): Promise<HTMLImageElement> {
  return new Promise((ok, gagal) => {
    const url = URL.createObjectURL(fail);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      ok(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      gagal(new Error(`"${fail.name}" tidak dapat dibaca sebagai gambar`));
    };
    img.src = url;
  });
}

// Sisi panjang maksimum 1280px, JPEG kualiti ~0.7 → data URL
export async function kecilkanGambar(fail: File, maks = 1280, kualiti = 0.7): Promise<string> {
  if (!fail.type.startsWith("image/")) throw new Error(`"${fail.name}" bukan fail gambar`);
  const img = await muatImej(fail);
  const lebar = img.naturalWidth;
  const tinggi = img.naturalHeight;
  if (!lebar || !tinggi) throw new Error(`"${fail.name}" tidak dapat dibaca sebagai gambar`);
  const nisbah = Math.min(1, maks / Math.max(lebar, tinggi));
  const kanvas = document.createElement("canvas");
  kanvas.width = Math.max(1, Math.round(lebar * nisbah));
  kanvas.height = Math.max(1, Math.round(tinggi * nisbah));
  const ctx = kanvas.getContext("2d");
  if (!ctx) throw new Error("Pelayar ini tidak dapat memproses gambar");
  ctx.fillStyle = "#fff"; // PNG lutsinar → latar putih dalam JPEG
  ctx.fillRect(0, 0, kanvas.width, kanvas.height);
  ctx.drawImage(img, 0, 0, kanvas.width, kanvas.height);
  const url = kanvas.toDataURL("image/jpeg", kualiti);
  if (!url.startsWith("data:image/jpeg")) throw new Error("Pelayar ini tidak dapat memproses gambar");
  return url;
}
