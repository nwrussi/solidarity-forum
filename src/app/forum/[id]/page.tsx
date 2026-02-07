import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSubforum, getThreadsBySubforum } from '@/lib/queries';
import Breadcrumb from '@/components/Breadcrumb';
import ThreadRow from '@/components/ThreadRow';

export const dynamic = 'force-dynamic';

interface SubforumPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function SubforumPage({ params, searchParams }: SubforumPageProps) {
  const { id } = await params;
  const { page: pageStr } = await searchParams;
  const subforumId = parseInt(id, 10);

  if (isNaN(subforumId)) {
    notFound();
  }

  const subforum = getSubforum(subforumId);
  if (!subforum) {
    notFound();
  }

  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const perPage = 20;
  const { threads, total } = getThreadsBySubforum(subforumId, page, perPage);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Get category name from the subforum query (joined)
  const categoryName = (subforum as { category_name?: string }).category_name || 'Category';

  return (
    <div className="forum-container" style={{ paddingTop: '12px', paddingBottom: '24px' }}>
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: categoryName },
        { label: subforum.name },
      ]} />

      {/* Subforum header */}
      <div style={{ marginBottom: '12px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
          {subforum.name}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          {subforum.description}
        </p>
      </div>

      {/* Actions bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <Link href={`/new-thread?subforum=${subforumId}`} className="forum-btn">
          Post New Thread
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Page {page} of {totalPages} &middot; {total} thread{total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Thread listing */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
        {/* Column headers */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 12px',
          background: 'var(--category-header-bg)',
          color: 'var(--category-header-text)',
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          <div style={{ flex: '1' }}>Thread</div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ minWidth: '50px', textAlign: 'center' }}>Replies</div>
            <div style={{ minWidth: '50px', textAlign: 'center' }}>Views</div>
            <div style={{ minWidth: '120px', textAlign: 'right' }}>Last Post</div>
          </div>
        </div>

        {/* Thread rows */}
        {threads.length > 0 ? (
          threads.map((thread) => (
            <ThreadRow key={thread.id} thread={thread} />
          ))
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', background: 'var(--content-bg)', color: 'var(--text-muted)' }}>
            No threads yet. Be the first to start a discussion!
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{ justifyContent: 'center', marginTop: '12px' }}>
          {page > 1 && (
            <Link href={`/forum/${subforumId}?page=${page - 1}`}>&laquo; Prev</Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/forum/${subforumId}?page=${p}`}
              className={p === page ? 'active' : ''}
            >
              {p}
            </Link>
          ))}
          {page < totalPages && (
            <Link href={`/forum/${subforumId}?page=${page + 1}`}>Next &raquo;</Link>
          )}
        </div>
      )}
    </div>
  );
}
