import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  try {
    const body = await req.text();

    // TODO: Verify webhook signature with Stripe secret
    // TODO: Parse event and handle:
    //   - checkout.session.completed
    //   - customer.subscription.updated
    //   - customer.subscription.deleted
    //   - invoice.payment_failed

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
