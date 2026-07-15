import { db } from "@/lib/db";
import { documentChunk, embedding } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { embedText } from "./embeddings";

export interface RetrievedChunk {
  id: string;
  content: string;
  documentId: string;
  similarity: number;
}

export interface RetrieveOptions {
  chatId: string;
  query: string;
  topK?: number;
}

const DEFAULT_TOP_K = 5;

/**
 * Retrieves the top-k most relevant chunks for a query using pgvector cosine distance.
 */
export async function retrieveRelevantChunks({
  chatId,
  query,
  topK = DEFAULT_TOP_K,
}: RetrieveOptions): Promise<RetrievedChunk[]> {
  const { values } = await embedText(query);
  const vectorLiteral = `[${values.join(",")}]`;

  const rows = await db
    .select({
      id: documentChunk.id,
      content: documentChunk.content,
      documentId: documentChunk.documentId,
      similarity: sql<number>`1 - (${embedding.vector} <=> ${vectorLiteral}::vector)`.as(
        "similarity"
      ),
    })
    .from(documentChunk)
    .innerJoin(embedding, eq(embedding.chunkId, documentChunk.id))
    .where(eq(documentChunk.chatId, chatId))
    .orderBy(sql`${embedding.vector} <=> ${vectorLiteral}::vector`)
    .limit(topK);

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    documentId: row.documentId,
    similarity: Number(row.similarity),
  }));
}
