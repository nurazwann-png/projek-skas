import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { achievements, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const data = await db.query.achievements.findMany({
    where: eq(achievements.uploadedByUserId, dbUser.id),
    orderBy: (a, { desc }) => [desc(a.createdAt)],
  });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
  if (!dbUser?.schoolId) {
    return NextResponse.json({ error: "User has no school assigned" }, { status: 400 });
  }

  const body = await req.json();

  const [achievement] = await db
    .insert(achievements)
    .values({
      schoolId: dbUser.schoolId,
      uploadedByUserId: dbUser.id,
      programName: body.programName,
      achievementDate: new Date(body.achievementDate),
      level: body.level,
      teacherRole: body.teacherRole,
      participantName: body.participantName,
      position: body.position,
      certificateImageUrl: body.certificateImageUrl,
      status: "pending",
    })
    .returning();

  return NextResponse.json(achievement, { status: 201 });
}
