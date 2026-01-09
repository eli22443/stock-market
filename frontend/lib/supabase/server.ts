import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const headersList = await headers();

  // Check for Bearer token in Authorization header (for API testing with Postman)
  const authHeader = headersList.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  // If Bearer token is provided, create a client with the token
  if (accessToken) {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        auth: {
          persistSession: false, // Don't persist session for API requests
        },
      }
    );
  }

  // Otherwise, use cookie-based authentication (for browser requests)
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
