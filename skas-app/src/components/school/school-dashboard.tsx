"use client";

import { Achievement } from "@/db/schema";
import { formatDate, getLevelLabel } from "@/lib/utils";
import { CheckSquare, Clock, Star } from "lucide-react";
import Link from "next/link";

interface Props {
  pendingCount: number;
  approvedCount: number;
  recentAchievements: Achievement[];
}

const statusBadge: Record<string, { label: string; class: string }> = {
  pending: { label: "Menunggu", class: "bg-amber-100 text-amber-700" },
  approved: { label: "Diluluskan", class: "bg-green-100 text-green-700" },
  rejected: { label: "Ditolak", class: "bg-red-100 text-red-700" },
};

export function SchoolDashboard({ pendingCount, approvedCount, recentAchievements }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Papan Pemuka Sekolah</h1>
        <p className="text-gray-500 text-sm mt-1">Semak dan luluskan rekod pencapaian guru</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-amber-200 p-5 flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-lg">
            <Clock className="text-amber-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Menunggu Kelulusan</p>
            <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
          </div>
          <Link
            href="/dashboard/school/approvals"
            className="ml-auto text-sm text-blue-600 hover:underline"
          >
            Semak →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-5 flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <CheckSquare className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Telah Diluluskan</p>
            <p className="text-3xl font-bold text-gray-900">{approvedCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Rekod Terkini</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recentAchievements.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Tiada rekod lagi</div>
          ) : (
            recentAchievements.map((a) => {
              const badge = statusBadge[a.status] ?? statusBadge.pending;
              return (
                <div key={a.id} className="p-4 flex items-center gap-4">
                  <Star size={16} className="text-gray-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{a.programName}</p>
                    <p className="text-xs text-gray-400">
                      {getLevelLabel(a.level)} · {formatDate(a.achievementDate)}
                    </p>
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
