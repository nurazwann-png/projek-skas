"use client";

import { Achievement } from "@/db/schema";
import { formatDate, getLevelLabel, getTeacherRoleLabel } from "@/lib/utils";
import { CheckCircle, XCircle, Loader2, FileText } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AchievementWithUser extends Achievement {
  uploadedBy: { name: string | null; email: string } | null;
}

export function ApprovalsPanel({ achievements }: { achievements: AchievementWithUser[] }) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleAction(id: string, action: "approved" | "rejected") {
    setProcessing(id);
    try {
      await fetch(`/api/achievements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      router.refresh();
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kelulusan Tertunda</h1>
        <p className="text-gray-500 text-sm mt-1">{achievements.length} rekod menunggu kelulusan</p>
      </div>

      {achievements.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <CheckCircle size={48} className="mx-auto text-green-300 mb-3" />
          <p className="text-gray-500">Semua rekod telah diproses</p>
        </div>
      ) : (
        <div className="space-y-4">
          {achievements.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{a.programName}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Tag>{getLevelLabel(a.level)}</Tag>
                    <Tag>{getTeacherRoleLabel(a.teacherRole)}</Tag>
                    <Tag>{formatDate(a.achievementDate)}</Tag>
                    {a.position && <Tag>{a.position}</Tag>}
                  </div>
                  {a.uploadedBy && (
                    <p className="text-xs text-gray-400 mt-2">
                      Dimuat naik oleh: {a.uploadedBy.name ?? a.uploadedBy.email}
                    </p>
                  )}
                </div>
                {a.certificateImageUrl && (
                  <img
                    src={a.certificateImageUrl}
                    alt="sijil"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                  />
                )}
              </div>

              {a.aiDraftDescription && (
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                  <p className="text-xs font-medium text-purple-600 mb-1 flex items-center gap-1">
                    <FileText size={12} /> Justifikasi AI Draft
                  </p>
                  <p className="text-sm text-gray-700">{a.aiDraftDescription}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleAction(a.id, "approved")}
                  disabled={processing === a.id}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition"
                >
                  {processing === a.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Luluskan
                </button>
                <button
                  onClick={() => handleAction(a.id, "rejected")}
                  disabled={processing === a.id}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-60 transition"
                >
                  <XCircle size={16} />
                  Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{children}</span>
  );
}
