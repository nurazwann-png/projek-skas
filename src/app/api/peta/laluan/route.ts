import type { NextRequest } from "next/server";
import { penggunaSemasa } from "@/lib/pelayan/sesi";

// Arah memandu melalui Google Routes API (computeRoutes) untuk peta Lokasi Sekolah.
// Kunci pelayan (GOOGLE_ROUTES_KEY) kekal di pelayan; pelayar hanya menerima laluan yang sudah diringkaskan.

type Titik = { lat: number; lng: number };
type Hasil = Record<string, unknown>;

// Hadkan kepada kawasan Sarawak supaya laluan ini tidak boleh disalah guna sebagai proksi Routes API umum
const dalamKawasan = (t: unknown): t is Titik => {
  const p = t as Titik;
  return typeof p?.lat === "number" && typeof p?.lng === "number" && p.lat > 0.8 && p.lat < 5.2 && p.lng > 109.5 && p.lng < 115.7;
};

function jarakM(a: Titik, b: Titik) {
  const R = 6371000, r = (d: number) => (d * Math.PI) / 180;
  const x = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Nyahkod "encoded polyline" Google kepada [lat, lng]
function nyahkod(s: string): [number, number][] {
  const out: [number, number][] = [];
  let i = 0, lat = 0, lng = 0;
  while (i < s.length) {
    for (const k of [0, 1]) {
      let b, shift = 0, v = 0;
      do { b = s.charCodeAt(i++) - 63; v |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const d = v & 1 ? ~(v >> 1) : v >> 1;
      if (k === 0) lat += d; else lng += d;
    }
    out.push([lat / 1e5, lng / 1e5]);
  }
  return out;
}

// Cache ringkas dalam memori: laluan antara dua tempat yang sama jarang berubah dalam 10 minit
const CACHE_MS = 10 * 60 * 1000;
const cache = new Map<string, { t: number; hasil: Hasil }>();

export async function POST(req: NextRequest) {
  // Hanya pengguna yang log masuk (perkhidmatan ini berbayar mengikut penggunaan)
  if (!(await penggunaSemasa(req))) return Response.json({ ralat: "Sila log masuk." }, { status: 401 });
  const asal = req.headers.get("origin");
  if (asal && new URL(asal).host !== req.headers.get("host")) {
    return Response.json({ ralat: "Permintaan tidak dibenarkan." }, { status: 403 });
  }
  const kunci = process.env.GOOGLE_ROUTES_KEY;
  if (!kunci) return Response.json({ ralat: "Arah Google belum dikonfigurasi di pelayan (GOOGLE_ROUTES_KEY)." }, { status: 503 });

  let badan: { asal?: unknown; tuju?: unknown };
  try { badan = await req.json(); } catch { return Response.json({ ralat: "Data permintaan tidak sah." }, { status: 400 }); }
  const { asal: A, tuju: B } = badan;
  if (!dalamKawasan(A) || !dalamKawasan(B)) return Response.json({ ralat: "Koordinat di luar kawasan yang dibenarkan." }, { status: 400 });

  const k = [A.lat, A.lng, B.lat, B.lng].map((n) => n.toFixed(5)).join(",");
  const ada = cache.get(k);
  if (ada && Date.now() - ada.t < CACHE_MS) return Response.json(ada.hasil);

  let res: Response;
  try {
    res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": kunci,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.staticDuration,routes.polyline.encodedPolyline,routes.legs.steps.distanceMeters,routes.legs.steps.navigationInstruction",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: A.lat, longitude: A.lng } } },
        destination: { location: { latLng: { latitude: B.lat, longitude: B.lng } } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        languageCode: "ms",
        regionCode: "MY",
        units: "METRIC",
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return Response.json({ ralat: "Perkhidmatan laluan Google tidak dapat dihubungi." }, { status: 502 });
  }
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Routes API:", res.status, j?.error?.message);
    return Response.json({ ralat: "Perkhidmatan laluan Google menolak permintaan." }, { status: 502 });
  }

  const r = j.routes?.[0];
  let hasil: Hasil;
  if (!r?.polyline?.encodedPolyline) {
    hasil = { tiada: true }; // Google tidak menemui laluan memandu
  } else {
    const titik = nyahkod(r.polyline.encodedPolyline);
    const saat = (d?: string) => (d ? parseInt(d, 10) : null);
    type Langkah = { distanceMeters?: number; navigationInstruction?: { maneuver?: string; instructions?: string } };
    hasil = {
      km: (r.distanceMeters ?? 0) / 1000,
      saat: saat(r.duration),
      saatTanpaTrafik: saat(r.staticDuration),
      titik,
      langkah: ((r.legs?.[0]?.steps ?? []) as Langkah[])
        .filter((s) => (s.distanceMeters ?? 0) > 0)
        .map((s) => ({ teks: s.navigationInstruction?.instructions ?? "", manuver: s.navigationInstruction?.maneuver ?? "", m: s.distanceMeters })),
      snapA: Math.round(jarakM(A, { lat: titik[0][0], lng: titik[0][1] })),
      snapB: Math.round(jarakM(B, { lat: titik[titik.length - 1][0], lng: titik[titik.length - 1][1] })),
    };
  }
  cache.set(k, { t: Date.now(), hasil });
  if (cache.size > 2000) cache.delete(cache.keys().next().value!);
  return Response.json(hasil);
}
