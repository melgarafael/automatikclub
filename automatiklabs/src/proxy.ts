import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/registro",
  "/recuperar-senha",
  "/redefinir-senha",
  "/pricing",
  "/register",
];

// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/feed",
  "/learn",
  "/community",
  "/marketplace",
  "/ranking",
  "/members",
  "/settings",
  "/admin",
  "/profile",
];

// Routes that require admin role
const ADMIN_PREFIXES = ["/admin"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Refresh auth session (validates JWT with Supabase server)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 2. Redirect authenticated users away from auth pages
  if (user && (pathname === "/login" || pathname === "/registro")) {
    const feedUrl = new URL("/feed", request.url);
    return NextResponse.redirect(feedUrl);
  }

  // 3. Protect routes — redirect to /login if not authenticated
  if (!user && isProtectedRoute(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Admin routes — check role from JWT claims
  if (user && isAdminRoute(pathname)) {
    const role =
      user.app_metadata?.role ?? user.user_metadata?.role ?? "aluno";

    if (role !== "admin") {
      const feedUrl = new URL("/feed", request.url);
      feedUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(feedUrl);
    }
  }

  // 5. Apply security headers
  supabaseResponse.headers.set("X-Frame-Options", "DENY");
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );
  supabaseResponse.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (svg, png, jpg, etc.)
     * - API routes (they handle their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
