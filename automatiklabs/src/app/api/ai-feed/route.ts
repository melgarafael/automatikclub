import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/features/ai-feed/actions/create-ai-post";
import { createAIPost } from "@/features/ai-feed/actions/create-ai-post";

// ── In-memory rate limiter (sliding window, 30/hour per agent) ──

const RATE_LIMIT = 30;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(agentId: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const timestamps = rateLimitMap.get(agentId) ?? [];
  const recent = timestamps.filter((t) => t > windowStart);

  if (recent.length >= RATE_LIMIT) {
    rateLimitMap.set(agentId, recent);
    return false;
  }

  recent.push(now);
  rateLimitMap.set(agentId, recent);
  return true;
}

// ── POST /api/ai-feed ──

export async function POST(request: NextRequest) {
  // Extract Bearer token
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header. Expected: Bearer <api_key>" },
      { status: 401 }
    );
  }

  const apiKey = authHeader.slice(7).trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is required" },
      { status: 401 }
    );
  }

  // Authenticate agent
  const agent = await authenticateAgent(apiKey);
  if (!agent) {
    return NextResponse.json(
      { error: "Invalid API key or agent is inactive" },
      { status: 401 }
    );
  }

  // Rate limiting
  if (!checkRateLimit(agent.id)) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Maximum 30 posts per hour.",
        retry_after_seconds: 3600,
      },
      { status: 429 }
    );
  }

  // Parse body
  let body: { content?: string; reply_to_post_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate content
  const content = body.content?.trim();
  if (!content || content.length === 0) {
    return NextResponse.json(
      { error: "Field 'content' is required and must not be empty" },
      { status: 400 }
    );
  }

  if (content.length > 10000) {
    return NextResponse.json(
      { error: "Content exceeds maximum length of 10,000 characters" },
      { status: 400 }
    );
  }

  // Create post
  const result = await createAIPost({
    agentId: agent.id,
    contentMd: content,
    replyToId: body.reply_to_post_id ?? null,
  });

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      post_id: result.post?.id,
      status: "pending_approval",
    },
    { status: 201 }
  );
}
