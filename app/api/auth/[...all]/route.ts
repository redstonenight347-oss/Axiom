import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from "@/lib/rate-limit";
import { rateLimits } from "@/lib/rate-limit-config";

async function rateLimitedHandler(req: NextRequest) {
  const rateLimit = checkRateLimit({
    key: `${getClientIdentifier(req)}:${rateLimits.auth.name}`,
    limit: rateLimits.auth.limit,
    windowMs: rateLimits.auth.windowMs,
  });
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  return auth.handler(req);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };
