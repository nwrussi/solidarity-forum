import Link from 'next/link';
import type { Subforum } from '@/lib/types';
import { formatCount, formatRelativeTime } from '@/lib/utils';

interface SubforumRowProps {
  subforum: Subforum;
}

export default function SubforumRow({ subforum }: SubforumRowProps) {
  return (
    <div className="subforum-row">
      {/* Icon */}
      <div style={{ marginRight: '12px', flexShrink: 0 }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: subforum.icon_color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '11px',
            fontWeight: '700',
          }}
        >
          {subforum.icon_label}
        </div>
      </div>

      {/* Name and description */}
      <div style={{ flex: '1', minWidth: 0 }}>
        <Link
          href={`/forum/${subforum.id}`}
          style={{
            color: 'var(--link-color)',
            fontWeight: '600',
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          {subforum.name}
        </Link>
        <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px', lineHeight: '1.3' }}>
          {subforum.description}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexShrink: 0, marginLeft: '12px' }}>
        <div style={{ textAlign: 'center', minWidth: '60px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {formatCount(subforum.thread_count)}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Threads</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: '60px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {formatCount(subforum.post_count)}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Messages</div>
        </div>

        {/* Last post info */}
        <div style={{ minWidth: '160px', textAlign: 'right' }}>
          {subforum.last_post_at ? (
            <>
              {subforum.last_thread_title && (
                <div style={{ fontSize: '12px', color: 'var(--link-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                  <Link href={`/thread/${subforum.last_thread_id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {subforum.last_thread_title}
                  </Link>
                </div>
              )}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {formatRelativeTime(subforum.last_post_at)}
                {subforum.last_post_username && (
                  <> &middot; <Link href={`/profile/${subforum.last_post_username}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{subforum.last_post_username}</Link></>
                )}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No posts yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
