'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed.');
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
      <div style={{ maxWidth: '440px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'var(--category-header-bg)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '4px 4px 0 0',
          fontSize: '15px',
          fontWeight: '600',
        }}>
          Create Account
        </div>

        {/* Form */}
        <div style={{
          background: 'var(--content-bg)',
          border: '1px solid var(--border-color)',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          padding: '20px',
        }}>
          {/* Privacy notice */}
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '4px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#166534',
            lineHeight: '1.5',
          }}>
            <strong>Privacy First:</strong> We only require a username and password to register.
            No email address, no phone number, no personal information.
            Your anonymity is protected by design.
          </div>

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
                placeholder="Choose a username (3-30 characters)"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_-]+"
                title="Letters, numbers, underscores, and hyphens only"
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                Letters, numbers, underscores, and hyphens only. This will be your public identity.
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Password
              </label>
              <input
                type="password"
                className="forum-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password"
                required
                minLength={6}
                maxLength={128}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                Minimum 6 characters. Use a strong, unique password.
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Confirm Password
              </label>
              <input
                type="password"
                className="forum-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                minLength={6}
                maxLength={128}
              />
            </div>

            {/* Warning notice */}
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '4px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#92400E',
              lineHeight: '1.5',
            }}>
              <strong>Important:</strong> If you lose your password, your account cannot be recovered.
              There is no email-based password reset. This is by design to protect your anonymity.
              Choose a password you will remember, or store it in a password manager.
            </div>

            <button
              type="submit"
              className="forum-btn"
              style={{ width: '100%', padding: '10px', fontSize: '14px' }}
              disabled={submitting}
            >
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Already have an account? <Link href="/login">Log in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
