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
    const body = await request.json();
    const db = getDb();

    // Verify user exists
    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(id) as { id: string; username: string; role: string } | undefined;
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Prevent self-demotion/ban
    if (user.id === session.userId) {
      return NextResponse.json({ error: 'You cannot modify your own account from the admin panel.' }, { status: 400 });
    }

    // Handle role change
    if (body.role !== undefined) {
      const validRoles = ['admin', 'moderator', 'member'];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
      }
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(body.role, id);

      // Log action
      db.prepare(
        "INSERT INTO moderation_log (moderator_id, action, target_type, target_id, reason) VALUES (?, ?, 'user', ?, ?)"
      ).run(session.userId, `changed role to ${body.role}`, id, `Changed ${user.username}'s role to ${body.role}`);
    }

    // Handle ban/unban
    if (body.is_banned !== undefined) {
      const isBanned = body.is_banned ? 1 : 0;
      const banReason = body.ban_reason || '';

      db.prepare('UPDATE users SET is_banned = ?, ban_reason = ? WHERE id = ?').run(isBanned, banReason, id);

      const action = isBanned ? 'banned user' : 'unbanned user';
      db.prepare(
        "INSERT INTO moderation_log (moderator_id, action, target_type, target_id, reason) VALUES (?, ?, 'user', ?, ?)"
      ).run(session.userId, action, id, banReason || `${action}: ${user.username}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
