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
    const threadId = parseInt(id, 10);
    if (isNaN(threadId)) {
      return NextResponse.json({ error: 'Invalid thread ID.' }, { status: 400 });
    }

    const body = await request.json();
    const db = getDb();

    const thread = db.prepare('SELECT id, title FROM threads WHERE id = ?').get(threadId) as { id: number; title: string } | undefined;
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found.' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (body.is_sticky !== undefined) {
      updates.push('is_sticky = ?');
      values.push(body.is_sticky ? 1 : 0);
    }

    if (body.is_locked !== undefined) {
      updates.push('is_locked = ?');
      values.push(body.is_locked ? 1 : 0);
    }

    if (body.subforum_id !== undefined) {
      // Verify subforum exists
      const sf = db.prepare('SELECT id FROM subforums WHERE id = ?').get(body.subforum_id);
      if (!sf) {
        return NextResponse.json({ error: 'Target subforum not found.' }, { status: 400 });
      }
      updates.push('subforum_id = ?');
      values.push(body.subforum_id);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    values.push(threadId);
    db.prepare(`UPDATE threads SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    // Build log action description
    const actions: string[] = [];
    if (body.is_sticky !== undefined) actions.push(body.is_sticky ? 'stickied' : 'unstickied');
    if (body.is_locked !== undefined) actions.push(body.is_locked ? 'locked' : 'unlocked');
    if (body.subforum_id !== undefined) actions.push('moved');

    db.prepare(
      "INSERT INTO moderation_log (moderator_id, action, target_type, target_id, reason) VALUES (?, ?, 'thread', ?, ?)"
    ).run(session.userId, actions.join(', '), String(threadId), `Thread: ${thread.title}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin thread update error:', error);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || (session.role !== 'admin' && session.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await params;
    const threadId = parseInt(id, 10);
    if (isNaN(threadId)) {
      return NextResponse.json({ error: 'Invalid thread ID.' }, { status: 400 });
    }

    const db = getDb();

    const thread = db.prepare('SELECT id, title, subforum_id, reply_count FROM threads WHERE id = ?').get(threadId) as { id: number; title: string; subforum_id: number; reply_count: number } | undefined;
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found.' }, { status: 404 });
    }

    // Delete in transaction: reports on posts, reactions, posts, then thread
    const deleteThread = db.transaction(() => {
      // Delete reports referencing posts in this thread
      db.prepare('DELETE FROM reports WHERE post_id IN (SELECT id FROM posts WHERE thread_id = ?)').run(threadId);
      // Delete reactions on posts in this thread
      db.prepare('DELETE FROM reactions WHERE post_id IN (SELECT id FROM posts WHERE thread_id = ?)').run(threadId);
      // Delete posts
      const postCount = (db.prepare('SELECT COUNT(*) as c FROM posts WHERE thread_id = ?').get(threadId) as { c: number }).c;
      db.prepare('DELETE FROM posts WHERE thread_id = ?').run(threadId);
      // Delete thread
      db.prepare('DELETE FROM threads WHERE id = ?').run(threadId);

      // Update subforum counts
      db.prepare(`
        UPDATE subforums SET
          thread_count = MAX(0, thread_count - 1),
          post_count = MAX(0, post_count - ?)
        WHERE id = ?
      `).run(postCount, thread.subforum_id);
    });

    deleteThread();

    // Log action
    db.prepare(
      "INSERT INTO moderation_log (moderator_id, action, target_type, target_id, reason) VALUES (?, ?, 'thread', ?, ?)"
    ).run(session.userId, 'deleted thread', String(threadId), `Deleted thread: ${thread.title}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin thread delete error:', error);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
