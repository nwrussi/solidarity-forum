'use client';

import { useState, useEffect } from 'react';
import type { SessionUser } from '@/lib/types';

interface ReplyFormProps {
  threadId: number;
  isLocked: boolean;
}

export default function ReplyForm({ threadId, isLocked }: ReplyFormProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (isLocked) {
    return (
      <div style={{ padding: '16px', background: 'var(--content-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', marginTop: '12px', textAlign: 'center' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>This thread is locked. No new replies can be posted.</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '16px', background: 'var(--content-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', marginTop: '12px', textAlign: 'center' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          You must be <a href="/login">logged in</a> to reply.
        </span>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Reply content cannot be empty.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to post reply.');
        setSubmitting(false);
        return;
      }

      // Reload page to show new reply
      window.location.reload();
    } catch {
      setError('Connection error. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: '12px', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
      <div className="category-header" style={{ cursor: 'default' }}>
        Post Reply
      </div>
      <div style={{ padding: '12px', background: 'var(--content-bg)' }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '8px' }}>{error}</div>
          )}
          <textarea
            className="forum-textarea"
            placeholder="Write your reply..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
          />
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="forum-btn"
              disabled={submitting}
            >
              {submitting ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
