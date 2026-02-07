import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || (session.role !== 'admin' && session.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await params;
    const reportId = parseInt(id, 10);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID.' }, { status: 400 });
    }

    const body = await request.json();
    const db = getDb();

    const report = db.prepare('SELECT id, status FROM reports WHERE id = ?').get(reportId) as { id: number; status: string } | undefined;
    if (!report) {
      return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
    }

    if (body.status !== undefined) {
      const validStatuses = ['pending', 'reviewed', 'dismissed'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
      }

      db.prepare(
        "UPDATE reports SET status = ?, reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?"
      ).run(body.status, session.userId, reportId);

      db.prepare(
        "INSERT INTO moderation_log (moderator_id, action, target_type, target_id, reason) VALUES (?, ?, 'report', ?, ?)"
      ).run(session.userId, `${body.status} report`, String(reportId), `Report #${reportId} marked as ${body.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin report update error:', error);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
