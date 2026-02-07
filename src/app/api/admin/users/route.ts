import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const perPage = Math.min(50, Math.max(1, parseInt(url.searchParams.get('perPage') || '20', 10)));
    const search = url.searchParams.get('search') || '';
    const offset = (page - 1) * perPage;

    const db = getDb();

    let whereClause = '';
    const params: (string | number)[] = [];

    if (search) {
      whereClause = 'WHERE u.username LIKE ?';
      params.push(`%${search}%`);
    }

    const total = (db.prepare(
      `SELECT COUNT(*) as c FROM users u ${whereClause}`
    ).get(...params) as { c: number }).c;

    const users = db.prepare(`
      SELECT u.id, u.username, u.role, u.created_at, u.post_count, u.reputation_score,
             u.last_seen, u.is_banned, u.ban_reason, u.bio
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, perPage, offset);

    return NextResponse.json({
      users,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
