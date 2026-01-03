import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO: Implement get watchlist items
  return NextResponse.json({ items: [], watchlistId: id });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO: Implement add item to watchlist
  return NextResponse.json({ message: "Not implemented", watchlistId: id });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO: Implement remove item from watchlist
  return NextResponse.json({ message: "Not implemented", watchlistId: id });
}

