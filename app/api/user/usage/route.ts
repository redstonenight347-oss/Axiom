import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getModelUsageForUser } from "@/services/model-usage";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usage = await getModelUsageForUser(session.user.id);

  return NextResponse.json({ usage });
}
