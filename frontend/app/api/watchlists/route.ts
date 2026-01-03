import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Implement get all watchlists
  return NextResponse.json({ watchlists: [] });
}

export async function POST(request: Request) {
  // TODO: Implement create watchlist
  return NextResponse.json({ message: "Not implemented" });
}

