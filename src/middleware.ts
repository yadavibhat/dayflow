import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware: auth-gate all protected routes.
 *
 * Public routes (no auth required): /signin, /signup, static assets.
 * Protected routes: everything else → redirect to /signin if no session.
 *
 * Also refreshes the Supabase session cookie on every request so it
 * stays alive without full page reloads.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured (local dev without project), skip auth guard.
  const isConfigured =
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-placeholder") &&
    !supabaseAnonKey.includes("your-placeholder");

  if (!isConfigured) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session — keeps auth alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasSessionCookie =
    Boolean(request.cookies.get("dayflow_session")?.value) ||
    Boolean(request.cookies.get("dayflow_demo_session")?.value);

  const { pathname } = request.nextUrl;

  // Public paths that never need auth
  const publicPaths = ["/signin", "/signup"];
  const isPublic =
    publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (!isPublic && !user && !hasSessionCookie) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/signin";
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
