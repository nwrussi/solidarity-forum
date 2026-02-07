import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';
import type { AdminStats, ModerationLog } from '@/lib/types';

export const dynamic = 'force-dynamic';

function getAdminStats(): AdminStats {
  const db = getDb();

  const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  const totalThreads = (db.prepare('SELECT COUNT(*) as c FROM threads').get() as { c: number }).c;
  const totalPosts = (db.prepare('SELECT COUNT(*) as c FROM posts').get() as { c: number }).c;
  const totalMessages = (db.prepare('SELECT COUNT(*) as c FROM private_messages').get() as { c: number }).c;

  const postsToday = (db.prepare(
    "SELECT COUNT(*) as c FROM posts WHERE created_at >= datetime('now', '-1 day')"
  ).get() as { c: number }).c;

  const newMembersThisWeek = (db.prepare(
    "SELECT COUNT(*) as c FROM users WHERE created_at >= datetime('now', '-7 days')"
  ).get() as { c: number }).c;

  const pendingReports = (db.prepare(
    "SELECT COUNT(*) as c FROM reports WHERE status = 'pending'"
  ).get() as { c: number }).c;

  const bannedUsers = (db.prepare(
    'SELECT COUNT(*) as c FROM users WHERE is_banned = 1'
  ).get() as { c: number }).c;

  return {
    total_users: totalUsers,
    total_threads: totalThreads,
    total_posts: totalPosts,
    total_messages: totalMessages,
    posts_today: postsToday,
    new_members_this_week: newMembersThisWeek,
    pending_reports: pendingReports,
    banned_users: bannedUsers,
  };
}

function getRecentActivity(limit: number = 10): ModerationLog[] {
  const db = getDb();
  return db.prepare(`
    SELECT ml.*, u.username as moderator_username
    FROM moderation_log ml
    JOIN users u ON u.id = ml.moderator_id
    ORDER BY ml.created_at DESC
    LIMIT ?
  `).all(limit) as ModerationLog[];
}

function getRecentPosts(limit: number = 5): { id: number; content: string; created_at: string; author_username: string; thread_title: string; thread_id: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT p.id, p.content, p.created_at, u.username as author_username, t.title as thread_title, t.id as thread_id
    FROM posts p
    JOIN users u ON u.id = p.user_id
    JOIN threads t ON t.id = p.thread_id
    ORDER BY p.created_at DESC
    LIMIT ?
  `).all(limit) as { id: number; content: string; created_at: string; author_username: string; thread_title: string; thread_id: number }[];
}

function getRecentMembers(limit: number = 5): { username: string; created_at: string; role: string }[] {
  const db = getDb();
  return db.prepare(`
    SELECT username, created_at, role FROM users ORDER BY created_at DESC LIMIT ?
  `).all(limit) as { username: string; created_at: string; role: string }[];
}

export default async function AdminDashboard() {
  const session = await getSession();
  if (session.role !== 'admin') {
    // Moderators can see dashboard but with limited stats
    if (session.role !== 'moderator') {
      redirect('/');
    }
  }

  const stats = getAdminStats();
  const recentActivity = getRecentActivity(10);
  const recentPosts = getRecentPosts(5);
  const recentMembers = getRecentMembers(5);

  const statCards = [
    { label: 'Total Users', value: stats.total_users, color: 'var(--accent-teal)' },
    { label: 'Total Threads', value: stats.total_threads, color: 'var(--accent-purple)' },
    { label: 'Total Posts', value: stats.total_posts, color: 'var(--link-color)' },
    { label: 'Posts Today', value: stats.posts_today, color: 'var(--accent-green)' },
    { label: 'New Members (7d)', value: stats.new_members_this_week, color: 'var(--accent-orange)' },
    { label: 'Pending Reports', value: stats.pending_reports, color: stats.pending_reports > 0 ? 'var(--accent-red)' : 'var(--text-muted)' },
    { label: 'Banned Users', value: stats.banned_users, color: 'var(--accent-red)' },
    { label: 'Total Messages', value: stats.total_messages, color: 'var(--text-secondary)' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
          Admin Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          Welcome back, {session.username}. Here is an overview of your forum.
        </p>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '20px',
      }}>
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: 'var(--content-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '14px',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              {card.label}
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: card.color }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Recent Posts */}
        <div style={{ flex: 1 }}>
          <div className="sidebar-widget">
            <div className="sidebar-widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Recent Posts
              <Link href="/admin/posts" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', textDecoration: 'none' }}>View All</Link>
            </div>
            <div style={{ padding: '0' }}>
              {recentPosts.length === 0 ? (
                <div style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>No recent posts.</div>
              ) : (
                recentPosts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border-light)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <Link href={`/profile/${post.author_username}`} style={{ fontWeight: '600', color: 'var(--link-color)', textDecoration: 'none' }}>
                        {post.author_username}
                      </Link>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        {formatRelativeTime(post.created_at)}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      in <Link href={`/thread/${post.thread_id}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{post.thread_title}</Link>
                    </div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {post.content.substring(0, 100)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: New Members + Mod Activity */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          {/* New Members */}
          <div className="sidebar-widget" style={{ marginBottom: '12px' }}>
            <div className="sidebar-widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              New Members
              {session.role === 'admin' && (
                <Link href="/admin/users" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', textDecoration: 'none' }}>Manage</Link>
              )}
            </div>
            <div style={{ padding: '0' }}>
              {recentMembers.map((member) => (
                <div
                  key={member.username}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-light)',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <Link href={`/profile/${member.username}`} style={{ color: 'var(--link-color)', fontWeight: '500', textDecoration: 'none' }}>
                      {member.username}
                    </Link>
                    <span style={{
                      marginLeft: '6px',
                      fontSize: '10px',
                      color: member.role === 'admin' ? 'var(--accent-red)' : member.role === 'moderator' ? 'var(--accent-orange)' : 'var(--text-muted)',
                      textTransform: 'uppercase',
                      fontWeight: '600',
                    }}>
                      {member.role}
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    {formatRelativeTime(member.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Moderation Activity */}
          <div className="sidebar-widget">
            <div className="sidebar-widget-header">
              Moderation Activity
            </div>
            <div style={{ padding: '0' }}>
              {recentActivity.length === 0 ? (
                <div style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>No recent moderation activity.</div>
              ) : (
                recentActivity.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--border-light)',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: '600' }}>{log.moderator_username}</span>{' '}
                      {log.action} ({log.target_type} #{log.target_id})
                    </div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '1px' }}>
                      {formatRelativeTime(log.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
