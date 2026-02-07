/**
 * Database query functions used by server components and API routes.
 * All queries use parameterized statements to prevent SQL injection.
 */

import { getDb } from './db';
import type { Category, Subforum, Thread, Post, User, ForumStats } from './types';

/**
 * Get all categories with their subforums, ordered by sort_order.
 */
export function getCategoriesWithSubforums(): Category[] {
  const db = getDb();

  const categories = db.prepare(
    'SELECT * FROM categories ORDER BY sort_order ASC'
  ).all() as Category[];

  const subforums = db.prepare(`
    SELECT s.*, t.title as last_thread_title
    FROM subforums s
    LEFT JOIN threads t ON t.id = s.last_thread_id
    ORDER BY s.sort_order ASC
  `).all() as (Subforum & { last_thread_title?: string })[];

  // Group subforums by category
  const subforumsByCategory: Record<number, Subforum[]> = {};
  for (const sf of subforums) {
    if (!subforumsByCategory[sf.category_id]) {
      subforumsByCategory[sf.category_id] = [];
    }
    subforumsByCategory[sf.category_id].push(sf);
  }

  return categories.map((cat) => ({
    ...cat,
    subforums: subforumsByCategory[cat.id] || [],
  }));
}

/**
 * Get a single subforum by ID.
 */
export function getSubforum(id: number): Subforum | undefined {
  const db = getDb();
  return db.prepare(`
    SELECT s.*, c.name as category_name
    FROM subforums s
    JOIN categories c ON c.id = s.category_id
    WHERE s.id = ?
  `).get(id) as (Subforum & { category_name: string }) | undefined;
}

/**
 * Get threads in a subforum, paginated.
 * Sticky threads come first, then sorted by last_post_at descending.
 */
export function getThreadsBySubforum(
  subforumId: number,
  page: number = 1,
  perPage: number = 20
): { threads: Thread[]; total: number } {
  const db = getDb();
  const offset = (page - 1) * perPage;

  const total = (db.prepare(
    'SELECT COUNT(*) as count FROM threads WHERE subforum_id = ?'
  ).get(subforumId) as { count: number }).count;

  const threads = db.prepare(`
    SELECT t.*, u.username as author_username
    FROM threads t
    JOIN users u ON u.id = t.user_id
    WHERE t.subforum_id = ?
    ORDER BY t.is_sticky DESC, t.last_post_at DESC
    LIMIT ? OFFSET ?
  `).all(subforumId, perPage, offset) as Thread[];

  return { threads, total };
}

/**
 * Get a single thread by ID, incrementing view count.
 */
export function getThread(id: number): (Thread & { subforum_name?: string; category_id?: number; category_name?: string }) | undefined {
  const db = getDb();

  // Increment view count
  db.prepare('UPDATE threads SET view_count = view_count + 1 WHERE id = ?').run(id);

  return db.prepare(`
    SELECT t.*, u.username as author_username, s.name as subforum_name, s.category_id, c.name as category_name
    FROM threads t
    JOIN users u ON u.id = t.user_id
    JOIN subforums s ON s.id = t.subforum_id
    JOIN categories c ON c.id = s.category_id
    WHERE t.id = ?
  `).get(id) as (Thread & { subforum_name?: string; category_id?: number; category_name?: string }) | undefined;
}

/**
 * Get posts in a thread, paginated.
 */
export function getPostsByThread(
  threadId: number,
  page: number = 1,
  perPage: number = 20
): { posts: Post[]; total: number } {
  const db = getDb();
  const offset = (page - 1) * perPage;

  const total = (db.prepare(
    'SELECT COUNT(*) as count FROM posts WHERE thread_id = ?'
  ).get(threadId) as { count: number }).count;

  const posts = db.prepare(`
    SELECT p.*, u.username as author_username, u.role as author_role,
           u.post_count as author_post_count, u.created_at as author_created_at,
           u.avatar_path as author_avatar_path
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.thread_id = ?
    ORDER BY p.created_at ASC
    LIMIT ? OFFSET ?
  `).all(threadId, perPage, offset) as Post[];

  return { posts, total };
}

/**
 * Get a user profile by username.
 */
export function getUserByUsername(username: string): User | undefined {
  const db = getDb();
  return db.prepare(
    'SELECT id, username, role, avatar_path, bio, post_count, reputation_score, created_at, last_seen FROM users WHERE username = ?'
  ).get(username) as User | undefined;
}

/**
 * Get recent posts by a user.
 */
export function getRecentPostsByUser(userId: string, limit: number = 10): (Post & { thread_title?: string })[] {
  const db = getDb();
  return db.prepare(`
    SELECT p.*, t.title as thread_title
    FROM posts p
    JOIN threads t ON t.id = p.thread_id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
    LIMIT ?
  `).all(userId, limit) as (Post & { thread_title?: string })[];
}

/**
 * Get forum-wide statistics.
 */
export function getForumStats(): ForumStats {
  const db = getDb();

  const threadCount = (db.prepare('SELECT COUNT(*) as count FROM threads').get() as { count: number }).count;
  const postCount = (db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number }).count;
  const memberCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  const latestMember = db.prepare('SELECT username FROM users ORDER BY created_at DESC LIMIT 1').get() as { username: string } | undefined;

  // "Online" = users seen in last 15 minutes (since we do not track real presence,
  // we just show all users for the seed data demo)
  const onlineMembers = db.prepare(`
    SELECT username FROM users ORDER BY last_seen DESC LIMIT 10
  `).all() as { username: string }[];

  return {
    total_threads: threadCount,
    total_posts: postCount,
    total_members: memberCount,
    latest_member: latestMember?.username || null,
    online_members: onlineMembers.map((u) => u.username),
  };
}

/**
 * Get recently active threads across all subforums.
 */
export function getRecentActiveThreads(limit: number = 5): (Thread & { subforum_name?: string })[] {
  const db = getDb();
  return db.prepare(`
    SELECT t.*, u.username as author_username, s.name as subforum_name
    FROM threads t
    JOIN users u ON u.id = t.user_id
    JOIN subforums s ON s.id = t.subforum_id
    ORDER BY t.last_post_at DESC
    LIMIT ?
  `).all(limit) as (Thread & { subforum_name?: string })[];
}

/**
 * Get newest threads.
 */
export function getNewThreads(limit: number = 5): (Thread & { subforum_name?: string })[] {
  const db = getDb();
  return db.prepare(`
    SELECT t.*, u.username as author_username, s.name as subforum_name
    FROM threads t
    JOIN users u ON u.id = t.user_id
    JOIN subforums s ON s.id = t.subforum_id
    ORDER BY t.created_at DESC
    LIMIT ?
  `).all(limit) as (Thread & { subforum_name?: string })[];
}
