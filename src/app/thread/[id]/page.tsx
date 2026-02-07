import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getThread, getPostsByThread } from '@/lib/queries';
import Breadcrumb from '@/components/Breadcrumb';
import PostView from '@/components/PostView';
import ReplyForm from '@/components/ReplyForm';
import ThreadModTools from '@/components/ThreadModTools';

export const dynamic = 'force-dynamic';

interface ThreadPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function ThreadPage({ params, searchParams }: ThreadPageProps) {
  const { id } = await params;
  const { page: pageStr } = await searchParams;
  const threadId = parseInt(id, 10);

  if (isNaN(threadId)) {
    notFound();
  }

  const thread = getThread(threadId);
  if (!thread) {
    notFound();
  }

  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const perPage = 20;
  const { posts, total } = getPostsByThread(threadId, page, perPage);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="forum-container" style={{ paddingTop: '12px', paddingBottom: '24px' }}>
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: thread.category_name || 'Category' },
        { label: thread.subforum_name || 'Subforum', href: `/forum/${thread.subforum_id}` },
        { label: thread.title },
      ]} />

      {/* Thread header */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {thread.is_sticky === 1 && (
            <span style={{
              background: 'var(--accent-orange)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '2px',
              textTransform: 'uppercase',
            }}>
              Sticky
            </span>
          )}
          {thread.is_locked === 1 && (
            <span style={{
              background: 'var(--accent-red)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '2px',
              textTransform: 'uppercase',
            }}>
              Locked
            </span>
          )}
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            {thread.title}
          </h1>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Started by{' '}
          <Link href={`/profile/${thread.author_username}`} style={{ color: 'var(--text-secondary)' }}>
            {thread.author_username}
          </Link>
          {' '}&middot; {thread.reply_count} replies &middot; {thread.view_count} views
        </div>
      </div>

      {/* Moderation tools (visible only to admins/mods) */}
      <ThreadModTools threadId={threadId} isSticky={thread.is_sticky === 1} isLocked={thread.is_locked === 1} />

      {/* Page info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Page {page} of {totalPages}
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            {page > 1 && (
              <Link href={`/thread/${threadId}?page=${page - 1}`}>&laquo;</Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/thread/${threadId}?page=${p}`}
                className={p === page ? 'active' : ''}
              >
                {p}
              </Link>
            ))}
            {page < totalPages && (
              <Link href={`/thread/${threadId}?page=${page + 1}`}>&raquo;</Link>
            )}
          </div>
        )}
      </div>

      {/* Posts */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
        {posts.map((post, index) => (
          <PostView
            key={post.id}
            post={post}
            isOP={index === 0 && page === 1}
            threadId={threadId}
          />
        ))}
      </div>

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{ justifyContent: 'center', marginTop: '12px' }}>
          {page > 1 && (
            <Link href={`/thread/${threadId}?page=${page - 1}`}>&laquo; Prev</Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/thread/${threadId}?page=${p}`}
              className={p === page ? 'active' : ''}
            >
              {p}
            </Link>
          ))}
          {page < totalPages && (
            <Link href={`/thread/${threadId}?page=${page + 1}`}>Next &raquo;</Link>
          )}
        </div>
      )}

      {/* Reply form */}
      <ReplyForm threadId={threadId} isLocked={thread.is_locked === 1} />
    </div>
  );
}
