"use client";

import { createClient } from "@/lib/supabase/client";

// Client-side auth functions (for use in Client Components)
export async function signInWithGoogle() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      redirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });

  if (error) {
    console.error("Error signing in with Google:", error);
    return;
  }

  // Supabase automatically redirects in the browser when signInWithOAuth is called
  // from a client component. The redirectTo option tells Supabase where to redirect
  // after OAuth completes. No manual redirect needed!
}
