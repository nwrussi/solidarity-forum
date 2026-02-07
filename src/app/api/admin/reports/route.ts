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
    const status = url.searchParams.get('status') || '';
    const offset = (page - 1) * perPage;

    const db = getDb();

    let whereClause = '';
    const params: (string | number)[] = [];

    if (status) {
      whereClause = 'WHERE r.status = ?';
      params.push(status);
    }

    const total = (db.prepare(
      `SELECT COUNT(*) as c FROM reports r ${whereClause}`
    ).get(...params) as { c: number }).c;

    const reports = db.prepare(`
      SELECT r.*,
             reporter.username as reporter_username,
             p.content as post_content,
             p.thread_id as thread_id,
             author.username as post_author_username,
             author.id as post_author_id,
             t.title as thread_title,
             reviewer.username as reviewer_username
      FROM reports r
      JOIN users reporter ON reporter.id = r.reporter_id
      JOIN posts p ON p.id = r.post_id
      JOIN users author ON author.id = p.user_id
      JOIN threads t ON t.id = p.thread_id
      LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by
      ${whereClause}
      ORDER BY
        CASE r.status WHEN 'pending' THEN 0 ELSE 1 END ASC,
        r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, perPage, offset);

    return NextResponse.json({
      reports,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error('Admin reports list error:', error);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
