import Link from 'next/link';
import type { ForumStats, Thread } from '@/lib/types';
import { formatCount, formatRelativeTime } from '@/lib/utils';
import LoginWidget from './LoginWidget';

interface SidebarProps {
  stats: ForumStats;
  activeThreads: (Thread & { subforum_name?: string })[];
  newThreads: (Thread & { subforum_name?: string })[];
}

export default function Sidebar({ stats, activeThreads, newThreads }: SidebarProps) {
  return (
    <div style={{ width: '100%' }}>
      {/* Login Widget */}
      <LoginWidget />

      {/* Active Threads */}
      <div className="sidebar-widget">
        <div className="sidebar-widget-header">Active Threads</div>
        <div className="sidebar-widget-body" style={{ padding: 0 }}>
          {activeThreads.map((thread) => (
            <div key={thread.id} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)' }}>
              <Link
                href={`/thread/${thread.id}`}
                style={{ fontSize: '12px', fontWeight: '500', color: 'var(--link-color)', textDecoration: 'none', display: 'block', lineHeight: '1.3' }}
              >
                {thread.title}
              </Link>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {formatRelativeTime(thread.last_post_at)} &middot; {thread.reply_count} replies
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Threads */}
      <div className="sidebar-widget">
        <div className="sidebar-widget-header">New Threads</div>
        <div className="sidebar-widget-body" style={{ padding: 0 }}>
          {newThreads.map((thread) => (
            <div key={thread.id} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)' }}>
              <Link
                href={`/thread/${thread.id}`}
                style={{ fontSize: '12px', fontWeight: '500', color: 'var(--link-color)', textDecoration: 'none', display: 'block', lineHeight: '1.3' }}
              >
                {thread.title}
              </Link>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                by {thread.author_username} &middot; in {thread.subforum_name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Members Online */}
      <div className="sidebar-widget">
        <div className="sidebar-widget-header">Members Online</div>
        <div className="sidebar-widget-body">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            {stats.online_members.length} member{stats.online_members.length !== 1 ? 's' : ''} online
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {stats.online_members.map((username) => (
              <Link
                key={username}
                href={`/profile/${username}`}
                style={{ fontSize: '11px', color: 'var(--link-color)', textDecoration: 'none' }}
              >
                {username}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Forum Statistics */}
      <div className="sidebar-widget">
        <div className="sidebar-widget-header">Forum Statistics</div>
        <div className="sidebar-widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
            <div>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCount(stats.total_threads)}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Threads</div>
            </div>
            <div>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCount(stats.total_posts)}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Messages</div>
            </div>
            <div>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCount(stats.total_members)}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Members</div>
            </div>
            <div>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {stats.latest_member ? (
                  <Link href={`/profile/${stats.latest_member}`} style={{ color: 'var(--link-color)', textDecoration: 'none' }}>
                    {stats.latest_member}
                  </Link>
                ) : 'N/A'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Latest Member</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
