import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chat } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const chats = await db.query.chat.findMany({
    where: eq(chat.userId, userId),
    orderBy: [desc(chat.updatedAt)],
    columns: {
      id: true,
      title: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ chats });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("id");

  if (!chatId) {
    return NextResponse.json({ error: "Missing chat id" }, { status: 400 });
  }

  const existingChat = await db.query.chat.findFirst({
    where: and(eq(chat.id, chatId), eq(chat.userId, userId)),
  });

  if (!existingChat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  await db.delete(chat).where(eq(chat.id, chatId));

  return NextResponse.json({ success: true });
}
