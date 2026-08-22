import { supabase } from "@/lib/supabase/client";

export async function performLogout() {
  try {
    // 1. Trigger server API logout to clear HttpOnly and SSR cookies
    await fetch("/api/auth/logout", { credentials: "same-origin", method: "POST" }).catch(() => null);
  } catch {
    // ignore
  }

  try {
    // 2. Client-side Supabase signOut
    await supabase.auth.signOut().catch(() => null);
  } catch {
    // ignore
  }

  // 3. Clear all browser cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
  });
  document.cookie = "dayflow_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  document.cookie = "dayflow_demo_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";

  // 4. Clear storage
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // ignore
  }

  // 5. Navigate cleanly to /signin
  window.location.replace("/signin");
}
