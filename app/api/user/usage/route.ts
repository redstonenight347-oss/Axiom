import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { modelUsage } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.query.modelUsage.findMany({
    where: eq(modelUsage.userId, session.user.id),
    columns: { model: true, requestsUsed: true, tokensUsed: true },
  });

  return NextResponse.json({ usage: rows });
}
