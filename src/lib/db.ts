import Database from 'better-sqlite3';
import path from 'path';

// Database file lives at project root
const DB_PATH = path.join(process.cwd(), 'forum.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      role TEXT NOT NULL DEFAULT 'member',
      avatar_path TEXT DEFAULT NULL,
      bio TEXT DEFAULT '',
      post_count INTEGER NOT NULL DEFAULT 0,
      reputation_score INTEGER NOT NULL DEFAULT 0,
      last_seen TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS subforums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      icon_color TEXT DEFAULT '#4A9B9B',
      icon_label TEXT DEFAULT 'SF',
      thread_count INTEGER NOT NULL DEFAULT 0,
      post_count INTEGER NOT NULL DEFAULT 0,
      last_thread_id INTEGER DEFAULT NULL,
      last_post_at TEXT DEFAULT NULL,
      last_post_username TEXT DEFAULT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subforum_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_sticky INTEGER NOT NULL DEFAULT 0,
      is_locked INTEGER NOT NULL DEFAULT 0,
      is_announcement INTEGER NOT NULL DEFAULT 0,
      view_count INTEGER NOT NULL DEFAULT 0,
      reply_count INTEGER NOT NULL DEFAULT 0,
      last_post_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_post_user_id TEXT DEFAULT NULL,
      last_post_username TEXT DEFAULT NULL,
      FOREIGN KEY (subforum_id) REFERENCES subforums(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      edited_at TEXT DEFAULT NULL,
      is_edited INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (thread_id) REFERENCES threads(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      reaction_type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(post_id, user_id, reaction_type)
    );

    CREATE TABLE IF NOT EXISTS private_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_read INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (recipient_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      reporter_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_by TEXT DEFAULT NULL,
      reviewed_at TEXT DEFAULT NULL,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS moderation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      moderator_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      reason TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (moderator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS forum_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_threads_subforum ON threads(subforum_id);
    CREATE INDEX IF NOT EXISTS idx_threads_last_post ON threads(last_post_at DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_thread ON posts(thread_id);
    CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_subforums_category ON subforums(category_id);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_reports_post ON reports(post_id);
    CREATE INDEX IF NOT EXISTS idx_moderation_log_moderator ON moderation_log(moderator_id);
  `);

  // Run migrations for columns that may not exist in older databases
  runMigrations(db);

  // Seed default forum settings if the table is empty
  seedForumSettings(db);
}

function runMigrations(db: Database.Database): void {
  // Add is_banned and ban_reason columns to users if not present
  const userColumns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  const columnNames = userColumns.map((c) => c.name);

  if (!columnNames.includes('is_banned')) {
    db.exec("ALTER TABLE users ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0");
  }
  if (!columnNames.includes('ban_reason')) {
    db.exec("ALTER TABLE users ADD COLUMN ban_reason TEXT DEFAULT ''");
  }
}

function seedForumSettings(db: Database.Database): void {
  const count = (db.prepare('SELECT COUNT(*) as count FROM forum_settings').get() as { count: number }).count;
  if (count === 0) {
    const defaults: Record<string, string> = {
      forum_name: 'Solidarity Forum',
      forum_description: 'A community forum',
      primary_color: '#2B4A4D',
      secondary_color: '#4A9B9B',
      accent_color: '#D4A843',
      background_color: '#E8ECEF',
      content_bg_color: '#FFFFFF',
      text_color: '#333333',
      link_color: '#1A6B8A',
      header_bg_color: '#2B4A4D',
      header_text_color: '#FFFFFF',
      category_header_color: '#3A6367',
      font_family: 'system-ui, -apple-system, sans-serif',
      font_size_base: '14px',
      border_radius: '4px',
      content_width: '1200px',
      logo_text: 'SOLIDARITY FORUM',
      custom_css: '',
      dark_mode_enabled: 'false',
      dark_bg_color: '#1a1a2e',
      dark_content_bg: '#16213e',
      dark_text_color: '#e0e0e0',
      dark_header_bg: '#0f3460',
    };

    const insert = db.prepare('INSERT INTO forum_settings (key, value) VALUES (?, ?)');
    const transaction = db.transaction(() => {
      for (const [key, value] of Object.entries(defaults)) {
        insert.run(key, value);
      }
    });
    transaction();
  }
}
