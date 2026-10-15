import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { achievements, users } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { SchoolDashboard } from "@/components/school/school-dashboard";

export default async function SchoolPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (!dbUser?.schoolId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Akaun anda belum dikaitkan dengan mana-mana sekolah.</p>
      </div>
    );
  }

  const { and } = await import("drizzle-orm");

  const pending = await db
    .select({ count: count() })
    .from(achievements)
    .where(and(eq(achievements.schoolId, dbUser.schoolId), eq(achievements.status, "pending")));

  const approved = await db
    .select({ count: count() })
    .from(achievements)
    .where(and(eq(achievements.schoolId, dbUser.schoolId), eq(achievements.status, "approved")));

  const recentAchievements = await db.query.achievements.findMany({
    where: eq(achievements.schoolId, dbUser.schoolId),
    orderBy: (a, { desc }) => [desc(a.createdAt)],
    limit: 10,
    with: { uploadedBy: true },
  });

  return (
    <SchoolDashboard
      pendingCount={pending[0]?.count ?? 0}
      approvedCount={approved[0]?.count ?? 0}
      recentAchievements={recentAchievements}
    />
  );
}
