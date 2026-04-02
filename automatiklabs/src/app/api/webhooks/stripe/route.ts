import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  // TODO: Verify Stripe webhook signature
  // TODO: Handle event types (checkout.session.completed, etc.)

  return NextResponse.json({ received: true });
}
