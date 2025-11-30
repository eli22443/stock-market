import { NextResponse } from "next/server";

const categories = ["most-active", "trending", "gainers", "losers"];

/**
 * here i want return a table for each category on all stocks
 */

export async function GET() {
  return NextResponse.json({ categories });
}
export async function POST(req: Request) {
  return;
}
