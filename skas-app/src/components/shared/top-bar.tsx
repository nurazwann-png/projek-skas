import { auth, currentUser } from "@clerk/nextjs/server";
import { Bell } from "lucide-react";

export async function TopBar() {
  const user = await currentUser();
  const roleLabels: Record<string, string> = {
    ppd_admin: "Admin PPD",
    school_admin: "Pentadbir Sekolah",
    teacher: "Guru",
  };
  const role = user?.publicMetadata?.role as string ?? "teacher";

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">Selamat datang,</p>
        <p className="font-semibold text-gray-800">
          {user?.firstName ?? "Pengguna"} — {roleLabels[role] ?? role}
        </p>
      </div>
      <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
        <Bell size={20} />
      </button>
    </header>
  );
}
