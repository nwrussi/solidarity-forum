import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Look up user by username (case-insensitive)
    const user = db.prepare(
      'SELECT id, username, password_hash, role, is_banned, ban_reason FROM users WHERE username = ?'
    ).get(username) as { id: string; username: string; password_hash: string; role: string; is_banned: number; ban_reason: string } | undefined;

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    // Check if user is banned
    if (user.is_banned) {
      return NextResponse.json(
        { error: `This account has been banned.${user.ban_reason ? ' Reason: ' + user.ban_reason : ''}` },
        { status: 403 }
      );
    }

    // Update last_seen
    db.prepare('UPDATE users SET last_seen = datetime(\'now\') WHERE id = ?').run(user.id);

    // Set session
    const session = await getSession();
    session.userId = user.id;
    session.username = user.username;
    session.role = user.role;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
