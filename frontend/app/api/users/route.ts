import { NextResponse } from "next/server";

/**
 * GET/POST /api/users
 * Note: User management is handled by Supabase Auth
 * These endpoints are placeholders for future user profile features
 */
export async function GET() {
  // User management is handled by Supabase Auth
  // This endpoint can be used for future user profile features
  return NextResponse.json({ users: [] });
}

export async function POST(request: Request) {
  // User creation is handled by Supabase Auth
  // This endpoint can be used for future user profile features
  return NextResponse.json({ message: "Not implemented" });
}
