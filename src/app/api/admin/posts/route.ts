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
    const userId = url.searchParams.get('user_id') || '';
    const offset = (page - 1) * perPage;

    const db = getDb();

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push('p.content LIKE ?');
      params.push(`%${search}%`);
    }

    if (userId) {
      conditions.push('p.user_id = ?');
      params.push(userId);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const total = (db.prepare(
      `SELECT COUNT(*) as c FROM posts p ${whereClause}`
    ).get(...params) as { c: number }).c;

    const posts = db.prepare(`
      SELECT p.*, u.username as author_username, t.title as thread_title, t.id as thread_id
      FROM posts p
      JOIN users u ON u.id = p.user_id
      JOIN threads t ON t.id = p.thread_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, perPage, offset);

    return NextResponse.json({
      posts,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error('Admin posts list error:', error);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
