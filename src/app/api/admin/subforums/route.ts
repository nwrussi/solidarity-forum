import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    const { category_id, name, description, icon_color, icon_label } = body;

    if (!category_id || !name || name.trim().length < 1) {
      return NextResponse.json({ error: 'Category and name are required.' }, { status: 400 });
    }

    const db = getDb();

    // Verify category exists
    const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    // Get max sort_order for this category
    const maxOrder = (db.prepare(
      'SELECT MAX(sort_order) as m FROM subforums WHERE category_id = ?'
    ).get(category_id) as { m: number | null }).m || 0;

    const result = db.prepare(`
      INSERT INTO subforums (category_id, name, description, sort_order, icon_color, icon_label)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      category_id,
      name.trim(),
      description || '',
      maxOrder + 1,
      icon_color || '#4A9B9B',
      icon_label || name.trim().substring(0, 2).toUpperCase()
    );

    db.prepare(
      "INSERT INTO moderation_log (moderator_id, action, target_type, target_id, reason) VALUES (?, ?, 'subforum', ?, ?)"
    ).run(session.userId, 'created subforum', String(result.lastInsertRowid), `Created subforum: ${name}`);

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch (error) {
    console.error('Admin create subforum error:', error);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
