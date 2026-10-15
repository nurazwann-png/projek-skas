"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { School, FileCheck, Clock, TrendingUp } from "lucide-react";
import { getLevelLabel } from "@/lib/utils";

interface Props {
  stats: {
    totalSchools: number;
    totalAchievements: number;
    pendingApprovals: number;
    byLevel: { level: string; count: number }[];
  };
}

export function PPDDashboard({ stats }: Props) {
  const chartData = stats.byLevel.map((d) => ({
    name: getLevelLabel(d.level),
    pencapaian: d.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Papan Pemuka PPD</h1>
        <p className="text-gray-500 text-sm mt-1">Gambaran keseluruhan pencapaian daerah</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<School className="text-blue-600" size={24} />}
          label="Jumlah Sekolah"
          value={stats.totalSchools}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<FileCheck className="text-green-600" size={24} />}
          label="Jumlah Pencapaian"
          value={stats.totalAchievements}
          bg="bg-green-50"
        />
        <StatCard
          icon={<Clock className="text-amber-600" size={24} />}
          label="Menunggu Kelulusan"
          value={stats.pendingApprovals}
          bg="bg-amber-50"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Pencapaian Mengikut Peringkat</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 13 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
              <Tooltip />
              <Bar dataKey="pencapaian" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400">
            Tiada data lagi
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`${bg} p-3 rounded-lg`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
