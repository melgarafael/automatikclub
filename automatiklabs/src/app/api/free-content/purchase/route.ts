import { NextResponse } from 'next/server';
import { purchaseContentSchema } from '@/features/free-content/schemas';
import { purchaseContent } from '@/features/free-content/services/content-service';
import { getFCSession } from '@/features/free-content/services/cookie-service';
import { createRateLimiter } from '@/shared/lib/rate-limit';

// 10 purchases per minute per IP — prevents rapid coin-drain attempts
const rateLimit = createRateLimiter('purchase', { limit: 10, windowMs: 60_000 });

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed, retryAfterMs } = rateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } },
      );
    }

    const session = await getFCSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const result = purchaseContentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    const { slug } = result.data;
    const response = await purchaseContent(session.email, slug);

    return NextResponse.json({ ok: true, ...response });
  } catch (e) {
    const message = (e as Error).message;
    if (message === 'Insufficient coins') {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
