'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Redirect to home on success
      window.location.href = '/';
    } catch {
      setError('Connection error. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="forum-container" style={{ paddingTop: '24px', paddingBottom: '24px' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'var(--category-header-bg)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '4px 4px 0 0',
          fontSize: '15px',
          fontWeight: '600',
        }}>
          Log In
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
                Username
              </label>
              <input
                type="text"
                className="forum-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Password
              </label>
              <input
                type="password"
                className="forum-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
              />
            </div>

            <button
              type="submit"
              className="forum-btn"
              style={{ width: '100%', padding: '10px', fontSize: '14px' }}
              disabled={submitting}
            >
              {submitting ? 'Logging in...' : 'Log In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              No account? <Link href="/register">Register</Link> &mdash; no email required.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
