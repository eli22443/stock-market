import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { fetchYahooComprehensiveData } from "@/services/yahooFinance";

// GET - Get a specific portfolio with holdings and calculated values
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

  // Fetch portfolio
  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (portfolioError) {
    console.error("Error fetching portfolio:", portfolioError);
    if (portfolioError.code === "PGRST116") {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: portfolioError.message },
      { status: 500 }
    );
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

  // Fetch current prices and calculate values for each holding
  const holdingsWithCalculations = await Promise.all(
    (holdings || []).map(async (holding) => {
      try {
        const stockData = await fetchYahooComprehensiveData(holding.symbol);
        if (!stockData) {
          return {
            ...holding,
            current_price: null,
            current_value: null,
            cost_basis: null,
            gain_loss: null,
            gain_loss_percent: null,
          };
        }

        const currentPrice = stockData.currentPrice;
        const shares = parseFloat(holding.shares.toString());
        const avgPrice = parseFloat(holding.avg_price.toString());

        const currentValue = shares * currentPrice;
        const costBasis = shares * avgPrice;
        const gainLoss = currentValue - costBasis;
        const gainLossPercent =
          costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

        return {
          ...holding,
          current_price: currentPrice,
          current_value: currentValue,
          cost_basis: costBasis,
          gain_loss: gainLoss,
          gain_loss_percent: gainLossPercent,
        };
      } catch (error) {
        console.error(`Error fetching price for ${holding.symbol}:`, error);
        return {
          ...holding,
          current_price: null,
          current_value: null,
          cost_basis: null,
          gain_loss: null,
          gain_loss_percent: null,
        };
      }
    })
  );

  // Calculate portfolio totals
  const totalValue = holdingsWithCalculations.reduce(
    (sum, h) => sum + (h.current_value || 0),
    0
  );
  const totalCostBasis = holdingsWithCalculations.reduce(
    (sum, h) => sum + (h.cost_basis || 0),
    0
  );
  const totalGainLoss = totalValue - totalCostBasis;
  const totalGainLossPercent =
    totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

  return NextResponse.json({
    ...portfolio,
    holdings: holdingsWithCalculations,
    total_value: totalValue,
    total_cost_basis: totalCostBasis,
    total_gain_loss: totalGainLoss,
    total_gain_loss_percent: totalGainLossPercent,
  });
}

// PUT - Update portfolio name/description
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
    const { name, description } = body;

    // Verify portfolio belongs to user
    const { data: existingPortfolio, error: checkError } = await supabase
      .from("portfolios")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (checkError || !existingPortfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: {
      name?: string;
      description?: string | null;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Portfolio name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    const { data, error } = await supabase
      .from("portfolios")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating portfolio:", error);
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

// DELETE - Delete a portfolio (cascades to holdings via foreign key)
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

  // Verify portfolio belongs to user
  const { data: existingPortfolio, error: checkError } = await supabase
    .from("portfolios")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (checkError || !existingPortfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  // Delete portfolio (holdings will be cascade deleted)
  const { error } = await supabase
    .from("portfolios")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting portfolio:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
