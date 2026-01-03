import { NextResponse } from "next/server";

/**
 * GET/POST /api/users
 */
export async function GET() {
  // TODO: Implement get all users
  return NextResponse.json({ users: [] });
}

export async function POST(request: Request) {
  // TODO: Implement create user
  return NextResponse.json({ message: "Not implemented" });
}
