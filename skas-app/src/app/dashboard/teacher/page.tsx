import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { achievements, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TeacherDashboard } from "@/components/teacher/teacher-dashboard";

export default async function TeacherPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  const myAchievements = dbUser
    ? await db.query.achievements.findMany({
        where: eq(achievements.uploadedByUserId, dbUser.id),
        orderBy: (a, { desc }) => [desc(a.createdAt)],
        limit: 20,
      })
    : [];

  return <TeacherDashboard achievements={myAchievements} />;
}
