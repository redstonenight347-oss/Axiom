import { db } from "@/lib/db";
import { modelUsage } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export interface UsageIncrement {
  userId: string;
  model: string;
  requests?: number;
  tokens?: number;
}

/**
 * Atomically increment request/token counters for a user + model pair.
 * Creates the row if it does not already exist.
 */
export async function incrementModelUsage({
  userId,
  model,
  requests = 0,
  tokens = 0,
}: UsageIncrement): Promise<void> {
  if (requests === 0 && tokens === 0) return;

  const existing = await db.query.modelUsage.findFirst({
    where: and(eq(modelUsage.userId, userId), eq(modelUsage.model, model)),
    columns: { id: true },
  });

  if (existing) {
    await db
      .update(modelUsage)
      .set({
        requestsUsed: sql`${modelUsage.requestsUsed} + ${requests}`,
        tokensUsed: sql`${modelUsage.tokensUsed} + ${tokens}`,
        updatedAt: new Date(),
      })
      .where(eq(modelUsage.id, existing.id));
  } else {
    await db.insert(modelUsage).values({
      id: crypto.randomUUID(),
      userId,
      model,
      requestsUsed: requests,
      tokensUsed: tokens,
    });
  }
}
