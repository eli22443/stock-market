import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

// GET - Get all holdings in a portfolio
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // Verify portfolio belongs to user
  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (portfolioError || !portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  // Fetch holdings
  const { data: holdings, error: holdingsError } = await supabase
    .from("holdings")
    .select("*")
    .eq("portfolio_id", id)
    .order("created_at", { ascending: false });

  if (holdingsError) {
    console.error("Error fetching holdings:", holdingsError);
    return NextResponse.json({ error: holdingsError.message }, { status: 500 });
  }

  return NextResponse.json(holdings || []);
}

// POST - Add a holding to a portfolio
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const { symbol, shares, avg_price, purchased_at, notes } = body;

    // Validate required fields
    if (!symbol || typeof symbol !== "string" || symbol.trim().length === 0) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    if (!shares || typeof shares !== "number" || shares <= 0) {
      return NextResponse.json(
        { error: "Shares must be a positive number" },
        { status: 400 }
      );
    }

    if (!avg_price || typeof avg_price !== "number" || avg_price <= 0) {
      return NextResponse.json(
        { error: "Average price must be a positive number" },
        { status: 400 }
      );
    }

    if (!purchased_at) {
      return NextResponse.json(
        { error: "Purchase date is required" },
        { status: 400 }
      );
    }

    const normalizedSymbol = symbol.trim().toUpperCase();

    // Verify portfolio belongs to user
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Add holding to portfolio
    const { data, error } = await supabase
      .from("holdings")
      .insert({
        portfolio_id: id,
        symbol: normalizedSymbol,
        shares: shares,
        avg_price: avg_price,
        purchased_at: purchased_at,
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding holding to portfolio:", error);
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

// PUT - Update a holding (e.g., add more shares, update average price)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const { holding_id, shares, avg_price, notes } = body;

    // Validate required fields
    if (!holding_id) {
      return NextResponse.json(
        { error: "Holding ID is required" },
        { status: 400 }
      );
    }

    // Verify portfolio belongs to user
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Verify holding belongs to this portfolio
    const { data: existingHolding, error: holdingError } = await supabase
      .from("holdings")
      .select("*")
      .eq("id", holding_id)
      .eq("portfolio_id", id)
      .single();

    if (holdingError || !existingHolding) {
      return NextResponse.json({ error: "Holding not found" }, { status: 404 });
    }

    // Build update object
    const updateData: {
      shares?: number;
      avg_price?: number;
      notes?: string | null;
    } = {};

    if (shares !== undefined) {
      if (typeof shares !== "number" || shares <= 0) {
        return NextResponse.json(
          { error: "Shares must be a positive number" },
          { status: 400 }
        );
      }
      updateData.shares = shares;
    }

    if (avg_price !== undefined) {
      if (typeof avg_price !== "number" || avg_price <= 0) {
        return NextResponse.json(
          { error: "Average price must be a positive number" },
          { status: 400 }
        );
      }
      updateData.avg_price = avg_price;
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null;
    }

    const { data, error } = await supabase
      .from("holdings")
      .update(updateData)
      .eq("id", holding_id)
      .eq("portfolio_id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating holding:", error);
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

// DELETE - Remove a holding from portfolio
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const { holding_id } = body;

    // Validate required fields
    if (!holding_id) {
      return NextResponse.json(
        { error: "Holding ID is required" },
        { status: 400 }
      );
    }

    // Verify portfolio belongs to user
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Verify holding belongs to this portfolio
    const { data: existingHolding, error: holdingError } = await supabase
      .from("holdings")
      .select("id")
      .eq("id", holding_id)
      .eq("portfolio_id", id)
      .single();

    if (holdingError || !existingHolding) {
      return NextResponse.json({ error: "Holding not found" }, { status: 404 });
    }

    // Delete the holding
    const { error } = await supabase
      .from("holdings")
      .delete()
      .eq("id", holding_id)
      .eq("portfolio_id", id);

    if (error) {
      console.error("Error removing holding from portfolio:", error);
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
