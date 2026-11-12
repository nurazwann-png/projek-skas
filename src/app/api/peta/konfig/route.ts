import { connection } from "next/server";

// Konfigurasi peta untuk halaman statik (public/*.html).
// Kunci Maps JavaScript API memang dihantar ke pelayar; keselamatannya bergantung pada sekatan domain (HTTP referrer)
// dan sekatan API yang ditetapkan di Google Cloud Console. Kunci Routes API tidak didedahkan — hanya status adanya.
export async function GET() {
  await connection(); // baca pemboleh ubah persekitaran semasa permintaan (Cloud Run), bukan semasa build
  return Response.json(
    {
      kunciPeta: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || null,
      mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID",
      laluan: Boolean(process.env.GOOGLE_ROUTES_KEY),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
