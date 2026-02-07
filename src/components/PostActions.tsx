'use client';

import { useState, useEffect } from 'react';
import type { SessionUser } from '@/lib/types';

interface PostActionsProps {
  postId: number;
  threadId?: number;
}

export default function PostActions({ postId, threadId }: PostActionsProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Report modal state
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportResult, setReportResult] = useState<{ success?: boolean; error?: string } | null>(null);

  // Edit modal state (for mods/admins)
  const [showEdit, setShowEdit] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !user) return null;

  const isMod = user.role === 'admin' || user.role === 'moderator';

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim() || reportReason.trim().length < 5) {
      setReportResult({ error: 'Reason must be at least 5 characters.' });
      return;
    }
    setReportSubmitting(true);
    setReportResult(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, reason: reportReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setReportResult({ success: true });
        setReportReason('');
        setTimeout(() => { setShowReport(false); setReportResult(null); }, 2000);
      } else {
        setReportResult({ error: data.error || 'Failed to submit report.' });
      }
    } catch {
      setReportResult({ error: 'Connection error.' });
    }
    setReportSubmitting(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        if (data.threadDeleted) {
          window.location.href = threadId ? `/forum/${threadId}` : '/';
        } else {
          window.location.reload();
        }
      } else {
        alert(data.error || 'Failed to delete post.');
      }
    } catch {
      alert('Connection error.');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setShowEdit(false);
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to edit post.');
      }
    } catch {
      alert('Connection error.');
    }
    setEditSubmitting(false);
  };

  const loadEditContent = async () => {
    // Fetch current post content for editing
    try {
      const res = await fetch(`/api/admin/posts?search=&perPage=1&page=1`);
      // Actually we need the content, let us just look for it in the page
      // We will use a simple approach: get the text from the post body
      const postEl = document.getElementById(`post-${postId}`);
      if (postEl) {
        // Get the raw text content -- but we need the original markdown.
        // Since we do not have an API for single post fetch, we will just use a placeholder.
        // The mod can type new content.
        setEditContent('');
      }
    } catch {
      // ignore
    }
    setShowEdit(true);
  };

  return (
    <>
      {/* Action bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '12px',
        paddingTop: '8px',
        borderTop: '1px solid var(--border-light)',
      }}>
        {/* Report button - visible to all logged-in users */}
        <button
          onClick={() => setShowReport(!showReport)}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 6px',
            fontSize: '11px',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
        >
          Report
        </button>

        {/* Mod tools */}
        {isMod && (
          <>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <button
              onClick={loadEditContent}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px 6px',
                fontSize: '11px',
                cursor: 'pointer',
                color: 'var(--accent-orange)',
                fontWeight: '600',
              }}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px 6px',
                fontSize: '11px',
                cursor: 'pointer',
                color: 'var(--accent-red)',
                fontWeight: '600',
              }}
            >
              Delete
            </button>
          </>
        )}
      </div>

      {/* Report form (inline dropdown) */}
      {showReport && (
        <div style={{
          marginTop: '8px',
          padding: '10px',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          background: '#F9FAFB',
        }}>
          <form onSubmit={handleReport}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Report this post
            </label>
            <textarea
              className="forum-textarea"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe why you are reporting this post (minimum 5 characters)..."
              rows={3}
              style={{ minHeight: '60px', fontSize: '12px' }}
            />
            {reportResult?.error && (
              <div style={{ color: 'var(--error)', fontSize: '12px', marginTop: '4px' }}>{reportResult.error}</div>
            )}
            {reportResult?.success && (
              <div style={{ color: 'var(--accent-green)', fontSize: '12px', marginTop: '4px' }}>Report submitted. Thank you.</div>
            )}
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setShowReport(false); setReportReason(''); setReportResult(null); }}
                style={{
                  background: 'none', border: '1px solid var(--border-color)', borderRadius: '3px',
                  padding: '4px 10px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-secondary)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reportSubmitting}
                style={{
                  background: 'var(--accent-red)', border: 'none', borderRadius: '3px',
                  padding: '4px 10px', fontSize: '11px', cursor: 'pointer', color: '#fff', fontWeight: '600',
                }}
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit form modal */}
      {showEdit && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: 'var(--content-bg)', borderRadius: '6px', padding: '20px', width: '600px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Edit Post #{postId}</h3>
            <form onSubmit={handleEdit}>
              <textarea
                className="forum-textarea"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                placeholder="Enter the new content for this post..."
                style={{ minHeight: '150px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="forum-btn forum-btn-secondary"
                  onClick={() => setShowEdit(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="forum-btn"
                  disabled={editSubmitting || !editContent.trim()}
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
