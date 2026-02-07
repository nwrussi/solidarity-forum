/**
 * Shared TypeScript types for the Solidarity Forum.
 * These mirror the database schema but are used across components.
 */

export interface User {
  id: string;
  username: string;
  role: string;
  avatar_path: string | null;
  bio: string;
  post_count: number;
  reputation_score: number;
  created_at: string;
  last_seen: string | null;
  is_banned?: number;
  ban_reason?: string;
}

export interface SessionUser {
  id: string;
  username: string;
  role: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  sort_order: number;
  subforums: Subforum[];
}

export interface Subforum {
  id: number;
  category_id: number;
  name: string;
  description: string;
  sort_order: number;
  icon_color: string;
  icon_label: string;
  thread_count: number;
  post_count: number;
  last_thread_id: number | null;
  last_post_at: string | null;
  last_post_username: string | null;
  last_thread_title?: string;
}

export interface Thread {
  id: number;
  subforum_id: number;
  user_id: string;
  title: string;
  created_at: string;
  is_sticky: number;
  is_locked: number;
  is_announcement: number;
  view_count: number;
  reply_count: number;
  last_post_at: string;
  last_post_user_id: string | null;
  last_post_username: string | null;
  // Joined fields
  author_username?: string;
}

export interface Post {
  id: number;
  thread_id: number;
  user_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  is_edited: number;
  // Joined fields
  author_username?: string;
  author_role?: string;
  author_post_count?: number;
  author_created_at?: string;
  author_avatar_path?: string | null;
}

export interface ForumStats {
  total_threads: number;
  total_posts: number;
  total_members: number;
  latest_member: string | null;
  online_members: string[];
}

export interface Report {
  id: number;
  post_id: number;
  reporter_id: string;
  reason: string;
  status: string;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  // Joined fields
  reporter_username?: string;
  post_content?: string;
  post_author_username?: string;
  post_author_id?: string;
  thread_id?: number;
  thread_title?: string;
}

export interface ModerationLog {
  id: number;
  moderator_id: string;
  action: string;
  target_type: string;
  target_id: string;
  reason: string;
  created_at: string;
  moderator_username?: string;
}

export interface AdminStats {
  total_users: number;
  total_threads: number;
  total_posts: number;
  total_messages: number;
  posts_today: number;
  new_members_this_week: number;
  pending_reports: number;
  banned_users: number;
}
