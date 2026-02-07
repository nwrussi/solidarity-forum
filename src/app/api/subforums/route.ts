import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const subforums = db.prepare(`
      SELECT s.id, s.name, c.name as category_name
      FROM subforums s
      JOIN categories c ON c.id = s.category_id
      ORDER BY c.sort_order ASC, s.sort_order ASC
    `).all();

    return NextResponse.json({ subforums });
  } catch (error) {
    console.error('Fetch subforums error:', error);
    return NextResponse.json({ subforums: [] }, { status: 500 });
  }
}
