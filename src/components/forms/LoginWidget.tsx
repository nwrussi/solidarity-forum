'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { SessionUser } from '@/lib/types';

export default function LoginWidget() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed.');
        setSubmitting(false);
        return;
      }

      // Reload to update all components
      window.location.reload();
    } catch {
      setError('Connection error. Try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="sidebar-widget">
        <div className="sidebar-widget-header">Account</div>
        <div className="sidebar-widget-body">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  // Show user info if logged in
  if (user) {
    return (
      <div className="sidebar-widget">
        <div className="sidebar-widget-header">Welcome, {user.username}</div>
        <div className="sidebar-widget-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Link href={`/profile/${user.username}`} style={{ fontSize: '12px' }}>View Profile</Link>
            <Link href="/new-thread" style={{ fontSize: '12px' }}>Create Thread</Link>
          </div>
        </div>
      </div>
    );
  }

  // Show login form
  return (
    <div className="sidebar-widget">
      <div className="sidebar-widget-header">Log In</div>
      <div className="sidebar-widget-body">
        <form onSubmit={handleLogin}>
          {error && (
            <div style={{ color: 'var(--error)', fontSize: '12px', marginBottom: '8px' }}>{error}</div>
          )}
          <div style={{ marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="forum-input"
              style={{ fontSize: '12px', padding: '6px 8px' }}
              required
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="forum-input"
              style={{ fontSize: '12px', padding: '6px 8px' }}
              required
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              type="submit"
              className="forum-btn"
              style={{ fontSize: '12px', padding: '5px 12px' }}
              disabled={submitting}
            >
              {submitting ? 'Logging in...' : 'Log In'}
            </button>
            <Link href="/register" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
