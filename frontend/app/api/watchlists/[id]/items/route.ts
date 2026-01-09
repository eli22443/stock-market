import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get all items in a watchlist
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

  // Verify watchlist belongs to user
  const { data: watchlist, error: watchlistError } = await supabase
    .from("watchlists")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (watchlistError || !watchlist) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
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

  return NextResponse.json(items || []);
}

// POST - Add a stock to a watchlist
export async function POST(
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
    const { symbol, notes } = body;

    // Validate required fields
    if (!symbol || typeof symbol !== "string" || symbol.trim().length === 0) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    const normalizedSymbol = symbol.trim().toUpperCase();

    // Verify watchlist belongs to user
    const { data: watchlist, error: watchlistError } = await supabase
      .from("watchlists")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (watchlistError || !watchlist) {
      return NextResponse.json(
        { error: "Watchlist not found" },
        { status: 404 }
      );
    }

    // Check if symbol already exists in this watchlist
    const { data: existingItem } = await supabase
      .from("watchlist_items")
      .select("id")
      .eq("watchlist_id", id)
      .eq("symbol", normalizedSymbol)
      .single();

    if (existingItem) {
      return NextResponse.json(
        { error: "Stock already exists in this watchlist" },
        { status: 400 }
      );
    }

    // Add item to watchlist
    const { data, error } = await supabase
      .from("watchlist_items")
      .insert({
        watchlist_id: id,
        symbol: normalizedSymbol,
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding item to watchlist:", error);
      // Handle unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Stock already exists in this watchlist" },
          { status: 400 }
        );
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

// DELETE - Remove a stock from a watchlist
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

  try {
    const body = await request.json();
    const { symbol } = body;

    // Validate required fields
    if (!symbol || typeof symbol !== "string" || symbol.trim().length === 0) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    const normalizedSymbol = symbol.trim().toUpperCase();

    // Verify watchlist belongs to user
    const { data: watchlist, error: watchlistError } = await supabase
      .from("watchlists")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (watchlistError || !watchlist) {
      return NextResponse.json(
        { error: "Watchlist not found" },
        { status: 404 }
      );
    }

    // Delete the item
    const { error } = await supabase
      .from("watchlist_items")
      .delete()
      .eq("watchlist_id", id)
      .eq("symbol", normalizedSymbol);

    if (error) {
      console.error("Error removing item from watchlist:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
