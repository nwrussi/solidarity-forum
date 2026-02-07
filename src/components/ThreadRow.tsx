import Link from 'next/link';
import type { Thread } from '@/lib/types';
import { formatCount, formatRelativeTime, stringToColor } from '@/lib/utils';

interface ThreadRowProps {
  thread: Thread;
}

export default function ThreadRow({ thread }: ThreadRowProps) {
  const isSticky = thread.is_sticky === 1;
  const isLocked = thread.is_locked === 1;

  return (
    <div className={`thread-row ${isSticky ? 'sticky' : ''}`}>
      {/* Avatar */}
      <div style={{ marginRight: '10px', flexShrink: 0 }}>
        <div
          className="avatar-circle avatar-small"
          style={{ background: stringToColor(thread.author_username || 'U') }}
        >
          {(thread.author_username || 'U').charAt(0)}
        </div>
      </div>

      {/* Thread info */}
      <div style={{ flex: '1', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isSticky && (
            <span style={{
              background: 'var(--accent-orange)',
              color: '#fff',
              fontSize: '9px',
              fontWeight: '700',
              padding: '1px 5px',
              borderRadius: '2px',
              textTransform: 'uppercase',
            }}>
              Sticky
            </span>
          )}
          {isLocked && (
            <span style={{
              background: 'var(--accent-red)',
              color: '#fff',
              fontSize: '9px',
              fontWeight: '700',
              padding: '1px 5px',
              borderRadius: '2px',
              textTransform: 'uppercase',
            }}>
              Locked
            </span>
          )}
          <Link
            href={`/thread/${thread.id}`}
            style={{
              color: 'var(--text-primary)',
              fontWeight: '600',
              fontSize: '13px',
              textDecoration: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {thread.title}
          </Link>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          <Link href={`/profile/${thread.author_username}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            {thread.author_username}
          </Link>
          {' '}&middot; {formatRelativeTime(thread.created_at)}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexShrink: 0, marginLeft: '12px' }}>
        <div style={{ textAlign: 'center', minWidth: '50px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {formatCount(thread.reply_count)}
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Replies</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: '50px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {formatCount(thread.view_count)}
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Views</div>
        </div>
        <div style={{ minWidth: '120px', textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {formatRelativeTime(thread.last_post_at)}
          </div>
          {thread.last_post_username && (
            <div style={{ fontSize: '11px' }}>
              <Link href={`/profile/${thread.last_post_username}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '11px' }}>
                {thread.last_post_username}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
