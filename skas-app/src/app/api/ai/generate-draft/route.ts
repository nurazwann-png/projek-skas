import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getLevelLabel, getTeacherRoleLabel } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { programName, level, teacherRole, achievementDate, position, participantName } =
    await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    system: `Anda adalah pakar dalam sistem SK@S (School Quality Management System) Malaysia.
Tugas anda adalah menghasilkan justifikasi rasmi dalam Bahasa Malaysia yang tepat, profesional,
dan memenuhi keperluan rubrik SK@S untuk direkodkan dalam borang pencapaian guru.
Gunakan bahasa formal sesuai dengan konteks pendidikan Malaysia.`,
    prompt: `Hasilkan justifikasi rasmi SK@S untuk pencapaian berikut:

Program/Pertandingan: ${programName}
Tarikh: ${new Date(achievementDate).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" })}
Peringkat: ${getLevelLabel(level)}
Peranan Guru: ${getTeacherRoleLabel(teacherRole)}
${participantName ? `Nama Peserta: ${participantName}` : ""}
${position ? `Pencapaian: ${position}` : ""}

Tulis justifikasi dalam 2-3 ayat yang:
1. Menerangkan pencapaian secara spesifik
2. Menunjukkan impak kepada sekolah/daerah/negara
3. Menghubungkan dengan standard kualiti SK@S

Balas dengan teks justifikasi sahaja tanpa tajuk atau nombor.`,
  });

  return result.toTextStreamResponse();
}
