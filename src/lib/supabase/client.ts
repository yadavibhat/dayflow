import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a browser-safe Supabase client for client-side queries
 * in Next.js App Router client components.
 */
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Gracefully fallback to placeholder strings during build/prerender phase
  // to avoid bailing out static compilation.
  return createBrowserClient(
    supabaseUrl || "https://your-placeholder-url.supabase.co",
    supabaseAnonKey || "your-placeholder-anon-key"
  );
};

// Singelton client instance for quick standard queries
export const supabase = createSupabaseClient();

// Compatibility alias
export const createClient = createSupabaseClient;
