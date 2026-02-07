'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';

interface AdminReport {
  id: number;
  post_id: number;
  reporter_username: string;
  reason: string;
  status: string;
  created_at: string;
  post_content: string;
  post_author_username: string;
  post_author_id: string;
  thread_id: number;
  thread_title: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_username?: string;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: '20' });
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/reports?${params}`);
      if (res.status === 403) { router.push('/'); return; }
      const data = await res.json();
      setReports(data.reports || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setError('Failed to load reports.');
    }
    setLoading(false);
  }, [page, statusFilter, router]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateStatus = async (reportId: number, status: string) => {
    setError('');
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update report.');
      } else {
        await fetchReports();
      }
    } catch {
      setError('Connection error.');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Delete this reported post? This cannot be undone.')) return;
    setError('');
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete post.');
      } else {
        await fetchReports();
      }
    } catch {
      setError('Connection error.');
    }
  };

  const handleBanUser = async (userId: string, username: string) => {
    if (!confirm(`Ban user "${username}"?`)) return;
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_banned: true, ban_reason: 'Banned from reports queue' }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to ban user.');
      } else {
        await fetchReports();
      }
    } catch {
      setError('Connection error.');
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'var(--accent-orange)',
    reviewed: 'var(--accent-green)',
    dismissed: 'var(--text-muted)',
  };

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
        Reports Queue
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
        {total} reports {statusFilter ? `(${statusFilter})` : ''}
      </p>

      {error && (
        <div style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '12px', padding: '8px', background: '#FEE2E2', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        {['pending', 'reviewed', 'dismissed', ''].map((status) => (
          <button
            key={status || 'all'}
            onClick={() => { setStatusFilter(status); setPage(1); }}
            style={{
              padding: '6px 14px',
              border: '1px solid var(--border-color)',
              borderRadius: '3px',
              background: statusFilter === status ? 'var(--nav-bg)' : 'var(--content-bg)',
              color: statusFilter === status ? '#fff' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {/* Reports list */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
        <div className="category-header" style={{ cursor: 'default' }}>
          <span>Reports</span>
          <span style={{ fontSize: '11px', opacity: 0.7 }}>Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--content-bg)' }}>Loading...</div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--content-bg)' }}>
            No reports found.
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} style={{
              padding: '12px', background: 'var(--content-bg)', borderBottom: '1px solid var(--border-light)',
            }}>
              {/* Report header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <span style={{
                    background: statusColors[report.status] || 'var(--text-muted)',
                    color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '2px', textTransform: 'uppercase',
                  }}>
                    {report.status}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Report #{report.id} -- {formatRelativeTime(report.created_at)}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Reported by <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{report.reporter_username}</span>
                  </span>
                </div>
              </div>

              {/* Report reason */}
              <div style={{
                padding: '8px 10px', background: '#FEF9E7', border: '1px solid #F9E79F', borderRadius: '3px',
                fontSize: '12px', color: '#7D6608', marginBottom: '8px',
              }}>
                <strong>Reason:</strong> {report.reason}
              </div>

              {/* Reported post preview */}
              <div style={{
                padding: '8px 10px', background: '#F9FAFB', border: '1px solid var(--border-light)', borderRadius: '3px',
                marginBottom: '8px',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Post by <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{report.post_author_username}</span>
                  {' '}in{' '}
                  <Link href={`/thread/${report.thread_id}`} style={{ color: 'var(--link-color)', textDecoration: 'none' }}>
                    {report.thread_title}
                  </Link>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', maxHeight: '80px', overflow: 'hidden', wordBreak: 'break-word' }}>
                  {report.post_content.substring(0, 300)}{report.post_content.length > 300 ? '...' : ''}
                </div>
              </div>

              {/* Reviewed by info */}
              {report.reviewed_by && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Reviewed by {report.reviewer_username} {report.reviewed_at ? formatRelativeTime(report.reviewed_at) : ''}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <Link
                  href={`/thread/${report.thread_id}#post-${report.post_id}`}
                  style={{
                    padding: '4px 10px', border: '1px solid var(--border-color)', borderRadius: '3px',
                    fontSize: '11px', color: 'var(--text-secondary)', textDecoration: 'none', background: 'var(--content-bg)',
                  }}
                >
                  View in Context
                </Link>
                {report.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'reviewed')}
                      style={{
                        padding: '4px 10px', border: 'none', borderRadius: '3px', fontSize: '11px',
                        cursor: 'pointer', color: '#fff', fontWeight: '600', background: 'var(--accent-green)',
                      }}
                    >
                      Mark Reviewed
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                      style={{
                        padding: '4px 10px', border: '1px solid var(--border-color)', borderRadius: '3px',
                        fontSize: '11px', cursor: 'pointer', color: 'var(--text-secondary)', background: 'var(--content-bg)',
                      }}
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleDeletePost(report.post_id)}
                      style={{
                        padding: '4px 10px', border: '1px solid var(--accent-red)', borderRadius: '3px',
                        fontSize: '11px', cursor: 'pointer', color: 'var(--accent-red)', fontWeight: '600', background: 'var(--content-bg)',
                      }}
                    >
                      Delete Post
                    </button>
                    <button
                      onClick={() => handleBanUser(report.post_author_id, report.post_author_username)}
                      style={{
                        padding: '4px 10px', border: 'none', borderRadius: '3px', fontSize: '11px',
                        cursor: 'pointer', color: '#fff', fontWeight: '600', background: 'var(--accent-red)',
                      }}
                    >
                      Ban User
                    </button>
                  </>
                )}
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
    </div>
  );
}
