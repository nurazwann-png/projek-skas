import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { achievements, schools } from "@/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { PPDDashboard } from "@/components/ppd/ppd-dashboard";

export default async function PPDPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const totalSchools = await db.select({ count: count() }).from(schools);
  const totalAchievements = await db.select({ count: count() }).from(achievements);
  const pendingApprovals = await db
    .select({ count: count() })
    .from(achievements)
    .where(eq(achievements.status, "pending"));

  const byLevel = await db
    .select({ level: achievements.level, count: count() })
    .from(achievements)
    .where(eq(achievements.status, "approved"))
    .groupBy(achievements.level);

  const stats = {
    totalSchools: totalSchools[0]?.count ?? 0,
    totalAchievements: totalAchievements[0]?.count ?? 0,
    pendingApprovals: pendingApprovals[0]?.count ?? 0,
    byLevel,
  };

  return <PPDDashboard stats={stats} />;
}
