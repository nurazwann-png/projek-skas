"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
  CheckSquare,
  BarChart3,
  School,
  Settings,
  FileText,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

const navByRole: Record<string, { href: string; label: string; icon: React.ReactNode }[]> = {
  ppd_admin: [
    { href: "/dashboard/ppd", label: "Papan Pemuka PPD", icon: <LayoutDashboard size={18} /> },
    { href: "/dashboard/ppd/schools", label: "Senarai Sekolah", icon: <School size={18} /> },
    { href: "/dashboard/ppd/reports", label: "Laporan", icon: <BarChart3 size={18} /> },
  ],
  school_admin: [
    { href: "/dashboard/school", label: "Papan Pemuka", icon: <LayoutDashboard size={18} /> },
    { href: "/dashboard/school/approvals", label: "Kelulusan Tertunda", icon: <CheckSquare size={18} /> },
    { href: "/dashboard/school/achievements", label: "Semua Pencapaian", icon: <FileText size={18} /> },
  ],
  teacher: [
    { href: "/dashboard/teacher", label: "Papan Pemuka", icon: <LayoutDashboard size={18} /> },
    { href: "/dashboard/teacher/upload", label: "Muat Naik Sijil", icon: <Upload size={18} /> },
    { href: "/dashboard/teacher/achievements", label: "Pencapaian Saya", icon: <FileText size={18} /> },
  ],
};

export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname();
  const navItems = navByRole[role] ?? navByRole.teacher;

  return (
    <aside className="w-64 bg-blue-950 text-white flex flex-col">
      <div className="p-6 border-b border-blue-800">
        <span className="text-2xl font-black">SK@S</span>
        <p className="text-blue-300 text-xs mt-1">Sistem Kualiti Sekolah</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-blue-700 text-white"
                : "text-blue-200 hover:bg-blue-800 hover:text-white"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-blue-800 flex items-center gap-3">
        <UserButton />
        <span className="text-blue-300 text-xs">Akaun</span>
      </div>
    </aside>
  );
}
