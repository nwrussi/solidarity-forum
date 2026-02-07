import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getUserByUsername, getRecentPostsByUser } from '@/lib/queries';
import { formatDate, formatRelativeTime, stringToColor } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  const user = getUserByUsername(decodedUsername);
  if (!user) {
    notFound();
  }

  const recentPosts = getRecentPostsByUser(user.id, 10);
  const avatarColor = stringToColor(user.username);
  const initial = user.username.charAt(0).toUpperCase();

  // Role display
  const roleDisplay: Record<string, string> = {
    admin: 'Administrator',
    moderator: 'Moderator',
    member: 'Member',
  };

  const roleColor: Record<string, string> = {
    admin: '#E74C3C',
    moderator: '#E67E22',
    member: '#3A6367',
  };

  return (
    <div className="forum-container" style={{ paddingTop: '12px', paddingBottom: '24px' }}>
      {/* Profile header card */}
      <div style={{
        background: 'var(--content-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '16px',
      }}>
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--header-bg), var(--nav-bg))',
          height: '100px',
        }} />

        {/* Profile info */}
        <div style={{ padding: '0 20px 20px 20px', position: 'relative' }}>
          {/* Avatar */}
          <div
            className="avatar-circle avatar-large"
            style={{
              background: avatarColor,
              border: '4px solid var(--content-bg)',
              marginTop: '-40px',
              marginBottom: '8px',
            }}
          >
            {initial}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                {user.username}
              </h1>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: roleColor[user.role] || '#3A6367',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}>
                {roleDisplay[user.role] || 'Member'}
              </div>
              {user.bio && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px 0', maxWidth: '500px' }}>
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex',
            gap: '24px',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-light)',
          }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {user.post_count}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Posts</div>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {user.reputation_score}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reputation</div>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {formatDate(user.created_at)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Joined</div>
            </div>
            {user.last_seen && (
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {formatRelativeTime(user.last_seen)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Seen</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent posts */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
        <div className="category-header" style={{ cursor: 'default', borderRadius: '4px 4px 0 0' }}>
          Recent Posts
        </div>
        {recentPosts.length > 0 ? (
          recentPosts.map((post) => (
            <div
              key={post.id}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-light)',
                background: 'var(--content-bg)',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Posted in{' '}
                <Link href={`/thread/${post.thread_id}`} style={{ color: 'var(--link-color)', fontWeight: '500' }}>
                  {post.thread_title || `Thread #${post.thread_id}`}
                </Link>
                {' '}&middot; {formatRelativeTime(post.created_at)}
              </div>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-primary)',
                lineHeight: '1.5',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}>
                {post.content}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', background: 'var(--content-bg)', color: 'var(--text-muted)', fontSize: '13px' }}>
            This user has not made any posts yet.
          </div>
        )}
      </div>
    </div>
  );
}
