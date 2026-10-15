"use client";

import { Achievement } from "@/db/schema";
import { formatDate, getLevelLabel } from "@/lib/utils";
import { Upload, Star } from "lucide-react";
import Link from "next/link";

const statusBadge: Record<string, { label: string; class: string }> = {
  pending: { label: "Menunggu", class: "bg-amber-100 text-amber-700" },
  approved: { label: "Diluluskan", class: "bg-green-100 text-green-700" },
  rejected: { label: "Ditolak", class: "bg-red-100 text-red-700" },
};

export function TeacherDashboard({ achievements }: { achievements: Achievement[] }) {
  const pending = achievements.filter((a) => a.status === "pending").length;
  const approved = achievements.filter((a) => a.status === "approved").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Papan Pemuka Guru</h1>
          <p className="text-gray-500 text-sm mt-1">Urus dan pantau rekod pencapaian anda</p>
        </div>
        <Link
          href="/dashboard/teacher/upload"
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition"
        >
          <Upload size={16} />
          Muat Naik Sijil
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Menunggu Kelulusan</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Diluluskan</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{approved}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Rekod Pencapaian Saya</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {achievements.length === 0 ? (
            <div className="p-10 text-center">
              <Upload size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400 mb-4">Belum ada rekod pencapaian</p>
              <Link
                href="/dashboard/teacher/upload"
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                Muat naik sijil pertama anda →
              </Link>
            </div>
          ) : (
            achievements.map((a) => {
              const badge = statusBadge[a.status] ?? statusBadge.pending;
              return (
                <div key={a.id} className="p-4 flex items-center gap-4">
                  <Star size={16} className="text-gray-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{a.programName}</p>
                    <p className="text-xs text-gray-400">
                      {getLevelLabel(a.level)} · {formatDate(a.achievementDate)}
                    </p>
                    {a.aiDraftDescription && (
                      <p className="text-xs text-blue-500 mt-0.5 truncate">{a.aiDraftDescription}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.class}`}>
                    {badge.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
