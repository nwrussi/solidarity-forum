import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || (session.role !== 'admin' && session.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const perPage = Math.min(50, Math.max(1, parseInt(url.searchParams.get('perPage') || '20', 10)));
    const search = url.searchParams.get('search') || '';
    const subforumId = url.searchParams.get('subforum_id') || '';
    const offset = (page - 1) * perPage;

    const db = getDb();

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push('t.title LIKE ?');
      params.push(`%${search}%`);
    }

    if (subforumId) {
      conditions.push('t.subforum_id = ?');
      params.push(parseInt(subforumId, 10));
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const total = (db.prepare(
      `SELECT COUNT(*) as c FROM threads t ${whereClause}`
    ).get(...params) as { c: number }).c;

    const threads = db.prepare(`
      SELECT t.*, u.username as author_username, s.name as subforum_name
      FROM threads t
      JOIN users u ON u.id = t.user_id
      JOIN subforums s ON s.id = t.subforum_id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, perPage, offset);

    // Get subforums for filter dropdown
    const subforums = db.prepare('SELECT id, name FROM subforums ORDER BY name ASC').all();

    return NextResponse.json({
      threads,
      subforums,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error('Admin threads list error:', error);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
