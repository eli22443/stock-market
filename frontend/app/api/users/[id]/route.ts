import { NextResponse } from "next/server";

/**
 * GET/PUT/DELETE /api/users/:id
 * Note: User management is handled by Supabase Auth
 * These endpoints are placeholders for future user profile features
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // User management is handled by Supabase Auth
  // This endpoint can be used for future user profile features
  return NextResponse.json({ message: "Not implemented", id });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // User updates are handled by Supabase Auth
  // This endpoint can be used for future user profile features
  return NextResponse.json({ message: "Not implemented", id });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // User deletion is handled by Supabase Auth
  // This endpoint can be used for future user profile features
  return NextResponse.json({ message: "Not implemented", id });
}
