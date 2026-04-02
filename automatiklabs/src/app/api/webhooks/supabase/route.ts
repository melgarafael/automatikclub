import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();

  // TODO: Verify Supabase webhook signature
  // TODO: Handle database change events

  return NextResponse.json({ received: true });
}
