import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  const cookieStore = await cookies();

  // Delete known cookies directly
  const allCookies = cookieStore.getAll();
  allCookies.forEach((c) => {
    cookieStore.delete(c.name);
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("your-placeholder")) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      });
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }

  const response = NextResponse.json({ success: true });
  
  // Explicitly clear cookies on response header
  response.cookies.set("dayflow_session", "", { path: "/", maxAge: 0, expires: new Date(0) });
  response.cookies.set("dayflow_demo_session", "", { path: "/", maxAge: 0, expires: new Date(0) });
  allCookies.forEach((c) => {
    response.cookies.set(c.name, "", { path: "/", maxAge: 0, expires: new Date(0) });
  });

  return response;
}
