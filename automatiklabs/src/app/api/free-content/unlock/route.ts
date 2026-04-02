import { NextResponse } from 'next/server';
import { unlockContentSchema } from '@/features/free-content/schemas';
import { unlockContent } from '@/features/free-content/services/content-service';
import { getFCSession } from '@/features/free-content/services/cookie-service';
import { createAdminClient } from '@/shared/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const session = await getFCSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const result = unlockContentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    const { slug, key } = result.data;

    // Verify isStudent server-side (never trust cookie)
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.email)
      .single();
    const isStudent = !!profile;

    const response = await unlockContent(
      session.email,
      slug,
      key,
      isStudent,
    );

    return NextResponse.json(response);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
