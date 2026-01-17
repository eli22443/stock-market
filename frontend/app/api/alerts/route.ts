import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

// GET - Fetch all alerts for the current user
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
    .from("alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST - Create a new alert
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
    const { symbol, alert_type, threshold, is_active } = body;

    // Validate required fields
    if (!symbol || typeof symbol !== "string" || symbol.trim().length === 0) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    // Validate alert_type
    const validAlertTypes = [
      "price_above",
      "price_below",
      "price_change_percent",
      "volume_spike",
    ];
    if (!alert_type || !validAlertTypes.includes(alert_type)) {
      return NextResponse.json(
        {
          error: `Invalid alert_type. Must be one of: ${validAlertTypes.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Validate threshold
    const thresholdNum = parseFloat(threshold);
    if (isNaN(thresholdNum) || thresholdNum <= 0) {
      return NextResponse.json(
        { error: "Threshold must be a positive number" },
        { status: 400 }
      );
    }

    // Additional validation for price_change_percent
    if (alert_type === "price_change_percent") {
      if (thresholdNum > 100 || thresholdNum < -100) {
        return NextResponse.json(
          {
            error:
              "Price change percent threshold must be between -100 and 100",
          },
          { status: 400 }
        );
      }
    }

    // Validate symbol exists (optional - can be done via API call to /api/quote)
    // For now, we'll just normalize the symbol
    const normalizedSymbol = symbol.trim().toUpperCase();

    const { data, error } = await supabase
      .from("alerts")
      .insert({
        user_id: user.id,
        symbol: normalizedSymbol,
        alert_type,
        threshold: thresholdNum,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating alert:", error);
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
