import { NextResponse } from "next/server";

/**
 * GET/PUT/DELETE /api/users/:id
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO: Implement get user by id
  return NextResponse.json({ message: "Not implemented", id });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO: Implement user update
  return NextResponse.json({ message: "Not implemented", id });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO: Implement user deletion
  return NextResponse.json({ message: "Not implemented", id });
}
