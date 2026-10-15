import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { achievements, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { status, rejectionReason, skasStandard, skasScore, skasJustification } = body;

  const updateData: Partial<typeof achievements.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (status) {
    updateData.status = status;
    if (status === "approved") {
      updateData.approvedByUserId = dbUser.id;
      updateData.approvedAt = new Date();
    }
    if (status === "rejected" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
  }

  if (skasStandard) updateData.skasStandard = skasStandard;
  if (skasScore !== undefined) updateData.skasScore = skasScore;
  if (skasJustification) updateData.skasJustification = skasJustification;

  const [updated] = await db
    .update(achievements)
    .set(updateData)
    .where(eq(achievements.id, params.id))
    .returning();

  return NextResponse.json(updated);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const achievement = await db.query.achievements.findFirst({
    where: eq(achievements.id, params.id),
    with: { uploadedBy: true, school: true },
  });

  if (!achievement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(achievement);
}
