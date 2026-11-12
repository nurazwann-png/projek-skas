"use client";

// Carta gaya Tremor atas Recharts 3: grid mendatar halus, paksi tanpa garis, tooltip & legenda ringkas.
import { Maximize2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart as RLineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RRadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { Card, Modal, WARNA, type Warna } from "./ui";

type Baris = Record<string, string | number | null | undefined>;
type Fmt = (v: number) => string;
const PALET: Warna[] = ["blue", "emerald", "violet", "amber", "cyan", "pink", "gray"];
const TIK = { fill: "#6b7280", fontSize: 12 };
const GRID = "#e5e7eb";

/* ── Legenda ── */
export function Legenda({ item, className }: { item: { nama: string; warna: Warna; putus?: boolean }[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600", className)}>
      {item.map((i) => (
        <li key={i.nama} className="flex items-center gap-1.5">
          <span className={cn("h-0.5 w-3.5 shrink-0 rounded-full", i.putus && "opacity-60")} style={{ background: WARNA[i.warna], height: i.putus ? 2 : 3 }} aria-hidden />
          {i.nama}
        </li>
      ))}
    </ul>
  );
}

/* ── Tooltip ── */
interface TipItem {
  name?: string | number;
  value?: number | string | null;
  color?: string;
  dataKey?: string | number;
  payload?: Baris;
}
function Tip({ active, payload, label, fmt, nota }: { active?: boolean; payload?: readonly TipItem[]; label?: string | number; fmt: Fmt; nota?: (baris: Baris) => string | null }) {
  if (!active || !payload?.length) return null;
  const tambahan = nota && payload[0].payload ? nota(payload[0].payload) : null;
  return (
    <div className="min-w-36 rounded-md border border-gray-200 bg-white text-sm shadow-md">
      {label != null && label !== "" && <div className="border-b border-gray-200 px-3 py-2 font-medium text-gray-900">{label}</div>}
      <div className="space-y-1 px-3 py-2">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-gray-600">
              <span className="size-2 shrink-0 rounded-xs" style={{ background: p.color }} aria-hidden />
              {p.name}
            </span>
            <span className="font-medium text-gray-900 tabular-nums">{typeof p.value === "number" ? fmt(p.value) : "—"}</span>
          </div>
        ))}
        {tambahan && <div className="pt-1 text-xs text-gray-500">{tambahan}</div>}
      </div>
    </div>
  );
}
const tip = (fmt: Fmt, nota?: (b: Baris) => string | null) => (p: unknown) => <Tip {...(p as object)} fmt={fmt} nota={nota} />;

/* ── Carta garis ── */
export function LineChart({
  data,
  index,
  categories,
  colors = PALET,
  putus = [],
  fmt = String,
  domain,
  className,
}: {
  data: Baris[];
  index: string;
  categories: string[];
  colors?: Warna[];
  putus?: string[]; // siri rujukan bergaris putus-putus
  fmt?: Fmt;
  domain?: [number | "auto", number | "auto"];
  className?: string;
}) {
  return (
    <div className={cn("h-72 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RLineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey={index} tick={TIK} axisLine={false} tickLine={false} padding={{ left: 24, right: 24 }} />
          <YAxis tick={TIK} axisLine={false} tickLine={false} width={44} domain={domain ?? ["auto", "auto"]} tickFormatter={fmt} />
          <Tooltip content={tip(fmt)} cursor={{ stroke: "#d1d5db" }} isAnimationActive={false} />
          {categories.map((c, i) => {
            const w = WARNA[colors[i % colors.length]];
            const rujukan = putus.includes(c);
            return (
              <Line
                key={c}
                type="monotone"
                dataKey={c}
                name={c}
                stroke={w}
                strokeWidth={rujukan ? 2 : 2.5}
                strokeDasharray={rujukan ? "5 4" : undefined}
                dot={{ r: 3, fill: w, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                connectNulls
                animationDuration={600}
              />
            );
          })}
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Carta bar ── */
export function BarChart({
  data,
  index,
  categories,
  colors = PALET,
  layout = "vertical",
  stacked = false,
  fmt = String,
  domain,
  warnaBaris,
  rujukan,
  labelNilai = false,
  lebarLabel = 110,
  nota,
  className,
}: {
  data: Baris[];
  index: string;
  categories: string[];
  colors?: Warna[];
  layout?: "vertical" | "horizontal"; // vertical = bar menegak (lalai)
  stacked?: boolean;
  fmt?: Fmt;
  domain?: [number | "auto", number | "auto"];
  warnaBaris?: (baris: Baris) => Warna; // warna setiap bar (satu kategori)
  rujukan?: { nilai: number; label: string };
  labelNilai?: boolean;
  lebarLabel?: number;
  nota?: (baris: Baris) => string | null;
  className?: string;
}) {
  const mendatar = layout === "horizontal";
  const paksiNilai = { type: "number" as const, tick: TIK, axisLine: false, tickLine: false, domain: domain ?? [0, "auto"], tickFormatter: fmt };
  const paksiKategori = { type: "category" as const, dataKey: index, tick: TIK, axisLine: false, tickLine: false };
  return (
    <div className={cn("h-72 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RBarChart data={data} layout={mendatar ? "vertical" : "horizontal"} margin={{ top: labelNilai ? 20 : 8, right: mendatar ? 40 : 8, bottom: 0, left: 0 }} barCategoryGap={mendatar ? "22%" : "28%"}>
          <CartesianGrid stroke={GRID} vertical={mendatar} horizontal={!mendatar} />
          {mendatar ? <XAxis {...paksiNilai} /> : <XAxis {...paksiKategori} interval={0} />}
          {mendatar ? <YAxis {...paksiKategori} width={lebarLabel} /> : <YAxis {...paksiNilai} width={44} />}
          <Tooltip content={tip(fmt, nota)} cursor={{ fill: "#f3f4f6" }} isAnimationActive={false} />
          {rujukan &&
            (mendatar ? (
              <ReferenceLine x={rujukan.nilai} stroke="#6b7280" strokeDasharray="4 4" label={{ value: rujukan.label, position: "top", fill: "#6b7280", fontSize: 11 }} />
            ) : (
              <ReferenceLine y={rujukan.nilai} stroke="#6b7280" strokeDasharray="4 4" label={{ value: rujukan.label, position: "insideTopRight", fill: "#6b7280", fontSize: 11 }} />
            ))}
          {categories.map((c, i) => (
            <Bar key={c} dataKey={c} name={c} fill={WARNA[colors[i % colors.length]]} stackId={stacked ? "a" : undefined} radius={stacked ? 0 : mendatar ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={56} animationDuration={600}>
              {warnaBaris && data.map((d, j) => <Cell key={j} fill={WARNA[warnaBaris(d)]} />)}
              {labelNilai && !stacked && <LabelList dataKey={c} position={mendatar ? "right" : "top"} formatter={(v: unknown) => (typeof v === "number" ? fmt(v) : "")} style={{ fill: "#374151", fontSize: 12, fontWeight: 600 }} />}
            </Bar>
          ))}
        </RBarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Carta radar ── */
export function RadarChart({ data, index, categories, colors = PALET, putus = [], fmt = String, domain, className }: { data: Baris[]; index: string; categories: string[]; colors?: Warna[]; putus?: string[]; fmt?: Fmt; domain?: [number, number]; className?: string }) {
  return (
    <div className={cn("h-80 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RRadarChart data={data} outerRadius="72%">
          <PolarGrid stroke={GRID} />
          <PolarAngleAxis dataKey={index} tick={{ fill: "#374151", fontSize: 12 }} />
          <PolarRadiusAxis domain={domain} tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickCount={5} />
          <Tooltip content={tip(fmt)} isAnimationActive={false} />
          {categories.map((c, i) => {
            const w = WARNA[colors[i % colors.length]];
            const rujukan = putus.includes(c);
            return <Radar key={c} dataKey={c} name={c} stroke={w} strokeWidth={2} strokeDasharray={rujukan ? "5 4" : undefined} fill={w} fillOpacity={rujukan ? 0 : 0.1} dot={{ r: 2.5, fill: w, strokeWidth: 0 }} animationDuration={600} />;
          })}
        </RRadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Spark (garis mini dalam jadual) ── */
export function Spark({ nilai, warna = "blue", label }: { nilai: (number | null)[]; warna?: Warna; label: string }) {
  const v = nilai.filter((x): x is number => x != null);
  if (v.length < 2) return <span className="text-xs text-gray-400">—</span>;
  const L = 72, T = 24, min = Math.min(...v), max = Math.max(...v), julat = max - min || 1;
  const titik = v.map((y, i) => [4 + (i * (L - 8)) / (v.length - 1), 4 + ((y - min) / julat) * (T - 8)] as const); // GPS rendah (baik) di atas
  const [ax, ay] = titik[titik.length - 1];
  return (
    <svg width={L} height={T} viewBox={`0 0 ${L} ${T}`} role="img" aria-label={label} className="overflow-visible">
      <polyline points={titik.map((p) => p.join(",")).join(" ")} fill="none" stroke={WARNA[warna]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={ax} cy={ay} r="3" fill={WARNA[warna]} />
    </svg>
  );
}

/* ── Kad carta: tajuk, legenda, butang besarkan + penerangan cara membaca ── */
export function KadCarta({
  tajuk,
  sub,
  apa,
  baca,
  legenda,
  carta,
  kaki,
  className,
}: {
  tajuk: string;
  sub?: ReactNode;
  apa: string; // apa yang ditunjukkan
  baca: string; // cara membaca
  legenda?: { nama: string; warna: Warna; putus?: boolean }[];
  carta: (kelasTinggi: string) => ReactNode;
  kaki?: ReactNode;
  className?: string;
}) {
  const [besar, setBesar] = useState(false);
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{tajuk}</h3>
          {sub && <p className="mt-0.5 text-sm text-gray-500">{sub}</p>}
        </div>
        <button type="button" onClick={() => setBesar(true)} className="-mt-1 -mr-1 shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-[#c8962a]" aria-label={`Besarkan carta: ${tajuk}`} title="Besarkan & lihat penerangan">
          <Maximize2 className="size-4" aria-hidden />
        </button>
      </div>
      {legenda && <Legenda item={legenda} className="mt-3" />}
      <div className="mt-4">{carta("h-64")}</div>
      {kaki && <div className="mt-3 text-xs text-gray-500">{kaki}</div>}
      <Modal buka={besar} tutup={() => setBesar(false)} tajuk={tajuk} sub={sub} lebar="max-w-5xl">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(240px,1fr)]">
          <div className="min-w-0">
            {legenda && <Legenda item={legenda} className="mb-3" />}
            {besar && carta("h-[min(56vh,480px)]")}
          </div>
          <div className="space-y-4 text-sm leading-relaxed">
            <div>
              <div className="text-xs font-semibold tracking-wide text-[#b7791f] uppercase">Apa yang ditunjukkan</div>
              <p className="mt-1 text-gray-700">{apa}</p>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide text-[#b7791f] uppercase">Cara membaca</div>
              <p className="mt-1 text-gray-700">{baca}</p>
            </div>
            {kaki && <p className="border-t border-gray-200 pt-3 text-xs text-gray-500">{kaki}</p>}
          </div>
        </div>
      </Modal>
    </Card>
  );
}
