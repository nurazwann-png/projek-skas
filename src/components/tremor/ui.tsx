"use client";

// Komponen UI gaya Tremor (tremor.so — komponen "salin ke projek", Tailwind v4 + Radix).
// Pakej @tremor/react tidak digunakan kerana ia memerlukan React 18 dan Tailwind v3.
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowDownRight, ArrowUpRight, Minus, X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ── Warna ── */
export const WARNA = {
  blue: "#3b82f6",
  emerald: "#10b981",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  gray: "#6b7280",
  cyan: "#06b6d4",
  pink: "#ec4899",
  rose: "#f43f5e",
  navy: "#13406e",
  teal: "#0e7490",
  slate: "#94a3b8",
} as const;
export type Warna = keyof typeof WARNA;

/* ── Kad ── */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("relative w-full rounded-lg border border-gray-200 bg-white p-5 text-left shadow-xs sm:p-6", className)} {...props} />;
}

/* ── Lencana ── */
type VarianLencana = "default" | "neutral" | "success" | "error" | "warning";
const LENCANA: Record<VarianLencana, string> = {
  default: "bg-blue-50 text-blue-900 ring-blue-500/30",
  neutral: "bg-gray-50 text-gray-700 ring-gray-500/30",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-600/30",
  error: "bg-red-50 text-red-800 ring-red-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/30",
};
export function Badge({ variant = "default", className, ...props }: ComponentProps<"span"> & { variant?: VarianLencana }) {
  return <span className={cn("inline-flex items-center gap-x-1 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset", LENCANA[variant], className)} {...props} />;
}

// Perubahan GPS: nilai negatif = GPS turun = prestasi MENINGKAT (hijau)
export function BadgeDeltaGps({ delta, akhiran = "" }: { delta: number | null; akhiran?: string }) {
  if (delta == null) return <Badge variant="neutral">—</Badge>;
  const sama = Math.abs(delta) < 0.005;
  const baik = delta < 0;
  const Ikon = sama ? Minus : baik ? ArrowDownRight : ArrowUpRight;
  return (
    <Badge variant={sama ? "neutral" : baik ? "success" : "error"}>
      <Ikon className="-ml-0.5 size-3.5" aria-hidden />
      {sama ? "Tiada perubahan" : `${Math.abs(delta).toFixed(2)} ${baik ? "lebih baik" : "merosot"}`}
      {akhiran}
    </Badge>
  );
}

/* ── Kad metrik (KPI) ── */
export function Metrik({ label, nilai, nota, lencana, tona }: { label: string; nilai: ReactNode; nota?: ReactNode; lencana?: ReactNode; tona?: "baik" | "sederhana" | "lemah" | null }) {
  const warna = tona === "baik" ? "text-emerald-700" : tona === "lemah" ? "text-red-700" : tona === "sederhana" ? "text-amber-700" : "text-gray-900";
  return (
    <Card className="p-4 sm:p-5">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className={cn("text-3xl font-semibold tabular-nums", warna)}>{nilai}</span>
        {lencana}
      </dd>
      {nota && <p className="mt-1.5 text-xs text-gray-500">{nota}</p>}
    </Card>
  );
}

/* ── Navigasi tab (garis bawah) ── */
export function TabNavigation<T extends string>({ tab, aktif, pilih, label }: { tab: { id: T; label: string }[]; aktif: T; pilih: (id: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-x-1 overflow-x-auto [scrollbar-width:none]">
      {tab.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          data-tab={t.id}
          aria-selected={aktif === t.id}
          onClick={() => pilih(t.id)}
          className={cn(
            "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#c8962a]",
            aktif === t.id ? "border-[#c8962a] text-[#13406e]" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── Tab pil (pilihan dalam bahagian) ── */
export function TabPil<T extends string>({ tab, aktif, pilih, label }: { tab: { id: T; label: string }[]; aktif: T; pilih: (id: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
      {tab.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={aktif === t.id}
          onClick={() => pilih(t.id)}
          className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition", aktif === t.id ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900")}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── Jadual ── */
export function TableRoot({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("w-full overflow-x-auto", className)} {...props} />;
}
export function Table({ className, ...props }: ComponentProps<"table">) {
  return <table className={cn("w-full caption-bottom border-b border-gray-200 text-sm", className)} {...props} />;
}
export function Th({ className, ...props }: ComponentProps<"th">) {
  return <th className={cn("border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase whitespace-nowrap", className)} {...props} />;
}
export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("border-b border-gray-100 px-4 py-3 text-gray-600", className)} {...props} />;
}

/* ── Bar kemajuan ── */
const TONA_BAR = { blue: ["bg-blue-100", "bg-blue-500"], emerald: ["bg-emerald-100", "bg-emerald-500"], amber: ["bg-amber-100", "bg-amber-500"], red: ["bg-red-100", "bg-red-500"] } as const;
export function ProgressBar({ nilai, tona = "blue", label, className }: { nilai: number; tona?: keyof typeof TONA_BAR; label?: string; className?: string }) {
  const v = Math.min(100, Math.max(0, nilai));
  return (
    <div className={cn("flex w-full items-center gap-2", className)}>
      <div className={cn("h-2 w-full overflow-hidden rounded-full", TONA_BAR[tona][0])} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={cn("h-full rounded-full transition-[width] duration-500", TONA_BAR[tona][1])} style={{ width: `${v}%` }} />
      </div>
      {label && <span className="w-10 shrink-0 text-right text-sm font-medium text-gray-900 tabular-nums">{label}</span>}
    </div>
  );
}

/* ── Bar kategori (komposisi 100%) ── */
export function CategoryBar({ data, className }: { data: { label: string; nilai: number; warna: Warna }[]; className?: string }) {
  const jumlah = data.reduce((a, d) => a + d.nilai, 0) || 1;
  return (
    <div className={className}>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={data.map((d) => `${d.label} ${Math.round((d.nilai / jumlah) * 100)}%`).join(", ")}>
        {data.filter((d) => d.nilai > 0).map((d) => (
          <div key={d.label} style={{ width: `${(d.nilai / jumlah) * 100}%`, background: WARNA[d.warna] }} title={`${d.label}: ${d.nilai}`} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-xs" style={{ background: WARNA[d.warna] }} aria-hidden />
            {d.label}
            <span className="font-medium text-gray-900 tabular-nums">{Math.round((d.nilai / jumlah) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Senarai bar ── */
export function BarList({ data, fmt = (v) => String(v), warna = "blue" }: { data: { nama: string; nilai: number; nota?: string; warna?: Warna }[]; fmt?: (v: number) => string; warna?: Warna }) {
  const maks = Math.max(...data.map((d) => d.nilai), 0) || 1;
  return (
    <ul className="space-y-1.5">
      {data.map((d) => (
        <li key={d.nama} className="flex items-center gap-3">
          <div className="relative flex h-8 min-w-0 flex-1 items-center">
            <div className="absolute inset-y-0 left-0 rounded-sm opacity-20" style={{ width: `${Math.max(2, (d.nilai / maks) * 100)}%`, background: WARNA[d.warna ?? warna] }} />
            <span className="relative truncate px-2 text-sm text-gray-900">
              {d.nama}
              {d.nota && <span className="ml-1.5 text-xs text-gray-500">{d.nota}</span>}
            </span>
          </div>
          <span className="shrink-0 text-sm font-medium text-gray-900 tabular-nums">{fmt(d.nilai)}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Callout ── */
const CALLOUT = {
  default: "bg-blue-50 text-blue-900 ring-blue-500/20",
  success: "bg-emerald-50 text-emerald-900 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-900 ring-amber-600/25",
  error: "bg-red-50 text-red-900 ring-red-600/20",
  neutral: "bg-gray-50 text-gray-800 ring-gray-500/20",
} as const;
export function Callout({ tajuk, variant = "default", ikon, children, className }: { tajuk?: ReactNode; variant?: keyof typeof CALLOUT; ikon?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-md p-4 text-sm ring-1 ring-inset", CALLOUT[variant], className)}>
      {tajuk && (
        <div className="flex items-start gap-2 font-semibold">
          {ikon && <span className="mt-0.5 shrink-0">{ikon}</span>}
          <span>{tajuk}</span>
        </div>
      )}
      {children && <div className={cn("leading-relaxed", tajuk && "mt-1", tajuk && ikon ? "pl-6" : "")}>{children}</div>}
    </div>
  );
}

/* ── Butang & medan ── */
export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const v = {
    primary: "border-transparent bg-[#13406e] text-white hover:bg-[#0b2a4a]",
    secondary: "border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
    ghost: "border-transparent text-gray-700 hover:bg-gray-100",
    danger: "border-red-200 bg-white text-red-700 hover:bg-red-50",
  }[variant];
  return (
    <button
      type="button"
      className={cn("inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium whitespace-nowrap shadow-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8962a] disabled:pointer-events-none disabled:opacity-50", v, className)}
      {...props}
    />
  );
}
const MEDAN = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs outline-none placeholder:text-gray-400 focus:border-[#13406e] focus:ring-2 focus:ring-[#13406e]/20";
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(MEDAN, className)} {...props} />;
}
export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(MEDAN, "pr-8", className)} {...props} />;
}
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(MEDAN, className)} {...props} />;
}
export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1 block text-sm font-medium text-gray-900", className)} {...props} />;
}

/* ── Dialog ── */
export function Modal({ buka, tutup, tajuk, sub, children, lebar = "max-w-3xl" }: { buka: boolean; tutup: () => void; tajuk: ReactNode; sub?: ReactNode; children: ReactNode; lebar?: string }) {
  return (
    <Dialog.Root open={buka} onOpenChange={(o) => !o && tutup()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-gray-900/50" />
        <Dialog.Content
          className={cn("fixed top-1/2 left-1/2 z-[71] flex max-h-[92vh] w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-gray-200 bg-white shadow-xl outline-none", lebar)}
          style={{ fontFamily: "var(--ppd-font, inherit)" }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold text-gray-900">{tajuk}</Dialog.Title>
              <Dialog.Description className={cn("mt-0.5 text-sm text-gray-500", !sub && "sr-only")}>{sub || "Butiran"}</Dialog.Description>
            </div>
            <Dialog.Close className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-[#c8962a]" aria-label="Tutup">
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Tajuk bahagian ── */
export function TajukBahagian({ tajuk, sub, kanan }: { tajuk: string; sub?: ReactNode; kanan?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{tajuk}</h2>
        {sub && <p className="mt-0.5 text-sm text-gray-500">{sub}</p>}
      </div>
      {kanan}
    </div>
  );
}
