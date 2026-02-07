'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface AdminUser {
  id: string;
  username: string;
  role: string;
  created_at: string;
  post_count: number;
  is_banned: number;
  ban_reason: string;
  last_seen: string | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Modal state for ban
  const [banModal, setBanModal] = useState<{ userId: string; username: string } | null>(null);
  const [banReason, setBanReason] = useState('');

  // Modal state for role change
  const [roleModal, setRoleModal] = useState<{ userId: string; username: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: '20' });
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.status === 403) {
        router.push('/');
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setError('Failed to load users.');
    }
    setLoading(false);
  }, [page, search, router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleBan = async (userId: string, ban: boolean, reason: string) => {
    setActionLoading(userId);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_banned: ban, ban_reason: reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update user.');
      } else {
        setBanModal(null);
        setBanReason('');
        await fetchUsers();
      }
    } catch {
      setError('Connection error.');
    }
    setActionLoading(null);
  };

  const handleRoleChange = async (userId: string, role: string) => {
    setActionLoading(userId);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update role.');
      } else {
        setRoleModal(null);
        setNewRole('');
        await fetchUsers();
      }
    } catch {
      setError('Connection error.');
    }
    setActionLoading(null);
  };

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
        User Management
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
        {total} total users
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
          placeholder="Search by username..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <button type="submit" className="forum-btn">Search</button>
        {search && (
          <button
            type="button"
            className="forum-btn forum-btn-secondary"
            onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
          >
            Clear
          </button>
        )}
      </form>

      {/* Users table */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
        <div className="category-header" style={{ cursor: 'default' }}>
          <span>Users</span>
          <span style={{ fontSize: '11px', opacity: 0.7 }}>Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--content-bg)' }}>
            Loading...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--content-bg)' }}>
            No users found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--content-bg)', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Username</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Joined</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Posts</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 12px' }}>
                    <Link href={`/profile/${user.username}`} style={{ fontWeight: '600', color: 'var(--link-color)', textDecoration: 'none' }}>
                      {user.username}
                    </Link>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      color: user.role === 'admin' ? 'var(--accent-red)' : user.role === 'moderator' ? 'var(--accent-orange)' : 'var(--text-muted)',
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                    {formatDate(user.created_at)}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    {user.post_count}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    {user.is_banned ? (
                      <span style={{ background: 'var(--accent-red)', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '2px' }}>
                        BANNED
                      </span>
                    ) : (
                      <span style={{ background: 'var(--accent-green)', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '2px' }}>
                        ACTIVE
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => { setRoleModal({ userId: user.id, username: user.username, currentRole: user.role }); setNewRole(user.role); }}
                        disabled={actionLoading === user.id}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border-color)',
                          borderRadius: '3px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        Role
                      </button>
                      {user.is_banned ? (
                        <button
                          onClick={() => handleBan(user.id, false, '')}
                          disabled={actionLoading === user.id}
                          style={{
                            background: 'var(--accent-green)',
                            border: 'none',
                            borderRadius: '3px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            color: '#fff',
                            fontWeight: '600',
                          }}
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => { setBanModal({ userId: user.id, username: user.username }); setBanReason(''); }}
                          disabled={actionLoading === user.id}
                          style={{
                            background: 'var(--accent-red)',
                            border: 'none',
                            borderRadius: '3px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            color: '#fff',
                            fontWeight: '600',
                          }}
                        >
                          Ban
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{ justifyContent: 'center', marginTop: '12px' }}>
          {page > 1 && (
            <button onClick={() => setPage(page - 1)} style={{ cursor: 'pointer', background: 'var(--content-bg)', border: '1px solid var(--border-color)', borderRadius: '3px', padding: '4px 10px', fontSize: '12px' }}>
              Prev
            </button>
          )}
          <span style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <button onClick={() => setPage(page + 1)} style={{ cursor: 'pointer', background: 'var(--content-bg)', border: '1px solid var(--border-color)', borderRadius: '3px', padding: '4px 10px', fontSize: '12px' }}>
              Next
            </button>
          )}
        </div>
      )}

      {/* Ban Modal */}
      {banModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: 'var(--content-bg)', borderRadius: '6px', padding: '20px', width: '400px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Ban User: {banModal.username}</h3>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Reason (optional)</label>
            <textarea
              className="forum-textarea"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={3}
              placeholder="Reason for the ban..."
              style={{ minHeight: '80px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button className="forum-btn forum-btn-secondary" onClick={() => setBanModal(null)}>Cancel</button>
              <button
                className="forum-btn"
                style={{ background: 'var(--accent-red)' }}
                onClick={() => handleBan(banModal.userId, true, banReason)}
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {roleModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: 'var(--content-bg)', borderRadius: '6px', padding: '20px', width: '350px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Change Role: {roleModal.username}</h3>
            <select
              className="forum-input"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="member">Member</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button className="forum-btn forum-btn-secondary" onClick={() => setRoleModal(null)}>Cancel</button>
              <button
                className="forum-btn"
                onClick={() => handleRoleChange(roleModal.userId, newRole)}
                disabled={newRole === roleModal.currentRole}
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
