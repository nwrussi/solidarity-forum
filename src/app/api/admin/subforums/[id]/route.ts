import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await params;
    const subforumId = parseInt(id, 10);
    if (isNaN(subforumId)) {
      return NextResponse.json({ error: 'Invalid subforum ID.' }, { status: 400 });
    }

    const body = await request.json();
    const db = getDb();

    const subforum = db.prepare('SELECT id FROM subforums WHERE id = ?').get(subforumId);
    if (!subforum) {
      return NextResponse.json({ error: 'Subforum not found.' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name.trim());
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }
    if (body.icon_color !== undefined) {
      updates.push('icon_color = ?');
      values.push(body.icon_color);
    }
    if (body.icon_label !== undefined) {
      updates.push('icon_label = ?');
      values.push(body.icon_label);
    }
    if (body.sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(body.sort_order);
    }
    if (body.category_id !== undefined) {
      const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(body.category_id);
      if (!cat) {
        return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
      }
      updates.push('category_id = ?');
      values.push(body.category_id);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    values.push(subforumId);
    db.prepare(`UPDATE subforums SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin subforum update error:', error);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await params;
    const subforumId = parseInt(id, 10);
    if (isNaN(subforumId)) {
      return NextResponse.json({ error: 'Invalid subforum ID.' }, { status: 400 });
    }

    const db = getDb();

    // Check if subforum has threads
    const threadCount = (db.prepare(
      'SELECT COUNT(*) as c FROM threads WHERE subforum_id = ?'
    ).get(subforumId) as { c: number }).c;

    if (threadCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete subforum that contains threads. Move or delete threads first.' },
        { status: 400 }
      );
    }

    db.prepare('DELETE FROM subforums WHERE id = ?').run(subforumId);

    db.prepare(
      "INSERT INTO moderation_log (moderator_id, action, target_type, target_id, reason) VALUES (?, ?, 'subforum', ?, ?)"
    ).run(session.userId, 'deleted subforum', String(subforumId), `Deleted subforum #${subforumId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin subforum delete error:', error);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
