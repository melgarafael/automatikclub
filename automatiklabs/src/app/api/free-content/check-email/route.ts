import { NextResponse } from 'next/server';
import { checkEmailSchema } from '@/features/free-content/schemas';
import { checkEmail } from '@/features/free-content/services/lead-service';
import { setFCSession } from '@/features/free-content/services/cookie-service';
import { createRateLimiter } from '@/shared/lib/rate-limit';

// 10 checks per minute per IP — prevents email enumeration
const rateLimit = createRateLimiter('check-email', { limit: 10, windowMs: 60_000 });

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

    const body = await request.json();
    const result = checkEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    const { email } = result.data;
    const response = await checkEmail(email);

    // Set session cookie for returning users
    if (response.status === 'student') {
      await setFCSession({
        email,
        isStudent: true,
        createdAt: new Date().toISOString(),
      });
    } else if (response.status === 'lead' && response.lead) {
      await setFCSession({
        email,
        isStudent: false,
        createdAt: response.lead.createdAt,
      });
    }

    return NextResponse.json(response);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
