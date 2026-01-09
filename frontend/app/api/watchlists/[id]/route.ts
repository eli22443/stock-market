import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get a specific watchlist with its items
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch watchlist
  const { data: watchlist, error: watchlistError } = await supabase
    .from("watchlists")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (watchlistError) {
    console.error("Error fetching watchlist:", watchlistError);
    if (watchlistError.code === "PGRST116") {
      return NextResponse.json(
        { error: "Watchlist not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: watchlistError.message },
      { status: 500 }
    );
  }

  // Fetch watchlist items
  const { data: items, error: itemsError } = await supabase
    .from("watchlist_items")
    .select("*")
    .eq("watchlist_id", id)
    .order("added_at", { ascending: false });

  if (itemsError) {
    console.error("Error fetching watchlist items:", itemsError);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({
    ...watchlist,
    items: items || [],
  });
}

// PUT - Update watchlist name/description
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, is_default } = body;

    // Verify watchlist belongs to user
    const { data: existingWatchlist, error: checkError } = await supabase
      .from("watchlists")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (checkError || !existingWatchlist) {
      return NextResponse.json(
        { error: "Watchlist not found" },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults first
    if (is_default === true) {
      await supabase
        .from("watchlists")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("is_default", true)
        .neq("id", id);
    }

    // Build update object
    const updateData: {
      name?: string;
      description?: string | null;
      is_default?: boolean;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Watchlist name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (is_default !== undefined) {
      updateData.is_default = is_default;
    }

    const { data, error } = await supabase
      .from("watchlists")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating watchlist:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// DELETE - Delete a watchlist (cascades to items via foreign key)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify watchlist belongs to user
  const { data: existingWatchlist, error: checkError } = await supabase
    .from("watchlists")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (checkError || !existingWatchlist) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  }

  // Delete watchlist (items will be cascade deleted)
  const { error } = await supabase
    .from("watchlists")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting watchlist:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
