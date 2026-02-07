import Link from 'next/link';
import type { Post } from '@/lib/types';
import { formatTimestamp, formatDate, stringToColor, renderPostContent } from '@/lib/utils';
import PostActions from './PostActions';

interface PostViewProps {
  post: Post;
  isOP?: boolean;
  threadId?: number;
}

export default function PostView({ post, isOP, threadId }: PostViewProps) {
  const avatarColor = stringToColor(post.author_username || 'U');
  const initial = (post.author_username || 'U').charAt(0).toUpperCase();

  // Map role to display text
  const roleDisplay: Record<string, string> = {
    admin: 'Administrator',
    moderator: 'Moderator',
    member: 'Member',
  };

  const roleColor: Record<string, string> = {
    admin: 'var(--accent-red)',
    moderator: 'var(--accent-orange)',
    member: 'var(--text-muted)',
  };

  return (
    <div className="post-container" id={`post-${post.id}`}>
      {/* User sidebar */}
      <div className="post-sidebar">
        {/* Avatar */}
        <Link href={`/profile/${post.author_username}`} style={{ textDecoration: 'none' }}>
          <div
            className="avatar-circle"
            style={{ background: avatarColor, margin: '0 auto 8px auto' }}
          >
            {initial}
          </div>
        </Link>

        {/* Username */}
        <Link
          href={`/profile/${post.author_username}`}
          style={{
            color: 'var(--link-color)',
            fontWeight: '600',
            fontSize: '13px',
            textDecoration: 'none',
            display: 'block',
          }}
        >
          {post.author_username}
        </Link>

        {/* Role badge */}
        <div style={{
          fontSize: '10px',
          color: roleColor[post.author_role || 'member'],
          fontWeight: '600',
          marginTop: '2px',
          textTransform: 'uppercase',
        }}>
          {roleDisplay[post.author_role || 'member'] || 'Member'}
        </div>

        {/* User stats */}
        <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          <div>Joined: {post.author_created_at ? formatDate(post.author_created_at) : 'N/A'}</div>
          <div>Posts: {post.author_post_count || 0}</div>
        </div>
      </div>

      {/* Post content area */}
      <div className="post-content">
        {/* Post header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border-light)',
          marginBottom: '10px',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {formatTimestamp(post.created_at)}
            {isOP && (
              <span style={{
                background: 'var(--accent-teal)',
                color: '#fff',
                fontSize: '9px',
                fontWeight: '700',
                padding: '1px 5px',
                borderRadius: '2px',
                marginLeft: '8px',
                textTransform: 'uppercase',
              }}>
                OP
              </span>
            )}
            {post.is_edited === 1 && (
              <span style={{ fontStyle: 'italic', marginLeft: '8px' }}>
                (edited {post.edited_at ? formatTimestamp(post.edited_at) : ''})
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              #{post.id}
            </span>
          </div>
        </div>

        {/* Post body */}
        <div
          style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: renderPostContent(post.content) }}
        />

        {/* Post actions (report, mod tools) */}
        <PostActions postId={post.id} threadId={threadId} />
      </div>
    </div>
  );
}
