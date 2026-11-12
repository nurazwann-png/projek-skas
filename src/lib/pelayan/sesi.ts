// Sesi log masuk: kuki HttpOnly bertandatangan (JWT HS256). Identiti datang daripada Google (ID token),
// atau daripada akaun demo apabila MOD_DEMO=1 (pembangunan sahaja).
import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cariPengguna, DOMAIN_RASMI, domain, type PenggunaStor } from "./stor";

export const KUKI_SESI = "ppd_s";
export const KUKI_PRA = "ppd_pra"; // identiti Google yang disahkan tetapi belum berdaftar
const TEMPOH_SESI = 60 * 60 * 12; // 12 jam
const TEMPOH_PRA = 60 * 15;

const g = globalThis as unknown as { __ppdRahsia?: Uint8Array };
function rahsia(): Uint8Array {
  const r = process.env.SESSION_SECRET;
  if (r && r.length >= 32) return new TextEncoder().encode(r);
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET (sekurang-kurangnya 32 aksara) belum ditetapkan.");
  if (!g.__ppdRahsia) g.__ppdRahsia = crypto.getRandomValues(new Uint8Array(48));
  return g.__ppdRahsia;
}

async function tandatangan(muatan: Record<string, unknown>, saat: number) {
  return new SignJWT(muatan).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${saat}s`).sign(rahsia());
}
async function sahkan<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    return (await jwtVerify(token, rahsia(), { algorithms: ["HS256"] })).payload as T;
  } catch {
    return null;
  }
}

const pilihanKuki = (saat: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: saat,
});

export async function tetapSesi(res: NextResponse, uid: string) {
  res.cookies.set(KUKI_SESI, await tandatangan({ uid }, TEMPOH_SESI), pilihanKuki(TEMPOH_SESI));
  res.cookies.delete(KUKI_PRA);
  return res;
}
export async function tetapPra(res: NextResponse, emel: string, nama: string) {
  res.cookies.set(KUKI_PRA, await tandatangan({ emel, nama }, TEMPOH_PRA), pilihanKuki(TEMPOH_PRA));
  return res;
}
export function buangSesi(res: NextResponse) {
  res.cookies.delete(KUKI_SESI);
  res.cookies.delete(KUKI_PRA);
  return res;
}
export async function bacaPra(req: NextRequest) {
  return sahkan<{ emel: string; nama: string }>(req.cookies.get(KUKI_PRA)?.value);
}

// Pengguna semasa (disemak dengan pangkalan data pada setiap permintaan, supaya akaun yang dipadam terus hilang akses)
export async function penggunaSemasa(req: NextRequest): Promise<PenggunaStor | null> {
  const s = await sahkan<{ uid: string }>(req.cookies.get(KUKI_SESI)?.value);
  if (!s?.uid) return null;
  return cariPengguna(s.uid);
}

export const tidakSah = (mesej = "Sila log masuk.") => NextResponse.json({ ralat: mesej }, { status: 401, headers: { "Cache-Control": "no-store" } });

/* ── Google ─────────────────────────────────────────────────────────────── */
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function sahkanGoogle(kredensial: string): Promise<{ ok: true; emel: string; nama: string } | { ok: false; mesej: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return { ok: false, mesej: "Log masuk Google belum dikonfigurasi (GOOGLE_CLIENT_ID)." };
  try {
    const { payload } = await jwtVerify(kredensial, JWKS, { issuer: ["https://accounts.google.com", "accounts.google.com"], audience: clientId });
    const emel = String(payload.email || "").toLowerCase();
    if (!emel || payload.email_verified !== true) return { ok: false, mesej: "Emel Google ini belum disahkan." };
    if (!DOMAIN_RASMI.includes(domain(emel))) {
      return { ok: false, mesej: `Hanya emel rasmi KPM (${DOMAIN_RASMI.map((d) => "@" + d).join(" atau ")}) dibenarkan.` };
    }
    return { ok: true, emel, nama: String(payload.name || "") };
  } catch {
    return { ok: false, mesej: "Token Google tidak sah atau telah tamat. Cuba log masuk semula." };
  }
}

export const emelSuperadmin = () =>
  (process.env.SUPERADMIN_EMEL || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
