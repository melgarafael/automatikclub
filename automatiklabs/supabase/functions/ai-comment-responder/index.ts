import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Edge Function: AI Comment Responder
 *
 * Triggered by pg_notify or cron to check for unanswered comments
 * older than the configured delay (default 30 minutes).
 *
 * Flow:
 * 1. Query comments that are:
 *    - On lessons with AI auto-reply enabled
 *    - Older than ai_auto_reply_delay_minutes
 *    - Not yet responded to by AI or human
 *    - Not AI-generated themselves (anti-loop)
 * 2. For each eligible comment, generate an AI response
 * 3. Insert the response as a new comment with is_ai_response=true
 *
 * Deployment: Deploy via `supabase functions deploy ai-comment-responder`
 * Trigger: pg_cron job or webhook from database trigger
 */

interface PlatformSetting {
  key: string;
  value: string;
}

Deno.serve(async (req) => {
  try {
    // ── Verify authorization ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Check if AI auto-reply is enabled ──
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["ai_auto_reply_enabled", "ai_auto_reply_delay_minutes"]);

    const settingsMap = new Map(
      (settings as PlatformSetting[] | null)?.map((s) => [s.key, s.value]) ?? []
    );

    const isEnabled = settingsMap.get("ai_auto_reply_enabled") === "true";
    const delayMinutes = Number(settingsMap.get("ai_auto_reply_delay_minutes") ?? 30);

    if (!isEnabled) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "AI auto-reply is disabled" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Find unanswered comments older than delay ──
    const cutoff = new Date(Date.now() - delayMinutes * 60_000).toISOString();

    const { data: eligibleComments, error: queryError } = await supabase
      .from("comments")
      .select("id, commentable_type, commentable_id, content, author_id, parent_id, depth")
      .eq("commentable_type", "lesson")
      .eq("is_ai_response", false)
      .eq("status", "approved")
      .lte("created_at", cutoff)
      .order("created_at", { ascending: true })
      .limit(10);

    if (queryError) {
      throw new Error(`Query error: ${queryError.message}`);
    }

    if (!eligibleComments || eligibleComments.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, reason: "No eligible comments" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Filter out comments that already have replies ──
    const commentIds = eligibleComments.map((c) => c.id);
    const { data: existingReplies } = await supabase
      .from("comments")
      .select("parent_id")
      .in("parent_id", commentIds);

    const repliedIds = new Set(
      (existingReplies ?? []).map((r) => r.parent_id)
    );

    const unanswered = eligibleComments.filter((c) => !repliedIds.has(c.id));

    // ── Process each unanswered comment ──
    // TODO: In production, call Claude API here for each comment.
    // For now, this is a structural placeholder that logs the intent.

    let processed = 0;

    for (const comment of unanswered) {
      // Placeholder: would call generateResponse() with lesson context
      // For now, skip actual AI generation in the edge function
      console.log(
        `[ai-comment-responder] Would generate AI response for comment ${comment.id} on lesson ${comment.commentable_id}`
      );
      processed++;
    }

    return new Response(
      JSON.stringify({
        processed,
        total_eligible: eligibleComments.length,
        total_unanswered: unanswered.length,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ai-comment-responder] Error:", error);
    return new Response(
      JSON.stringify({ error: "AI comment responder failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
