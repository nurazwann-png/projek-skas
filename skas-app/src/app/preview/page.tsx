"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Upload,
  CheckSquare,
  BarChart3,
  School,
  FileText,
  Bell,
  Star,
  Clock,
  CheckCircle,
  Sparkles,
  Loader2,
  XCircle,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type View = "ppd" | "school" | "teacher" | "upload" | "approvals";

const chartData = [
  { name: "Daerah", pencapaian: 48 },
  { name: "Negeri", pencapaian: 23 },
  { name: "Kebangsaan", pencapaian: 11 },
  { name: "Antarabangsa", pencapaian: 3 },
];

const mockAchievements = [
  {
    id: "1",
    programName: "Pertandingan Robotik Kebangsaan 2024",
    level: "national",
    levelLabel: "Kebangsaan",
    teacherRole: "Jurulatih",
    date: "15 Oktober 2024",
    status: "pending",
    statusLabel: "Menunggu",
    uploadedBy: "Cikgu Azman",
    aiDraft:
      "Guru telah berkhidmat sebagai Jurulatih dalam Pertandingan Robotik Kebangsaan 2024 di peringkat Kebangsaan, membuktikan komitmen beliau dalam memajukan kemahiran STEM pelajar ke tahap tertinggi dan menyumbang kepada kecemerlangan sekolah dalam bidang teknologi.",
    tags: ["#Kebangsaan", "#Standard3.2", "#STEM"],
  },
  {
    id: "2",
    programName: "Sukan MSSM Peringkat Negeri",
    level: "state",
    levelLabel: "Negeri",
    teacherRole: "Penganjur",
    date: "3 September 2024",
    status: "approved",
    statusLabel: "Diluluskan",
    uploadedBy: "Cikgu Siti",
    aiDraft: null,
    tags: ["#Negeri", "#Sukan"],
  },
  {
    id: "3",
    programName: "Pertandingan Debat Bahasa Melayu Daerah",
    level: "district",
    levelLabel: "Daerah",
    teacherRole: "Hakim",
    date: "20 Ogos 2024",
    status: "pending",
    statusLabel: "Menunggu",
    uploadedBy: "Cikgu Rahman",
    aiDraft:
      "Guru telah berperanan sebagai Hakim dalam Pertandingan Debat Bahasa Melayu peringkat Daerah, memperlihatkan kepakaran beliau dalam bidang bahasa dan komunikasi serta menyokong pembangunan kemahiran berfikir aras tinggi dalam kalangan pelajar.",
    tags: ["#Daerah", "#BahasaMelayu"],
  },
];

const statusStyle: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function PreviewPage() {
  const [view, setView] = useState<View>("ppd");
  const [role, setRole] = useState<"ppd_admin" | "school_admin" | "teacher">("ppd_admin");
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draft, setDraft] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [approved, setApproved] = useState<string[]>([]);

  function simulateExtract() {
    setExtracting(true);
    setTimeout(() => {
      setExtracted(true);
      setExtracting(false);
    }, 2000);
  }

  function simulateDraft() {
    setGeneratingDraft(true);
    setDraft("");
    const text =
      "Guru telah berperanan sebagai Jurulatih dalam Pertandingan Sains Kebangsaan 2024 di peringkat Kebangsaan, menunjukkan dedikasi beliau dalam memupuk minat saintifik pelajar ke peringkat tertinggi dan mengharumkan nama sekolah di peringkat nasional.";
    let i = 0;
    const interval = setInterval(() => {
      i += 3;
      setDraft(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setGeneratingDraft(false);
      }
    }, 30);
  }

  function simulateApprove(id: string) {
    setApproving(id);
    setTimeout(() => {
      setApproved((prev) => [...prev, id]);
      setApproving(null);
    }, 1200);
  }

  const navByRole = {
    ppd_admin: [
      { key: "ppd", label: "Papan Pemuka PPD", icon: <LayoutDashboard size={17} /> },
      { key: "ppd", label: "Senarai Sekolah", icon: <School size={17} /> },
      { key: "ppd", label: "Laporan", icon: <BarChart3 size={17} /> },
    ],
    school_admin: [
      { key: "school", label: "Papan Pemuka", icon: <LayoutDashboard size={17} /> },
      { key: "approvals", label: "Kelulusan Tertunda", icon: <CheckSquare size={17} /> },
      { key: "school", label: "Semua Pencapaian", icon: <FileText size={17} /> },
    ],
    teacher: [
      { key: "teacher", label: "Papan Pemuka", icon: <LayoutDashboard size={17} /> },
      { key: "upload", label: "Muat Naik Sijil", icon: <Upload size={17} /> },
      { key: "teacher", label: "Pencapaian Saya", icon: <FileText size={17} /> },
    ],
  };

  const roleLabel = {
    ppd_admin: "Admin PPD",
    school_admin: "Pentadbir Sekolah",
    teacher: "Guru",
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-60 bg-blue-950 text-white flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-blue-800">
          <span className="text-2xl font-black tracking-tight">SK@S</span>
          <p className="text-blue-300 text-xs mt-0.5">Sistem Kualiti Sekolah</p>
        </div>

        {/* Role switcher for demo */}
        <div className="px-3 pt-3">
          <p className="text-blue-400 text-xs px-2 mb-1">[ Demo — Tukar Peranan ]</p>
          <div className="space-y-0.5">
            {(["ppd_admin", "school_admin", "teacher"] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setView(r === "ppd_admin" ? "ppd" : r === "school_admin" ? "school" : "teacher");
                }}
                className={`w-full text-left text-xs px-2 py-1.5 rounded transition ${
                  role === r ? "bg-blue-600 text-white" : "text-blue-300 hover:bg-blue-800"
                }`}
              >
                {roleLabel[r]}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex-1 p-3 mt-3 space-y-0.5">
          {navByRole[role].map((item, i) => (
            <button
              key={i}
              onClick={() => setView(item.key as View)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                view === item.key && i === 0
                  ? "bg-blue-700 text-white"
                  : "text-blue-200 hover:bg-blue-800 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
              {role === "ppd_admin" ? "A" : role === "school_admin" ? "P" : "G"}
            </div>
            <div>
              <p className="text-white text-xs font-medium">
                {role === "ppd_admin" ? "Ahmad Farid" : role === "school_admin" ? "Pn. Rohani" : "Cikgu Azman"}
              </p>
              <p className="text-blue-400 text-xs">{roleLabel[role]}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs text-gray-400">Selamat datang,</p>
            <p className="text-sm font-semibold text-gray-800">
              {role === "ppd_admin" ? "Ahmad Farid" : role === "school_admin" ? "Pn. Rohani" : "Cikgu Azman"} —{" "}
              {roleLabel[role]}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* ── PPD Dashboard ── */}
          {view === "ppd" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Papan Pemuka PPD</h1>
                <p className="text-gray-500 text-sm mt-0.5">Gambaran keseluruhan pencapaian daerah</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: <School className="text-blue-600" size={22} />, label: "Jumlah Sekolah", value: 42, bg: "bg-blue-50" },
                  { icon: <CheckCircle className="text-green-600" size={22} />, label: "Jumlah Pencapaian", value: 385, bg: "bg-green-50" },
                  { icon: <Clock className="text-amber-600" size={22} />, label: "Menunggu Kelulusan", value: 17, bg: "bg-amber-50" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                    <div className={`${s.bg} p-3 rounded-lg`}>{s.icon}</div>
                    <div>
                      <p className="text-xs text-gray-500">{s.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-800 mb-4">Pencapaian Mengikut Peringkat</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="pencapaian" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-800 mb-3">Sekolah Memerlukan Perhatian</h2>
                <div className="space-y-2">
                  {["SK Taman Maju", "SK Bukit Indah", "SK Pandan Jaya"].map((s) => (
                    <div key={s} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-700">{s}</span>
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">0 rekod bulan ini</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── School Dashboard ── */}
          {view === "school" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Papan Pemuka Sekolah</h1>
                <p className="text-gray-500 text-sm">SK Wangsa Maju 1</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-amber-200 p-5 flex items-center gap-4">
                  <div className="bg-amber-50 p-3 rounded-lg"><Clock className="text-amber-600" size={22} /></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Menunggu Kelulusan</p>
                    <p className="text-3xl font-bold text-gray-900">3</p>
                  </div>
                  <button onClick={() => setView("approvals")} className="text-xs text-blue-600 hover:underline">Semak →</button>
                </div>
                <div className="bg-white rounded-xl border border-green-200 p-5 flex items-center gap-4">
                  <div className="bg-green-50 p-3 rounded-lg"><CheckSquare className="text-green-600" size={22} /></div>
                  <div>
                    <p className="text-xs text-gray-500">Telah Diluluskan</p>
                    <p className="text-3xl font-bold text-gray-900">24</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800 text-sm">Rekod Terkini</h2>
                </div>
                {mockAchievements.map((a) => (
                  <div key={a.id} className="p-4 flex items-center gap-3 border-b border-gray-50 last:border-0">
                    <Star size={14} className="text-gray-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{a.programName}</p>
                      <p className="text-xs text-gray-400">{a.levelLabel} · {a.date}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[a.status]}`}>{a.statusLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Teacher Dashboard ── */}
          {view === "teacher" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Papan Pemuka Guru</h1>
                  <p className="text-gray-500 text-sm">Urus rekod pencapaian anda</p>
                </div>
                <button
                  onClick={() => setView("upload")}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  <Upload size={15} />
                  Muat Naik Sijil
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-500">Menunggu Kelulusan</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">2</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-500">Diluluskan</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">8</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 border-b border-gray-100"><h2 className="font-semibold text-gray-800 text-sm">Rekod Saya</h2></div>
                {mockAchievements.map((a) => (
                  <div key={a.id} className="p-4 flex items-center gap-3 border-b border-gray-50 last:border-0">
                    <Star size={14} className="text-gray-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{a.programName}</p>
                      <p className="text-xs text-gray-400">{a.levelLabel} · {a.date}</p>
                      {a.tags && (
                        <div className="flex gap-1 mt-1">
                          {a.tags.map((t) => (
                            <span key={t} className="text-xs bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[a.status]}`}>{a.statusLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Upload Form ── */}
          {view === "upload" && (
            <div className="max-w-xl mx-auto space-y-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Muat Naik Sijil</h1>
                <p className="text-gray-500 text-sm">AI akan mengekstrak maklumat secara automatik</p>
              </div>

              {/* Upload zone */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-white hover:border-blue-400 hover:bg-blue-50/20 transition cursor-pointer">
                <Upload size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">Klik atau seret sijil di sini</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF (maks. 10MB)</p>
              </div>

              <button
                onClick={simulateExtract}
                disabled={extracting}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-70 transition"
              >
                {extracting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {extracting ? "Mengekstrak maklumat..." : "Ekstrak Maklumat dengan AI"}
              </button>

              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                  Butiran Pencapaian
                  {extracted && (
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-normal">✨ Auto-isi AI</span>
                  )}
                </h3>
                {[
                  { label: "Nama Program/Pertandingan", value: extracted ? "Pertandingan Sains Kebangsaan 2024" : "", placeholder: "Nama program..." },
                  { label: "Tarikh", value: extracted ? "2024-10-15" : "", type: "date" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-xs font-medium text-gray-700">{f.label}</label>
                    <input
                      type={f.type ?? "text"}
                      value={f.value}
                      readOnly
                      placeholder={f.placeholder}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Peringkat</label>
                    <select className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50">
                      <option>{extracted ? "Kebangsaan" : "Pilih..."}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Peranan Guru</label>
                    <select className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50">
                      <option>{extracted ? "Jurulatih" : "Pilih..."}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 text-sm">Justifikasi SK@S (AI Draft)</h3>
                  <button
                    onClick={simulateDraft}
                    disabled={generatingDraft}
                    className="text-xs flex items-center gap-1.5 text-purple-600 hover:text-purple-700 disabled:opacity-50"
                  >
                    {generatingDraft ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Jana Draf
                  </button>
                </div>
                <textarea
                  value={draft}
                  readOnly
                  rows={4}
                  placeholder="Klik 'Jana Draf' untuk AI hasilkan justifikasi..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none bg-gray-50"
                />
              </div>

              <button className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition">
                Hantar untuk Kelulusan
              </button>
            </div>
          )}

          {/* ── Approvals ── */}
          {view === "approvals" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Kelulusan Tertunda</h1>
                <p className="text-gray-500 text-sm">{mockAchievements.filter((a) => a.status === "pending" && !approved.includes(a.id)).length} rekod menunggu kelulusan</p>
              </div>
              {mockAchievements
                .filter((a) => a.status === "pending" && !approved.includes(a.id))
                .map((a) => (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{a.programName}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {[a.levelLabel, a.teacherRole, a.date].map((t) => (
                          <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">Dimuat naik oleh: {a.uploadedBy}</p>
                    </div>
                    {a.aiDraft && (
                      <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                        <p className="text-xs font-medium text-purple-600 mb-1 flex items-center gap-1">
                          <Sparkles size={11} /> Justifikasi AI Draft
                        </p>
                        <p className="text-xs text-gray-700">{a.aiDraft}</p>
                      </div>
                    )}
                    {a.tags && (
                      <div className="flex gap-1.5">
                        {a.tags.map((t) => (
                          <span key={t} className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => simulateApprove(a.id)}
                        disabled={approving === a.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition"
                      >
                        {approving === a.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Luluskan
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition">
                        <XCircle size={14} />
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
              {mockAchievements.filter((a) => a.status === "pending" && !approved.includes(a.id)).length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                  <CheckCircle size={48} className="mx-auto text-green-300 mb-3" />
                  <p className="text-gray-500">Semua rekod telah diproses!</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
