import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

/**
 * Session data shape. We only store minimal info: user ID and username.
 * No PII, no email, no IP addresses.
 */
export interface SessionData {
  userId?: string;
  username?: string;
  role?: string;
  isLoggedIn?: boolean;
}

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET || 'solidarity-forum-secret-key-that-is-at-least-32-chars-long!',
  cookieName: 'solidarity_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days - persistent sessions
    path: '/',
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
  return session;
}
