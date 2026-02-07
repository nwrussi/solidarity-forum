import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'You must be logged in to reply.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { threadId, content } = body;

    if (!threadId || !content) {
      return NextResponse.json(
        { error: 'Thread ID and content are required.' },
        { status: 400 }
      );
    }

    if (content.length < 1 || content.length > 50000) {
      return NextResponse.json(
        { error: 'Content must be between 1 and 50,000 characters.' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check thread exists and is not locked
    const thread = db.prepare(
      'SELECT id, subforum_id, is_locked FROM threads WHERE id = ?'
    ).get(threadId) as { id: number; subforum_id: number; is_locked: number } | undefined;

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found.' },
        { status: 404 }
      );
    }

    if (thread.is_locked) {
      return NextResponse.json(
        { error: 'This thread is locked.' },
        { status: 403 }
      );
    }

    // Create post and update counters in a transaction
    const createPost = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO posts (thread_id, user_id, content)
        VALUES (?, ?, ?)
      `).run(threadId, session.userId, content);

      const postId = Number(result.lastInsertRowid);

      // Update thread
      db.prepare(`
        UPDATE threads SET
          reply_count = reply_count + 1,
          last_post_at = datetime('now'),
          last_post_user_id = ?,
          last_post_username = ?
        WHERE id = ?
      `).run(session.userId, session.username, threadId);

      // Update subforum
      db.prepare(`
        UPDATE subforums SET
          post_count = post_count + 1,
          last_thread_id = ?,
          last_post_at = datetime('now'),
          last_post_username = ?
        WHERE id = ?
      `).run(threadId, session.username, thread.subforum_id);

      // Update user post count
      db.prepare('UPDATE users SET post_count = post_count + 1 WHERE id = ?')
        .run(session.userId);

      return postId;
    });

    const postId = createPost();

    return NextResponse.json(
      { success: true, postId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
