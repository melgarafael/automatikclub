import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'fc_session';
const ACTIVE_COOKIE = 'fc_active'; // client-readable flag
const SECRET = new TextEncoder().encode(process.env.FC_SESSION_SECRET!);
const MAX_AGE = 365 * 24 * 60 * 60; // 1 year

if (!process.env.FC_SESSION_SECRET) {
  console.error('[CRITICAL] FC_SESSION_SECRET is required. Set it in .env');
}

export interface FCSession {
  email: string;
  isStudent: boolean;
  createdAt: string;
}

export async function setFCSession(session: FCSession): Promise<void> {
  const cookieStore = await cookies();
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('365d')
    .sign(SECRET);

  // Secure httpOnly cookie for server-side auth
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });

  // Non-sensitive flag for client-side detection
  cookieStore.set(ACTIVE_COOKIE, '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
}

export async function getFCSession(): Promise<FCSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      email: payload.email as string,
      isStudent: payload.isStudent as boolean,
      createdAt: payload.createdAt as string,
    };
  } catch {
    return null;
  }
}

export async function clearFCSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(ACTIVE_COOKIE);
}
