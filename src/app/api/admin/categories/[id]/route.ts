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
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID.' }, { status: 400 });
    }

    const body = await request.json();
    const db = getDb();

    const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
    if (!category) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
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
    if (body.sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(body.sort_order);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    values.push(categoryId);
    db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin category update error:', error);
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
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID.' }, { status: 400 });
    }

    const db = getDb();

    // Check if category has subforums
    const subforumCount = (db.prepare(
      'SELECT COUNT(*) as c FROM subforums WHERE category_id = ?'
    ).get(categoryId) as { c: number }).c;

    if (subforumCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that contains subforums. Remove subforums first.' },
        { status: 400 }
      );
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(categoryId);

    db.prepare(
      "INSERT INTO moderation_log (moderator_id, action, target_type, target_id, reason) VALUES (?, ?, 'category', ?, ?)"
    ).run(session.userId, 'deleted category', String(categoryId), `Deleted category #${categoryId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin category delete error:', error);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
