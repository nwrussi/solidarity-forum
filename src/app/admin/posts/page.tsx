'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';

interface AdminPost {
  id: number;
  content: string;
  created_at: string;
  is_edited: number;
  author_username: string;
  thread_title: string;
  thread_id: number;
  user_id: string;
}

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit modal
  const [editModal, setEditModal] = useState<{ postId: number; content: string } | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: '20' });
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/posts?${params}`);
      if (res.status === 403) { router.push('/'); return; }
      const data = await res.json();
      setPosts(data.posts || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setError('Failed to load posts.');
    }
    setLoading(false);
  }, [page, search, router]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('Delete this post? This cannot be undone. If this is the first post in a thread, the entire thread will be deleted.')) return;
    setError('');
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete post.');
      } else {
        await fetchPosts();
      }
    } catch {
      setError('Connection error.');
    }
  };

  const handleEdit = async () => {
    if (!editModal) return;
    if (!editContent.trim()) {
      setError('Content cannot be empty.');
      return;
    }
    setError('');
    try {
      const res = await fetch(`/api/admin/posts/${editModal.postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to edit post.');
      } else {
        setEditModal(null);
        await fetchPosts();
      }
    } catch {
      setError('Connection error.');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
        Post Moderation
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
        {total} total posts
      </p>

      {error && (
        <div style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '12px', padding: '8px', background: '#FEE2E2', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          className="forum-input"
          placeholder="Search post content..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <button type="submit" className="forum-btn">Search</button>
        {search && (
          <button className="forum-btn forum-btn-secondary" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
            Clear
          </button>
        )}
      </form>

      {/* Posts list */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
        <div className="category-header" style={{ cursor: 'default' }}>
          <span>Posts</span>
          <span style={{ fontSize: '11px', opacity: 0.7 }}>Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--content-bg)' }}>Loading...</div>
        ) : posts.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--content-bg)' }}>No posts found.</div>
        ) : (
          posts.map((post) => (
            <div key={post.id} style={{
              padding: '10px 12px', background: 'var(--content-bg)', borderBottom: '1px solid var(--border-light)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--link-color)' }}>{post.author_username}</span>
                    <span style={{ color: 'var(--text-muted)' }}>in</span>
                    <Link href={`/thread/${post.thread_id}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                      {post.thread_title}
                    </Link>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      {formatRelativeTime(post.created_at)}
                    </span>
                    {post.is_edited === 1 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontStyle: 'italic' }}>(edited)</span>
                    )}
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>#{post.id}</span>
                  </div>
                  <div style={{
                    fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5',
                    maxHeight: '60px', overflow: 'hidden', wordBreak: 'break-word',
                  }}>
                    {post.content.substring(0, 200)}{post.content.length > 200 ? '...' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button
                    onClick={() => { setEditModal({ postId: post.id, content: post.content }); setEditContent(post.content); }}
                    style={{
                      background: 'none', border: '1px solid var(--border-color)', borderRadius: '3px',
                      padding: '3px 8px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-secondary)',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    style={{
                      background: 'none', border: '1px solid var(--accent-red)', borderRadius: '3px',
                      padding: '3px 8px', fontSize: '11px', cursor: 'pointer', color: 'var(--accent-red)', fontWeight: '600',
                    }}
                  >
                    Delete
                  </button>
                </div>
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

      {/* Edit Modal */}
      {editModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--content-bg)', borderRadius: '6px', padding: '20px', width: '600px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Edit Post #{editModal.postId}</h3>
            <textarea
              className="forum-textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
              style={{ minHeight: '150px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button className="forum-btn forum-btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="forum-btn" onClick={handleEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
