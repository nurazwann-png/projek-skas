import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { achievements, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ApprovalsPanel } from "@/components/school/approvals-panel";

export default async function ApprovalsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
  if (!dbUser?.schoolId) redirect("/dashboard/school");

  const pending = await db.query.achievements.findMany({
    where: eq(achievements.schoolId, dbUser.schoolId) && eq(achievements.status, "pending") as any,
    orderBy: (a, { asc }) => [asc(a.createdAt)],
    with: { uploadedBy: true },
  });

  return <ApprovalsPanel achievements={pending} />;
}
