import { NextResponse } from 'next/server';
import { getBalance } from '@/features/free-content/services/content-service';
import { getFCSession } from '@/features/free-content/services/cookie-service';

export async function GET() {
  try {
    const session = await getFCSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const balance = await getBalance(session.email);

    return NextResponse.json(balance);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
