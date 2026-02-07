import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 12;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: 'Password must be no longer than 128 characters.' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if username is taken (case-insensitive due to COLLATE NOCASE)
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return NextResponse.json(
        { error: 'Username is already taken.' },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = uuidv4();

    db.prepare(
      'INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)'
    ).run(userId, username, passwordHash);

    // Set session immediately (auto-login after registration)
    const session = await getSession();
    session.userId = userId;
    session.username = username;
    session.role = 'member';
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json(
      {
        success: true,
        user: {
          id: userId,
          username,
          role: 'member',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
