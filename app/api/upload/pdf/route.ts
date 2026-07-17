import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from "@/lib/rate-limit";
import { rateLimits } from "@/lib/rate-limit-config";
import { db } from "@/lib/db";
import { chat, document, documentChunk, embedding } from "@/lib/db/schema";
import { parsePdf } from "@/lib/pdf/parser";
import { cleanPdfText } from "@/lib/pdf/cleaner";
import { chunkText } from "@/lib/pdf/chunker";
import { embedChunks } from "@/lib/ai/embeddings";
import { eq, and } from "drizzle-orm";

const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB ?? "10");
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export interface UploadedDocument {
  id: string;
  name: string;
  totalPages: number;
  chunkCount: number;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const rateLimit = checkRateLimit({
    key: `${getClientIdentifier(req, userId)}:${rateLimits.upload.name}`,
    limit: rateLimits.upload.limit,
    windowMs: rateLimits.upload.windowMs,
  });
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }
  const contentLength = req.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json(
      { error: `Upload exceeds ${MAX_UPLOAD_SIZE_MB} MB limit` },
      { status: 413 }
    );
  }

  const formData = await req.formData();
  const chatId = formData.get("chatId") as string | null;
  const files = formData.getAll("files") as File[];

  if (!files.length || files.some((f) => !(f instanceof File))) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json(
      { error: `Total upload size exceeds ${MAX_UPLOAD_SIZE_MB} MB limit` },
      { status: 413 }
    );
  }

  // Validate chat ownership if a chatId is provided.
  let activeChatId = chatId;
  if (activeChatId) {
    const existingChat = await db.query.chat.findFirst({
      where: and(eq(chat.id, activeChatId), eq(chat.userId, userId)),
    });
    if (!existingChat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
  } else {
    const [newChat] = await db
      .insert(chat)
      .values({
        id: crypto.randomUUID(),
        userId,
        title: "PDF conversation",
      })
      .returning();
    activeChatId = newChat.id;
  }

  if (!activeChatId) {
    return NextResponse.json({ error: "Failed to resolve chat" }, { status: 500 });
  }

  const uploadedDocuments: UploadedDocument[] = [];

  for (const file of files) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      continue;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsed = await parsePdf(buffer);
    const cleaned = cleanPdfText(parsed.text);
    const chunks = chunkText(cleaned);

    const documentId = crypto.randomUUID();
    await db.insert(document).values({
      id: documentId,
      chatId: activeChatId,
      name: file.name,
      totalPages: parsed.numPages,
    });

    const chunkRecords = chunks.map((chunk) => ({
      id: crypto.randomUUID(),
      documentId,
      chatId: activeChatId,
      content: chunk.content,
      index: chunk.index,
    }));

    if (chunkRecords.length > 0) {
      await db.insert(documentChunk).values(chunkRecords);

      const embeddings = await embedChunks(chunks.map((c) => c.content));
      const embeddingRecords = embeddings.map((emb, i) => ({
        id: crypto.randomUUID(),
        chunkId: chunkRecords[i].id,
        model: emb.model,
        vector: emb.values,
      }));

      await db.insert(embedding).values(embeddingRecords);
    }

    uploadedDocuments.push({
      id: documentId,
      name: file.name,
      totalPages: parsed.numPages,
      chunkCount: chunkRecords.length,
    });
  }

  return NextResponse.json({
    chatId: activeChatId,
    documents: uploadedDocuments,
  });
}
