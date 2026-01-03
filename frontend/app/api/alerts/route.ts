import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Implement get all alerts
  return NextResponse.json({ alerts: [] });
}

export async function POST(request: Request) {
  // TODO: Implement create alert
  return NextResponse.json({ message: "Not implemented" });
}

