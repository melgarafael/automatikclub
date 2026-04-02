import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  try {
    const { type, userId, data } = await req.json();

    // TODO: Route notification by type:
    //   - "email" -> Resend API
    //   - "push" -> Web Push API
    //   - "in_app" -> Insert into notifications table

    return new Response(JSON.stringify({ sent: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to send notification" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
