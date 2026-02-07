'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { SessionUser } from '@/lib/types';

export default function Navigation() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  };

  return (
    <>
      {/* Main Header */}
      <header style={{ background: 'var(--header-bg)' }}>
        <div className="forum-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '50px' }}>
            {/* Logo */}
            <Link href="/" style={{ color: 'var(--header-text-color)', textDecoration: 'none', fontSize: '20px', fontWeight: '700', letterSpacing: '0.5px' }}>
              Solidarity Forum
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: 'var(--header-text-color)',
                fontSize: '24px',
                cursor: 'pointer',
              }}
              className="mobile-menu-btn"
              aria-label="Toggle menu"
            >
              {menuOpen ? '\u2715' : '\u2630'}
            </button>

            {/* Desktop navigation */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <NavLink href="/">Home</NavLink>
              <NavLink href="/">Forums</NavLink>
              {!loading && (
                <>
                  {user ? (
                    <>
                      <NavLink href={`/profile/${user.username}`}>{user.username}</NavLink>
                      {(user.role === 'admin' || user.role === 'moderator') && (
                        <NavLink href="/admin">Admin</NavLink>
                      )}
                      <button
                        onClick={handleLogout}
                        style={{
                          background: 'none',
                          border: '1px solid rgba(255,255,255,0.3)',
                          color: 'var(--header-text-color)',
                          padding: '6px 12px',
                          borderRadius: 'var(--forum-border-radius)',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <NavLink href="/login">Log In</NavLink>
                      <Link
                        href="/register"
                        style={{
                          background: 'var(--accent-teal)',
                          color: 'var(--header-text-color)',
                          padding: '6px 12px',
                          borderRadius: 'var(--forum-border-radius)',
                          fontSize: '13px',
                          fontWeight: '600',
                          textDecoration: 'none',
                        }}
                      >
                        Register
                      </Link>
                    </>
                  )}
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Sub-navigation bar */}
      <div style={{ background: 'var(--nav-bg)' }}>
        <div className="forum-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '36px' }}>
            <SubNavLink href="/">New Posts</SubNavLink>
            <SubNavLink href="/">Search Forums</SubNavLink>
          </div>
        </div>
      </div>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        color: 'var(--header-text-color)',
        padding: '6px 12px',
        borderRadius: 'var(--forum-border-radius)',
        fontSize: '13px',
        textDecoration: 'none',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </Link>
  );
}

function SubNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        color: 'rgba(255,255,255,0.85)',
        padding: '4px 10px',
        borderRadius: 'var(--forum-border-radius)',
        fontSize: '12px',
        textDecoration: 'none',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.color = 'var(--header-text-color)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
      }}
    >
      {children}
    </Link>
  );
}
