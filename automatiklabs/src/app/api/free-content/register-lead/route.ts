import { NextResponse } from 'next/server';
import { registerLeadSchema } from '@/features/free-content/schemas';
import { registerLead } from '@/features/free-content/services/lead-service';
import { setFCSession } from '@/features/free-content/services/cookie-service';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { createRateLimiter } from '@/shared/lib/rate-limit';

// 5 registrations per minute per IP — prevents spam
const rateLimit = createRateLimiter('register-lead', { limit: 5, windowMs: 60_000 });

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
    const result = registerLeadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    const { email, name, whatsapp } = result.data;
    const lead = await registerLead(email, name, whatsapp);

    // Set session cookie
    await setFCSession({
      email: lead.email,
      isStudent: false,
      createdAt: lead.createdAt,
    });

    // Log registration activity
    const supabase = createAdminClient();
    await supabase.from('lead_activity_log').insert({
      lead_email: lead.email,
      action: 'registered',
      metadata: { name, whatsapp },
    });

    return NextResponse.json({ ok: true, lead });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
