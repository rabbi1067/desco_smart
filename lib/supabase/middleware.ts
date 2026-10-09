import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** See lib/supabase/server.ts — the `cookies` option is a union, so annotate. */
type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Routes that require an authenticated session. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/meters",
  "/analytics",
  "/reports",
  "/notifications",
  "/profile",
  "/settings",
  "/admin",
];

/** Auth pages that an already-signed-in user should be bounced away from. */
const AUTH_ROUTES = ["/login", "/register"];

/**
 * Marketing / info pages carry no user data and need no session — skipping the
 * Supabase round-trip here keeps them fast (and immune to auth outages).
 * Anything not listed, plus every protected/auth route, goes through the
 * session refresh below.
 */
const PUBLIC_NO_SESSION_ROUTES = [
  "/",
  "/about",
  "/features",
  "/ai-forecaster",
  "/reviews",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
];

/** Edge-safe, dependency-free fixed-window limiter (per isolate memory). */
const edgeBuckets = new Map<string, { count: number; resetAt: number }>();
const EDGE_LIMIT = 120; // requests per IP per minute — generous, anti-abuse only
const EDGE_WINDOW_MS = 60_000;

function edgeRateLimit(ip: string, now: number): {
  ok: boolean;
  retryAfter: number;
} {
  const bucket = edgeBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    edgeBuckets.set(ip, { count: 1, resetAt: now + EDGE_WINDOW_MS });
    // Opportunistic sweep so the map can't grow without bound.
    if (edgeBuckets.size > 5000) {
      for (const [key, value] of edgeBuckets) {
        if (now >= value.resetAt) edgeBuckets.delete(key);
      }
    }
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= EDGE_LIMIT) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

/**
 * Refreshes the Supabase session cookie on every request and enforces
 * coarse route protection at the edge.
 *
 * This is defence-in-depth only: the authoritative checks are `requireAuth()` /
 * `requireAdmin()` in server code, plus RLS in the database. Middleware alone
 * is never treated as sufficient.
 */
export async function updateSession(request: NextRequest) {
  // Global abuse guard first — cheap, no I/O.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  const edge = edgeRateLimit(ip, Date.now());
  if (!edge.ok) {
    return new NextResponse("Too many requests. Please slow down.", {
      status: 429,
      headers: { "Retry-After": String(edge.retryAfter) },
    });
  }

  // Fast path: public marketing pages need no session at all.
  if (PUBLIC_NO_SESSION_ROUTES.includes(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }: CookieToSet) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() revalidates the JWT with Supabase — do not swap for getSession(),
  // which trusts the cookie contents without verification.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Preserve intent so the user lands where they meant to go after signing in.
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
