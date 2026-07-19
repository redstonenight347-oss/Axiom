import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
  });

  return NextResponse.json({
    settings: {
      preferredModel: row?.preferredModel ?? null,
      customPrompt: row?.customPrompt ?? null,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { preferredModel, customPrompt } = body;

  const existing = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
  });

  if (existing) {
    await db
      .update(userSettings)
      .set({
        preferredModel:
          preferredModel !== undefined ? preferredModel : existing.preferredModel,
        customPrompt:
          customPrompt !== undefined ? customPrompt : existing.customPrompt,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.id, existing.id));
  } else {
    await db.insert(userSettings).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      preferredModel: preferredModel ?? null,
      customPrompt: customPrompt ?? null,
    });
  }

  return NextResponse.json({ success: true });
}
