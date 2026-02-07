'use client';

import { useState, useEffect } from 'react';
import type { SessionUser } from '@/lib/types';

interface ThreadModToolsProps {
  threadId: number;
  isSticky: boolean;
  isLocked: boolean;
}

export default function ThreadModTools({ threadId, isSticky, isLocked }: ThreadModToolsProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sticky, setSticky] = useState(isSticky);
  const [locked, setLocked] = useState(isLocked);
  const [actionLoading, setActionLoading] = useState(false);

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
  if (user.role !== 'admin' && user.role !== 'moderator') return null;

  const handleToggle = async (field: 'is_sticky' | 'is_locked', currentValue: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: currentValue ? 0 : 1 }),
      });
      if (res.ok) {
        if (field === 'is_sticky') setSticky(!currentValue);
        if (field === 'is_locked') setLocked(!currentValue);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update thread.');
      }
    } catch {
      alert('Connection error.');
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this thread and all its posts? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/threads/${threadId}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/';
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete thread.');
      }
    } catch {
      alert('Connection error.');
    }
    setActionLoading(false);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 10px',
      background: '#FEF9E7',
      border: '1px solid #F9E79F',
      borderRadius: '4px',
      marginBottom: '8px',
      fontSize: '11px',
    }}>
      <span style={{ fontWeight: '700', color: '#7D6608', marginRight: '4px' }}>Mod:</span>
      <button
        onClick={() => handleToggle('is_sticky', sticky)}
        disabled={actionLoading}
        style={{
          padding: '3px 8px',
          borderRadius: '3px',
          fontSize: '11px',
          cursor: 'pointer',
          fontWeight: '600',
          border: 'none',
          background: sticky ? 'var(--accent-orange)' : '#E5E7EB',
          color: sticky ? '#fff' : 'var(--text-secondary)',
        }}
      >
        {sticky ? 'Unsticky' : 'Sticky'}
      </button>
      <button
        onClick={() => handleToggle('is_locked', locked)}
        disabled={actionLoading}
        style={{
          padding: '3px 8px',
          borderRadius: '3px',
          fontSize: '11px',
          cursor: 'pointer',
          fontWeight: '600',
          border: 'none',
          background: locked ? 'var(--accent-red)' : '#E5E7EB',
          color: locked ? '#fff' : 'var(--text-secondary)',
        }}
      >
        {locked ? 'Unlock' : 'Lock'}
      </button>
      <button
        onClick={handleDelete}
        disabled={actionLoading}
        style={{
          padding: '3px 8px',
          borderRadius: '3px',
          fontSize: '11px',
          cursor: 'pointer',
          fontWeight: '600',
          border: '1px solid var(--accent-red)',
          background: 'none',
          color: 'var(--accent-red)',
        }}
      >
        Delete Thread
      </button>
    </div>
  );
}
