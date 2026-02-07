'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface SubforumOption {
  id: number;
  name: string;
  category_name: string;
}

function NewThreadContent() {
  const searchParams = useSearchParams();
  const preselectedSubforum = searchParams.get('subforum') || '';

  const [subforums, setSubforums] = useState<SubforumOption[]>([]);
  const [subforumId, setSubforumId] = useState(preselectedSubforum);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch subforums for the dropdown
    fetch('/api/subforums')
      .then((res) => res.json())
      .then((data) => setSubforums(data.subforums || []))
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="forum-container" style={{ paddingTop: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="forum-container" style={{ paddingTop: '24px' }}>
        <div style={{
          maxWidth: '500px',
          margin: '0 auto',
          padding: '32px',
          textAlign: 'center',
          background: 'var(--content-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
        }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            You must be logged in to create a thread.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <Link href="/login" className="forum-btn">Log In</Link>
            <Link href="/register" className="forum-btn forum-btn-secondary">Register</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!subforumId) {
      setError('Please select a subforum.');
      return;
    }

    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }

    if (!content.trim()) {
      setError('Post content cannot be empty.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subforumId: parseInt(subforumId, 10),
          title: title.trim(),
          content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create thread.');
        setSubmitting(false);
        return;
      }

      // Redirect to the new thread
      window.location.href = `/thread/${data.threadId}`;
    } catch {
      setError('Connection error. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="forum-container" style={{ paddingTop: '12px', paddingBottom: '24px' }}>
      <div style={{ maxWidth: '700px' }}>
        {/* Header */}
        <div style={{
          background: 'var(--category-header-bg)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '4px 4px 0 0',
          fontSize: '15px',
          fontWeight: '600',
        }}>
          Create New Thread
        </div>

        {/* Form */}
        <div style={{
          background: 'var(--content-bg)',
          border: '1px solid var(--border-color)',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          padding: '20px',
        }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '4px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#DC2626',
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Subforum
              </label>
              <select
                className="forum-input"
                value={subforumId}
                onChange={(e) => setSubforumId(e.target.value)}
                required
              >
                <option value="">-- Select a subforum --</option>
                {subforums.map((sf) => (
                  <option key={sf.id} value={sf.id}>
                    {sf.category_name} &rsaquo; {sf.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Thread Title
              </label>
              <input
                type="text"
                className="forum-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title for your thread"
                required
                minLength={3}
                maxLength={200}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Content
              </label>
              <textarea
                className="forum-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content here. You can use **bold**, *italic*, and > for quotes."
                required
                style={{ minHeight: '200px' }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                Supports basic formatting: **bold**, *italic*, &gt; quote, and URLs are auto-linked.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="forum-btn"
                disabled={submitting}
              >
                {submitting ? 'Creating Thread...' : 'Create Thread'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewThreadPage() {
  return (
    <Suspense fallback={
      <div className="forum-container" style={{ paddingTop: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    }>
      <NewThreadContent />
    </Suspense>
  );
}
