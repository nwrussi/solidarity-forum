import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'You must be logged in to create a thread.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subforumId, title, content } = body;

    if (!subforumId || !title || !content) {
      return NextResponse.json(
        { error: 'Subforum, title, and content are required.' },
        { status: 400 }
      );
    }

    if (title.length < 3 || title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be between 3 and 200 characters.' },
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

    // Check subforum exists
    const subforum = db.prepare('SELECT id FROM subforums WHERE id = ?').get(subforumId);
    if (!subforum) {
      return NextResponse.json(
        { error: 'Subforum not found.' },
        { status: 404 }
      );
    }

    // Create thread and first post in a transaction
    const createThread = db.transaction(() => {
      const threadResult = db.prepare(`
        INSERT INTO threads (subforum_id, user_id, title, last_post_user_id, last_post_username)
        VALUES (?, ?, ?, ?, ?)
      `).run(subforumId, session.userId, title, session.userId, session.username);

      const threadId = Number(threadResult.lastInsertRowid);

      // Create the opening post
      db.prepare(`
        INSERT INTO posts (thread_id, user_id, content)
        VALUES (?, ?, ?)
      `).run(threadId, session.userId, content);

      // Update subforum stats
      db.prepare(`
        UPDATE subforums SET
          thread_count = thread_count + 1,
          post_count = post_count + 1,
          last_thread_id = ?,
          last_post_at = datetime('now'),
          last_post_username = ?
        WHERE id = ?
      `).run(threadId, session.username, subforumId);

      // Update user post count
      db.prepare('UPDATE users SET post_count = post_count + 1 WHERE id = ?')
        .run(session.userId);

      return threadId;
    });

    const threadId = createThread();

    return NextResponse.json(
      { success: true, threadId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create thread error:', error);
    return NextResponse.json(
      { error: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
