'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';

interface AdminThread {
  id: number;
  title: string;
  subforum_id: number;
  subforum_name: string;
  author_username: string;
  created_at: string;
  reply_count: number;
  view_count: number;
  is_sticky: number;
  is_locked: number;
}

interface SubforumOption {
  id: number;
  name: string;
}

export default function AdminThreadsPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<AdminThread[]>([]);
  const [subforums, setSubforums] = useState<SubforumOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterSubforum, setFilterSubforum] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Move modal
  const [moveModal, setMoveModal] = useState<{ threadId: number; title: string; currentSubforum: number } | null>(null);
  const [moveTarget, setMoveTarget] = useState('');

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: '20' });
      if (search) params.set('search', search);
      if (filterSubforum) params.set('subforum_id', filterSubforum);

      const res = await fetch(`/api/admin/threads?${params}`);
      if (res.status === 403) { router.push('/'); return; }
      const data = await res.json();
      setThreads(data.threads || []);
      setSubforums(data.subforums || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setError('Failed to load threads.');
    }
    setLoading(false);
  }, [page, search, filterSubforum, router]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleToggle = async (threadId: number, field: 'is_sticky' | 'is_locked', currentValue: number) => {
    setError('');
    try {
      const res = await fetch(`/api/admin/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: currentValue ? 0 : 1 }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update thread.');
      } else {
        await fetchThreads();
      }
    } catch {
      setError('Connection error.');
    }
  };

  const handleDelete = async (threadId: number, title: string) => {
    if (!confirm(`Delete thread "${title}" and all its posts? This cannot be undone.`)) return;
    setError('');
    try {
      const res = await fetch(`/api/admin/threads/${threadId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete thread.');
      } else {
        await fetchThreads();
      }
    } catch {
      setError('Connection error.');
    }
  };

  const handleMove = async () => {
    if (!moveModal || !moveTarget) return;
    setError('');
    try {
      const res = await fetch(`/api/admin/threads/${moveModal.threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subforum_id: parseInt(moveTarget, 10) }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to move thread.');
      } else {
        setMoveModal(null);
        await fetchThreads();
      }
    } catch {
      setError('Connection error.');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
        Thread Moderation
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
        {total} total threads
      </p>

      {error && (
        <div style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '12px', padding: '8px', background: '#FEE2E2', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {/* Search and filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="forum-input"
            placeholder="Search by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ maxWidth: '250px' }}
          />
          <button type="submit" className="forum-btn">Search</button>
        </form>
        <select
          className="forum-input"
          value={filterSubforum}
          onChange={(e) => { setFilterSubforum(e.target.value); setPage(1); }}
          style={{ maxWidth: '200px' }}
        >
          <option value="">All Subforums</option>
          {subforums.map((sf) => (
            <option key={sf.id} value={sf.id}>{sf.name}</option>
          ))}
        </select>
        {(search || filterSubforum) && (
          <button
            className="forum-btn forum-btn-secondary"
            onClick={() => { setSearch(''); setSearchInput(''); setFilterSubforum(''); setPage(1); }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Threads list */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
        <div className="category-header" style={{ cursor: 'default' }}>
          <span>Threads</span>
          <span style={{ fontSize: '11px', opacity: 0.7 }}>Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--content-bg)' }}>Loading...</div>
        ) : threads.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--content-bg)' }}>No threads found.</div>
        ) : (
          threads.map((thread) => (
            <div key={thread.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px',
              background: 'var(--content-bg)', borderBottom: '1px solid var(--border-light)', gap: '8px',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {thread.is_sticky === 1 && (
                    <span style={{ background: 'var(--accent-orange)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '2px' }}>STICKY</span>
                  )}
                  {thread.is_locked === 1 && (
                    <span style={{ background: 'var(--accent-red)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '2px' }}>LOCKED</span>
                  )}
                  <Link href={`/thread/${thread.id}`} style={{ fontWeight: '600', fontSize: '13px', color: 'var(--link-color)', textDecoration: 'none' }}>
                    {thread.title}
                  </Link>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  by {thread.author_username} in {thread.subforum_name} -- {thread.reply_count} replies -- {formatRelativeTime(thread.created_at)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button
                  onClick={() => handleToggle(thread.id, 'is_sticky', thread.is_sticky)}
                  title={thread.is_sticky ? 'Unsticky' : 'Sticky'}
                  style={{
                    background: thread.is_sticky ? 'var(--accent-orange)' : 'none',
                    border: thread.is_sticky ? 'none' : '1px solid var(--border-color)',
                    borderRadius: '3px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer',
                    color: thread.is_sticky ? '#fff' : 'var(--text-secondary)', fontWeight: '600',
                  }}
                >
                  Pin
                </button>
                <button
                  onClick={() => handleToggle(thread.id, 'is_locked', thread.is_locked)}
                  title={thread.is_locked ? 'Unlock' : 'Lock'}
                  style={{
                    background: thread.is_locked ? 'var(--accent-red)' : 'none',
                    border: thread.is_locked ? 'none' : '1px solid var(--border-color)',
                    borderRadius: '3px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer',
                    color: thread.is_locked ? '#fff' : 'var(--text-secondary)', fontWeight: '600',
                  }}
                >
                  Lock
                </button>
                <button
                  onClick={() => { setMoveModal({ threadId: thread.id, title: thread.title, currentSubforum: thread.subforum_id }); setMoveTarget(String(thread.subforum_id)); }}
                  style={{
                    background: 'none', border: '1px solid var(--border-color)', borderRadius: '3px',
                    padding: '3px 8px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-secondary)',
                  }}
                >
                  Move
                </button>
                <button
                  onClick={() => handleDelete(thread.id, thread.title)}
                  style={{
                    background: 'none', border: '1px solid var(--accent-red)', borderRadius: '3px',
                    padding: '3px 8px', fontSize: '11px', cursor: 'pointer', color: 'var(--accent-red)', fontWeight: '600',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{ justifyContent: 'center', marginTop: '12px' }}>
          {page > 1 && (
            <button onClick={() => setPage(page - 1)} style={{ cursor: 'pointer', background: 'var(--content-bg)', border: '1px solid var(--border-color)', borderRadius: '3px', padding: '4px 10px', fontSize: '12px' }}>Prev</button>
          )}
          <span style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          {page < totalPages && (
            <button onClick={() => setPage(page + 1)} style={{ cursor: 'pointer', background: 'var(--content-bg)', border: '1px solid var(--border-color)', borderRadius: '3px', padding: '4px 10px', fontSize: '12px' }}>Next</button>
          )}
        </div>
      )}

      {/* Move Modal */}
      {moveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--content-bg)', borderRadius: '6px', padding: '20px', width: '400px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Move Thread</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
              Move &quot;{moveModal.title}&quot; to:
            </p>
            <select
              className="forum-input"
              value={moveTarget}
              onChange={(e) => setMoveTarget(e.target.value)}
            >
              {subforums.map((sf) => (
                <option key={sf.id} value={sf.id}>{sf.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button className="forum-btn forum-btn-secondary" onClick={() => setMoveModal(null)}>Cancel</button>
              <button className="forum-btn" onClick={handleMove} disabled={parseInt(moveTarget, 10) === moveModal.currentSubforum}>Move</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
