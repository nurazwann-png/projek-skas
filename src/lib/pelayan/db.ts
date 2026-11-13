// Sambungan PostgreSQL.
//  - Produksi (Cloud Run + Cloud SQL): DATABASE_URL=postgres://… → pemacu `pg`.
//  - Pembangunan tempatan tanpa pelayan Postgres: PGlite (Postgres terbenam, data dalam folder .data/pg).
// Kedua-duanya menerima SQL Postgres yang sama, jadi kod di atasnya tidak berbeza.
import type { Pool } from "pg";

export interface Pertanyaan {
  query<T = Record<string, unknown>>(teks: string, nilai?: unknown[]): Promise<{ rows: T[] }>;
}
export interface Pangkalan extends Pertanyaan {
  transaksi<T>(f: (q: Pertanyaan) => Promise<T>): Promise<T>;
  jenis: "pg" | "pglite";
}

const SKEMA = `
CREATE TABLE IF NOT EXISTS stor_item (
  koleksi text NOT NULL,
  id      text NOT NULL,
  nilai   jsonb NOT NULL,
  dikemas timestamptz NOT NULL DEFAULT now(),
  oleh    text,
  PRIMARY KEY (koleksi, id)
);
CREATE INDEX IF NOT EXISTS stor_item_dikemas ON stor_item (dikemas);
`;

const g = globalThis as unknown as { __ppdDb?: Promise<Pangkalan> };

async function buka(): Promise<Pangkalan> {
  const url = process.env.DATABASE_URL || "";
  if (/^postgres(ql)?:\/\//.test(url) && !url.includes("placeholder")) {
    const { Pool: PgPool } = await import("pg");
    // DATABASE_NAME (pilihan): guna pangkalan data lain pada pelayan yang sama, contohnya servis demo
    const nama = process.env.DATABASE_NAME;
    const sambung = nama ? Object.assign(new URL(url), { pathname: "/" + encodeURIComponent(nama) }).toString() : url;
    const pool: Pool = new PgPool({ connectionString: sambung, max: 5 });
    await pool.query(SKEMA);
    return {
      jenis: "pg",
      query: (t, n) => pool.query(t, n as unknown[]) as never,
      async transaksi(f) {
        const c = await pool.connect();
        try {
          await c.query("BEGIN");
          const h = await f({ query: (t, n) => c.query(t, n as unknown[]) as never });
          await c.query("COMMIT");
          return h;
        } catch (e) {
          await c.query("ROLLBACK").catch(() => {});
          throw e;
        } finally {
          c.release();
        }
      },
    };
  }
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL (PostgreSQL) belum ditetapkan.");
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  mkdirSync(".data", { recursive: true });
  const pg = new PGlite(".data/pg");
  await pg.exec(SKEMA);
  return {
    jenis: "pglite",
    query: (t, n) => pg.query(t, n as unknown[]) as never,
    transaksi: (f) => pg.transaction((tx) => f({ query: (t, n) => tx.query(t, n as unknown[]) as never })) as never,
  };
}

export function db(): Promise<Pangkalan> {
  if (!g.__ppdDb) g.__ppdDb = buka().catch((e) => { g.__ppdDb = undefined; throw e; });
  return g.__ppdDb;
}
