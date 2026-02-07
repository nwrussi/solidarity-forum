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
    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID.' }, { status: 400 });
    }

    const body = await request.json();
    const db = getDb();

    const post = db.prepare('SELECT id, content FROM posts WHERE id = ?').get(postId) as { id: number; content: string } | undefined;
    if (!post) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    if (body.content !== undefined) {
      if (!body.content || body.content.length < 1) {
        return NextResponse.json({ error: 'Content cannot be empty.' }, { status: 400 });
      }

      db.prepare(
        "UPDATE posts SET content = ?, edited_at = datetime('now'), is_edited = 1 WHERE id = ?"
      ).run(body.content, postId);

      db.prepare(
        "INSERT INTO moderation_log (moderator_id, action, target_type, target_id, reason) VALUES (?, ?, 'post', ?, ?)"
      ).run(session.userId, 'edited post', String(postId), 'Moderator edited post content');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin post update error:', error);
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
    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID.' }, { status: 400 });
    }

    const db = getDb();

    const post = db.prepare(`
      SELECT p.id, p.thread_id, t.subforum_id, t.user_id as thread_author_id
      FROM posts p
      JOIN threads t ON t.id = p.thread_id
      WHERE p.id = ?
    `).get(postId) as { id: number; thread_id: number; subforum_id: number; thread_author_id: string } | undefined;

    if (!post) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    // Check if this is the first post in the thread (OP) -- if so, delete the whole thread
    const firstPost = db.prepare(
      'SELECT id FROM posts WHERE thread_id = ? ORDER BY created_at ASC LIMIT 1'
    ).get(post.thread_id) as { id: number } | undefined;

    const isOP = firstPost && firstPost.id === postId;

    const deletePost = db.transaction(() => {
      if (isOP) {
        // Deleting OP means deleting the entire thread
        const postCount = (db.prepare('SELECT COUNT(*) as c FROM posts WHERE thread_id = ?').get(post.thread_id) as { c: number }).c;
        db.prepare('DELETE FROM reports WHERE post_id IN (SELECT id FROM posts WHERE thread_id = ?)').run(post.thread_id);
        db.prepare('DELETE FROM reactions WHERE post_id IN (SELECT id FROM posts WHERE thread_id = ?)').run(post.thread_id);
        db.prepare('DELETE FROM posts WHERE thread_id = ?').run(post.thread_id);
        db.prepare('DELETE FROM threads WHERE id = ?').run(post.thread_id);

        db.prepare(`
          UPDATE subforums SET
            thread_count = MAX(0, thread_count - 1),
            post_count = MAX(0, post_count - ?)
          WHERE id = ?
        `).run(postCount, post.subforum_id);
      } else {
        // Delete just this post
        db.prepare('DELETE FROM reports WHERE post_id = ?').run(postId);
        db.prepare('DELETE FROM reactions WHERE post_id = ?').run(postId);
        db.prepare('DELETE FROM posts WHERE id = ?').run(postId);

        // Update thread reply count
        db.prepare('UPDATE threads SET reply_count = MAX(0, reply_count - 1) WHERE id = ?').run(post.thread_id);

        // Update subforum post count
        db.prepare('UPDATE subforums SET post_count = MAX(0, post_count - 1) WHERE id = ?').run(post.subforum_id);
      }
    });

    deletePost();

    db.prepare(
      "INSERT INTO moderation_log (moderator_id, action, target_type, target_id, reason) VALUES (?, ?, 'post', ?, ?)"
    ).run(session.userId, isOP ? 'deleted thread (via OP post)' : 'deleted post', String(postId), `Post #${postId} deleted`);

    return NextResponse.json({ success: true, threadDeleted: isOP });
  } catch (error) {
    console.error('Admin post delete error:', error);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
