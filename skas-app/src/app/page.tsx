import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-800 flex items-center justify-center">
      <div className="text-center text-white px-6">
        <div className="mb-6">
          <span className="text-6xl font-black tracking-tight">SK@S</span>
          <p className="text-blue-200 text-lg mt-2">Sistem Kualiti Sekolah</p>
        </div>
        <h1 className="text-2xl font-semibold mb-2">
          Sistem Pemantauan Daerah Berpusat
        </h1>
        <p className="text-blue-200 mb-10 max-w-md mx-auto">
          Platform AI-First untuk pengurusan pencapaian dan pemantauan kualiti sekolah
          di bawah Pejabat Pendidikan Daerah.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-in"
            className="bg-white text-blue-900 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition"
          >
            Log Masuk
          </Link>
          <Link
            href="/sign-up"
            className="border border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition"
          >
            Daftar
          </Link>
        </div>
      </div>
    </main>
  );
}
