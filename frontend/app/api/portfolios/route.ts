import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Implement get all portfolios
  return NextResponse.json({ portfolios: [] });
}

export async function POST(request: Request) {
  // TODO: Implement create portfolio
  return NextResponse.json({ message: "Not implemented" });
}

