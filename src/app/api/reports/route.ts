import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'You must be logged in to report a post.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { postId, reason } = body;

    if (!postId || !reason) {
      return NextResponse.json(
        { error: 'Post ID and reason are required.' },
        { status: 400 }
      );
    }

    if (reason.length < 5 || reason.length > 1000) {
      return NextResponse.json(
        { error: 'Reason must be between 5 and 1000 characters.' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify post exists
    const post = db.prepare('SELECT id, user_id FROM posts WHERE id = ?').get(postId) as { id: number; user_id: string } | undefined;
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found.' },
        { status: 404 }
      );
    }

    // Prevent self-reporting
    if (post.user_id === session.userId) {
      return NextResponse.json(
        { error: 'You cannot report your own post.' },
        { status: 400 }
      );
    }

    // Check for duplicate pending reports from same user on same post
    const existing = db.prepare(
      "SELECT id FROM reports WHERE post_id = ? AND reporter_id = ? AND status = 'pending'"
    ).get(postId, session.userId);

    if (existing) {
      return NextResponse.json(
        { error: 'You have already reported this post.' },
        { status: 409 }
      );
    }

    db.prepare(
      'INSERT INTO reports (post_id, reporter_id, reason) VALUES (?, ?, ?)'
    ).run(postId, session.userId, reason);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Report submit error:', error);
    return NextResponse.json(
      { error: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
