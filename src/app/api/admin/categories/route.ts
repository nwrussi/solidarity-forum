import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const db = getDb();

    const categories = db.prepare(
      'SELECT * FROM categories ORDER BY sort_order ASC'
    ).all();

    const subforums = db.prepare(
      'SELECT * FROM subforums ORDER BY sort_order ASC'
    ).all();

    return NextResponse.json({ categories, subforums });
  } catch (error) {
    console.error('Admin categories list error:', error);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim().length < 1) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    const db = getDb();

    // Get max sort_order
    const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM categories').get() as { m: number | null }).m || 0;

    const result = db.prepare(
      'INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)'
    ).run(name.trim(), description || '', maxOrder + 1);

    db.prepare(
      "INSERT INTO moderation_log (moderator_id, action, target_type, target_id, reason) VALUES (?, ?, 'category', ?, ?)"
    ).run(session.userId, 'created category', String(result.lastInsertRowid), `Created category: ${name}`);

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch (error) {
    console.error('Admin create category error:', error);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
