import { db } from "@/lib/db";
import { modelUsage } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

const ONE_MINUTE_MS = 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface UsageIncrement {
  userId: string;
  model: string;
  requests?: number;
  tokens?: number;
}

export interface ModelUsageSnapshot {
  model: string;
  requestsUsedMinute: number;
  requestsUsedDay: number;
  tokensUsedDay: number;
}

function nextWindowBoundary(windowMs: number, now = Date.now()): number {
  return now + windowMs;
}

/**
 * Atomically increment request/token counters for a user + model pair.
 * Creates the row if it does not already exist. Resets expired rolling
 * windows (1 minute for rpm, 24 hours for rpd/tpm) before applying the
 * increment so the counters always reflect the current window.
 */
export async function incrementModelUsage({
  userId,
  model,
  requests = 0,
  tokens = 0,
}: UsageIncrement): Promise<void> {
  if (requests === 0 && tokens === 0) return;

  const now = Date.now();

  const existing = await db.query.modelUsage.findFirst({
    where: and(eq(modelUsage.userId, userId), eq(modelUsage.model, model)),
    columns: {
      id: true,
      requestsUsedMinute: true,
      requestsUsedDay: true,
      tokensUsedDay: true,
      minuteResetAt: true,
      dayResetAt: true,
    },
  });

  if (existing) {
    const resetMinute = now >= existing.minuteResetAt;
    const resetDay = now >= existing.dayResetAt;

    const nextMinuteReset = resetMinute ? nextWindowBoundary(ONE_MINUTE_MS, now) : existing.minuteResetAt;
    const nextDayReset = resetDay ? nextWindowBoundary(ONE_DAY_MS, now) : existing.dayResetAt;

    await db
      .update(modelUsage)
      .set({
        requestsUsedMinute: resetMinute
          ? requests
          : sql`${modelUsage.requestsUsedMinute} + ${requests}`,
        requestsUsedDay: resetDay
          ? requests
          : sql`${modelUsage.requestsUsedDay} + ${requests}`,
        tokensUsedDay: resetDay
          ? tokens
          : sql`${modelUsage.tokensUsedDay} + ${tokens}`,
        minuteResetAt: nextMinuteReset,
        dayResetAt: nextDayReset,
        updatedAt: new Date(),
      })
      .where(eq(modelUsage.id, existing.id));
  } else {
    const nowTs = Date.now();
    await db.insert(modelUsage).values({
      id: crypto.randomUUID(),
      userId,
      model,
      requestsUsedMinute: requests,
      requestsUsedDay: requests,
      tokensUsedDay: tokens,
      minuteResetAt: nextWindowBoundary(ONE_MINUTE_MS, nowTs),
      dayResetAt: nextWindowBoundary(ONE_DAY_MS, nowTs),
    });
  }
}

/**
 * Return current windowed usage for a user, applying any pending window
 * resets in-memory so the caller never sees stale counters.
 */
export async function getModelUsageForUser(userId: string): Promise<ModelUsageSnapshot[]> {
  const rows = await db.query.modelUsage.findMany({
    where: eq(modelUsage.userId, userId),
    columns: {
      model: true,
      requestsUsedMinute: true,
      requestsUsedDay: true,
      tokensUsedDay: true,
      minuteResetAt: true,
      dayResetAt: true,
    },
  });

  const now = Date.now();

  return rows.map((row) => ({
    model: row.model,
    requestsUsedMinute: now >= row.minuteResetAt ? 0 : row.requestsUsedMinute,
    requestsUsedDay: now >= row.dayResetAt ? 0 : row.requestsUsedDay,
    tokensUsedDay: now >= row.dayResetAt ? 0 : row.tokensUsedDay,
  }));
}
