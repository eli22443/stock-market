import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

// GET - Fetch all watchlists for the current user
export async function GET() {
  const supabase = await createClient();
  const headersList = await headers();

  // Check for Bearer token in Authorization header (for Postman/testing)
  const authHeader = headersList.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  // Get user - use token if provided, otherwise use cookie-based auth
  const {
    data: { user },
    error: authError,
  } = accessToken
    ? await supabase.auth.getUser(accessToken)
    : await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("watchlists")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching watchlists:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST - Create a new watchlist
export async function POST(request: Request) {
  const supabase = await createClient();
  const headersList = await headers();

  // Check for Bearer token in Authorization header (for Postman/testing)
  const authHeader = headersList.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  // Get user - use token if provided, otherwise use cookie-based auth
  const {
    data: { user },
    error: authError,
  } = accessToken
    ? await supabase.auth.getUser(accessToken)
    : await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, is_default } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Watchlist name is required" },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults first
    if (is_default) {
      await supabase
        .from("watchlists")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("is_default", true);
    }

    const { data, error } = await supabase
      .from("watchlists")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        is_default: is_default || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating watchlist:", error);
      // Handle unique constraint violation
      if (error.code === "23505") {
        // Check if this is about the default watchlist constraint
        if (is_default === true) {
          return NextResponse.json(
            {
              error:
                "You already have a default watchlist. Please unset the existing default first.",
            },
            { status: 400 }
          );
        } else {
          // This shouldn't happen with proper constraint, but handle it anyway
          return NextResponse.json(
            { error: "A watchlist with these properties already exists" },
            { status: 400 }
          );
        }
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
