import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RATE_LIMITS: Record<string, { limit: number; windowSeconds: number }> = {
  "/api/auth": { limit: 10, windowSeconds: 60 },
  "/api/ai": { limit: 20, windowSeconds: 60 },
  "/api/tickets": { limit: 60, windowSeconds: 60 },
};

type RateLimitEntry = { count: number; resetAt: number };
const rateLimitStore = new Map<string, RateLimitEntry>();

function getRateLimitKey(ip: string, path: string): string | null {
  for (const prefix of Object.keys(RATE_LIMITS)) {
    if (path.startsWith(prefix)) {
      return `${ip}:${prefix}`;
    }
  }
  return null;
}

function checkRateLimit(
  key: string,
  config: { limit: number; windowSeconds: number },
): { allowed: boolean; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    });
    return { allowed: true, resetAt: now + config.windowSeconds * 1000 };
  }

  entry.count++;
  if (entry.count > config.limit) {
    return { allowed: false, resetAt: entry.resetAt };
  }

  return { allowed: true, resetAt: entry.resetAt };
}

// Cleanup expired entries every 60s
if (typeof globalThis !== "undefined") {
  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now >= entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  };
  setInterval(cleanup, 60_000);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const rlKey = getRateLimitKey(ip, pathname);

    if (rlKey) {
      const prefix = Object.keys(RATE_LIMITS).find((p) =>
        pathname.startsWith(p),
      )!;
      const result = checkRateLimit(rlKey, RATE_LIMITS[prefix]);
      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
        return NextResponse.json(
          { error: "Too many requests" },
          {
            status: 429,
            headers: { "Retry-After": String(retryAfter) },
          },
        );
      }
    }
  }

  // Auth check for protected routes
  const token = await getToken({ req: request });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/tickets/new",
    "/tickets/:path*/edit",
    "/api/tickets/:path*",
    "/api/ai/:path*",
  ],
};
