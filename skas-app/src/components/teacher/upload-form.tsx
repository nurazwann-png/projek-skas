"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Sparkles, CheckCircle } from "lucide-react";
import { getLevelLabel, getTeacherRoleLabel } from "@/lib/utils";

type ExtractedData = {
  programName?: string;
  achievementDate?: string;
  level?: string;
  teacherRole?: string;
  participantName?: string;
  position?: string;
  confidence?: number;
};

export function UploadForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [extracting, setExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData>({});
  const [draft, setDraft] = useState("");
  const [form, setForm] = useState({
    programName: "",
    achievementDate: "",
    level: "district",
    teacherRole: "peserta",
    participantName: "",
    position: "",
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = (ev.target?.result as string).split(",")[1];
      setImageBase64(b64);
    };
    reader.readAsDataURL(file);
  }

  async function handleExtract() {
    if (!imageBase64) return;
    setExtracting(true);
    try {
      const res = await fetch("/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType }),
      });
      const data = await res.json();
      setExtracted(data);
      setForm((f) => ({
        ...f,
        programName: data.programName ?? f.programName,
        achievementDate: data.achievementDate ?? f.achievementDate,
        level: data.level ?? f.level,
        teacherRole: data.teacherRole ?? f.teacherRole,
        participantName: data.participantName ?? f.participantName,
        position: data.position ?? f.position,
      }));
    } finally {
      setExtracting(false);
    }
  }

  async function handleGenerateDraft() {
    setGenerating(true);
    setDraft("");
    try {
      const res = await fetch("/api/ai/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              result += JSON.parse(line.slice(2));
            } catch {}
          }
        }
        setDraft(result);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, aiDraftDescription: draft }),
      });
      router.push("/dashboard/teacher");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Upload zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition group"
      >
        {imagePreview ? (
          <img src={imagePreview} alt="preview" className="max-h-64 mx-auto rounded-lg shadow" />
        ) : (
          <div className="space-y-2">
            <Upload size={40} className="mx-auto text-gray-300 group-hover:text-blue-400 transition" />
            <p className="text-gray-500">Klik atau seret sijil di sini</p>
            <p className="text-xs text-gray-400">JPG, PNG, PDF (maks. 10MB)</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {imageBase64 && (
        <button
          type="button"
          onClick={handleExtract}
          disabled={extracting}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-60 transition"
        >
          {extracting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {extracting ? "Mengekstrak..." : "Ekstrak Maklumat dengan AI"}
        </button>
      )}

      {/* Form fields */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          Butiran Pencapaian
          {Object.keys(extracted).length > 0 && (
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-normal">
              Auto-isi oleh AI
            </span>
          )}
        </h3>
        <div>
          <label className="text-sm font-medium text-gray-700">Nama Program/Pertandingan *</label>
          <input
            required
            value={form.programName}
            onChange={(e) => setForm({ ...form, programName: e.target.value })}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Tarikh *</label>
            <input
              type="date"
              required
              value={form.achievementDate}
              onChange={(e) => setForm({ ...form, achievementDate: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Peringkat *</label>
            <select
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {["district", "state", "national", "international"].map((l) => (
                <option key={l} value={l}>{getLevelLabel(l)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Peranan Guru *</label>
            <select
              value={form.teacherRole}
              onChange={(e) => setForm({ ...form, teacherRole: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {["peserta", "jurulatih", "penganjur", "fasilitator", "hakim"].map((r) => (
                <option key={r} value={r}>{getTeacherRoleLabel(r)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Kedudukan/Anugerah</label>
            <input
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="cth. Johan, Tempat Kedua"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Nama Peserta</label>
          <input
            value={form.participantName}
            onChange={(e) => setForm({ ...form, participantName: e.target.value })}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nama pelajar (jika ada)"
          />
        </div>
      </div>

      {/* AI Draft */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Justifikasi SK@S (AI Draft)</h3>
          <button
            type="button"
            onClick={handleGenerateDraft}
            disabled={generating || !form.programName}
            className="text-sm flex items-center gap-1.5 text-purple-600 hover:text-purple-700 disabled:opacity-50"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Jana Draf
          </button>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          placeholder="Klik 'Jana Draf' untuk AI hasilkan justifikasi, atau taip secara manual..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !form.programName}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
        {submitting ? "Menghantar..." : "Hantar untuk Kelulusan"}
      </button>
    </form>
  );
}
