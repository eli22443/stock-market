import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Define protected API routes that require authentication
  const protectedApiRoutes = [
    "/api/watchlists",
    "/api/portfolios",
    "/api/alerts",
  ];

  // Define protected page routes that require authentication
  const protectedPageRoutes = ["/dashboard", "/watchlist", "/portfolio"];

  // Check if the current path is a protected API route
  const isProtectedApiRoute = protectedApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is a protected page route
  const isProtectedPageRoute = protectedPageRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // All other API routes are public (Yahoo Finance, etc.)
  const isApiRoute = pathname.startsWith("/api/");
  const isPublicApiRoute = isApiRoute && !isProtectedApiRoute;

  // Public page routes (including auth pages)
  const publicAuthPageRoutes = ["/login", "/logout", "/signup"];
  const isPublicPageRoute = publicAuthPageRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Determine if route is protected
  const isProtectedRoute = isProtectedApiRoute || isProtectedPageRoute;

  // Determine if route is an auth page (login, signup, logout)
  const isAuthPage = publicAuthPageRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Early return for public API routes - skip Supabase entirely to avoid cache issues
  if (isPublicApiRoute) {
    return NextResponse.next({ request });
  }

  // Check for Bearer token in Authorization header (for Postman/testing)
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  let user: any = null;

  // If Bearer token is provided, validate it directly
  if (accessToken) {
    const supabaseClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const {
      data: { user: tokenUser },
      error: tokenError,
    } = await supabaseClient.auth.getUser(accessToken);

    if (!tokenError && tokenUser) {
      user = { id: tokenUser.id, email: tokenUser.email };
      console.log("User authenticated via Bearer token:", user.email);
    }
  }

  // Only create Supabase client and check auth for routes that need it
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If no Bearer token or Bearer token validation failed, try cookie-based auth
  if (!user) {
    // With Fluid compute, don't put this client in a global environment
    // variable. Always create a new one on each request.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Do not run code between createServerClient and
    // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: If you remove getClaims() and you use server-side rendering
    // with the Supabase client, your users may be randomly logged out.
    const { data } = await supabase.auth.getClaims();
    console.log("User authenticated via cookies:", !!data?.claims);

    user = data?.claims;
  }

  // Handle authenticated users accessing auth pages (redirect to dashboard)
  if (user && isAuthPage) {
    // Don't redirect from /logout (they're logging out)
    console.log(
      "Authenticated user accessing auth page, redirecting to dashboard"
    );
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    const redirectResponse = NextResponse.redirect(url);
    // Copy cookies to maintain session
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        sameSite: cookie.sameSite,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
        expires: cookie.expires,
      });
    });
    return redirectResponse;
  }

  // Handle protected routes without authentication
  if (!user && isProtectedRoute) {
    // For API routes, return 401 Unauthorized
    if (isProtectedApiRoute) {
      const unauthorizedResponse = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
      // Copy cookies to maintain session
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        unauthorizedResponse.cookies.set(cookie.name, cookie.value, {
          path: cookie.path,
          domain: cookie.domain,
          sameSite: cookie.sameSite,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          maxAge: cookie.maxAge,
          expires: cookie.expires,
        });
      });
      return unauthorizedResponse;
    }

    // For page routes, redirect to login
    console.log("Redirecting to login from:", request.nextUrl.pathname);
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Preserve the intended destination for redirect after login
    url.searchParams.set("redirectedFrom", pathname);
    // Create redirect response with cookies preserved from supabaseResponse
    const redirectResponse = NextResponse.redirect(url);
    // Copy all cookies from supabaseResponse to maintain session
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        sameSite: cookie.sameSite,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
        expires: cookie.expires,
      });
    });
    return redirectResponse;
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
