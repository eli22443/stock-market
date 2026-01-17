import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

// GET - Fetch a specific alert
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const headersList = await headers();
  const { id } = await params;

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

  // Fetch the alert
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }
    console.error("Error fetching alert:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT - Update an alert
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const headersList = await headers();
  const { id } = await params;

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
    const { symbol, alert_type, threshold, is_active, triggered_at } = body;

    // First, verify the alert belongs to the user
    const { data: existingAlert, error: fetchError } = await supabase
      .from("alerts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateData: any = {};

    if (symbol !== undefined) {
      if (typeof symbol !== "string" || symbol.trim().length === 0) {
        return NextResponse.json(
          { error: "Symbol must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.symbol = symbol.trim().toUpperCase();
    }

    if (alert_type !== undefined) {
      const validAlertTypes = [
        "price_above",
        "price_below",
        "price_change_percent",
        "volume_spike",
      ];
      if (!validAlertTypes.includes(alert_type)) {
        return NextResponse.json(
          {
            error: `Invalid alert_type. Must be one of: ${validAlertTypes.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updateData.alert_type = alert_type;
    }

    if (threshold !== undefined) {
      const thresholdNum = parseFloat(threshold);
      if (isNaN(thresholdNum) || thresholdNum <= 0) {
        return NextResponse.json(
          { error: "Threshold must be a positive number" },
          { status: 400 }
        );
      }

      // Additional validation for price_change_percent
      const finalAlertType = alert_type || existingAlert.alert_type;
      if (finalAlertType === "price_change_percent") {
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
      updateData.threshold = thresholdNum;
    }

    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
    }

    // Allow clearing triggered_at by setting it to null, or setting a new value
    if (triggered_at !== undefined) {
      if (triggered_at === null) {
        updateData.triggered_at = null;
      } else {
        // Validate it's a valid date string
        const date = new Date(triggered_at);
        if (isNaN(date.getTime())) {
          return NextResponse.json(
            { error: "Invalid triggered_at date format" },
            { status: 400 }
          );
        }
        updateData.triggered_at = date.toISOString();
      }
    }

    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Update the alert
    const { data, error: updateError } = await supabase
      .from("alerts")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating alert:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
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

// DELETE - Delete an alert
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const headersList = await headers();
  const { id } = await params;

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

  // First, verify the alert belongs to the user
  const { data: existingAlert, error: fetchError } = await supabase
    .from("alerts")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existingAlert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  // Delete the alert
  const { error: deleteError } = await supabase
    .from("alerts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Error deleting alert:", deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
