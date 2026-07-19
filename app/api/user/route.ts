import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.delete(user).where(eq(user.id, session.user.id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete user:", err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
