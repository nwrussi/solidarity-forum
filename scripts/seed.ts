/**
 * Database seed script for Solidarity Forum.
 * Run with: npx tsx scripts/seed.ts
 *
 * Creates sample categories, subforums, users, threads, and posts.
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'forum.db');

// Delete existing database to start fresh
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('Removed existing database.');
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create schema
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
    last_seen TEXT DEFAULT NULL,
    is_banned INTEGER NOT NULL DEFAULT 0,
    ban_reason TEXT DEFAULT ''
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

  CREATE INDEX IF NOT EXISTS idx_threads_subforum ON threads(subforum_id);
  CREATE INDEX IF NOT EXISTS idx_threads_last_post ON threads(last_post_at DESC);
  CREATE INDEX IF NOT EXISTS idx_posts_thread ON posts(thread_id);
  CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
  CREATE INDEX IF NOT EXISTS idx_subforums_category ON subforums(category_id);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE TABLE IF NOT EXISTS forum_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
  CREATE INDEX IF NOT EXISTS idx_reports_post ON reports(post_id);
  CREATE INDEX IF NOT EXISTS idx_moderation_log_moderator ON moderation_log(moderator_id);
`);

console.log('Schema created.');

// --- Seed Users ---
const SALT_ROUNDS = 10;

interface SeedUser {
  id: string;
  username: string;
  password: string;
  role: string;
  bio: string;
  created_at: string;
}

const seedUsers: SeedUser[] = [
  {
    id: uuidv4(),
    username: 'Admin',
    password: 'admin123',
    role: 'admin',
    bio: 'Forum administrator.',
    created_at: '2024-01-01 00:00:00',
  },
  {
    id: uuidv4(),
    username: 'Moderator',
    password: 'mod123',
    role: 'moderator',
    bio: 'Keeping the peace.',
    created_at: '2024-01-15 00:00:00',
  },
  {
    id: uuidv4(),
    username: 'AnonymousUser',
    password: 'user123',
    role: 'member',
    bio: 'Just a regular poster.',
    created_at: '2024-02-01 00:00:00',
  },
  {
    id: uuidv4(),
    username: 'NightOwl',
    password: 'user123',
    role: 'member',
    bio: 'I post at 3 AM.',
    created_at: '2024-03-10 00:00:00',
  },
  {
    id: uuidv4(),
    username: 'LurkMaster',
    password: 'user123',
    role: 'member',
    bio: '',
    created_at: '2024-04-20 00:00:00',
  },
  {
    id: uuidv4(),
    username: 'DebateChamp',
    password: 'user123',
    role: 'member',
    bio: 'I will argue about anything.',
    created_at: '2024-05-05 00:00:00',
  },
  {
    id: uuidv4(),
    username: 'TechWizard',
    password: 'user123',
    role: 'member',
    bio: 'Linux enthusiast and privacy advocate.',
    created_at: '2024-06-12 00:00:00',
  },
  {
    id: uuidv4(),
    username: 'BookWorm',
    password: 'user123',
    role: 'member',
    bio: 'Currently reading too many books at once.',
    created_at: '2024-07-18 00:00:00',
  },
];

const insertUser = db.prepare(`
  INSERT INTO users (id, username, password_hash, role, bio, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const userMap: Record<string, string> = {};

for (const user of seedUsers) {
  const hash = bcrypt.hashSync(user.password, SALT_ROUNDS);
  insertUser.run(user.id, user.username, hash, user.role, user.bio, user.created_at);
  userMap[user.username] = user.id;
}

console.log(`Created ${seedUsers.length} users.`);

// --- Seed Categories ---
interface SeedCategory {
  name: string;
  description: string;
  sort_order: number;
}

const seedCategories: SeedCategory[] = [
  { name: 'Community Hub', description: 'Announcements and general community discussion', sort_order: 1 },
  { name: 'General Discussion', description: 'Talk about anything and everything', sort_order: 2 },
  { name: 'Culture & Media', description: 'Books, games, movies, music, and more', sort_order: 3 },
  { name: 'Technology & Science', description: 'Computers, programming, science, and tech news', sort_order: 4 },
  { name: 'The Agora', description: 'Debates, news, politics, and serious discussion', sort_order: 5 },
  { name: 'Meta', description: 'Forum discussion and feedback', sort_order: 6 },
];

const insertCategory = db.prepare(`
  INSERT INTO categories (name, description, sort_order)
  VALUES (?, ?, ?)
`);

for (const cat of seedCategories) {
  insertCategory.run(cat.name, cat.description, cat.sort_order);
}

console.log(`Created ${seedCategories.length} categories.`);

// --- Seed Subforums ---
interface SeedSubforum {
  category_id: number;
  name: string;
  description: string;
  sort_order: number;
  icon_color: string;
  icon_label: string;
}

const seedSubforums: SeedSubforum[] = [
  // Community Hub (cat 1)
  { category_id: 1, name: 'Announcements', description: 'Official forum announcements and news.', sort_order: 1, icon_color: '#E67E22', icon_label: 'AN' },
  { category_id: 1, name: 'Introductions', description: 'New here? Say hello (or not).', sort_order: 2, icon_color: '#27AE60', icon_label: 'HI' },

  // General Discussion (cat 2)
  { category_id: 2, name: 'Off-Topic', description: 'Anything goes. Talk about whatever is on your mind.', sort_order: 1, icon_color: '#3498DB', icon_label: 'OT' },
  { category_id: 2, name: 'Random', description: 'Shitposting, memes, and low-effort content.', sort_order: 2, icon_color: '#9B59B6', icon_label: 'RN' },
  { category_id: 2, name: 'Health & Fitness', description: 'Diet, exercise, mental health, and wellness.', sort_order: 3, icon_color: '#2ECC71', icon_label: 'HF' },
  { category_id: 2, name: 'Food & Cooking', description: 'Recipes, restaurants, and culinary adventures.', sort_order: 4, icon_color: '#E74C3C', icon_label: 'FC' },

  // Culture & Media (cat 3)
  { category_id: 3, name: 'Art & Literature', description: 'Books, poetry, visual art, and creative writing.', sort_order: 1, icon_color: '#8E44AD', icon_label: 'AL' },
  { category_id: 3, name: 'Games', description: 'Video games, board games, tabletop RPGs.', sort_order: 2, icon_color: '#E74C3C', icon_label: 'GM' },
  { category_id: 3, name: 'Film & Television', description: 'Movies, TV shows, streaming, and media discussion.', sort_order: 3, icon_color: '#F39C12', icon_label: 'FT' },
  { category_id: 3, name: 'Music', description: 'All genres, all eras. Share and discuss music.', sort_order: 4, icon_color: '#1ABC9C', icon_label: 'MU' },

  // Technology & Science (cat 4)
  { category_id: 4, name: 'Internet & Technology', description: 'Tech news, gadgets, software, and the internet.', sort_order: 1, icon_color: '#2980B9', icon_label: 'IT' },
  { category_id: 4, name: 'Programming', description: 'Code, development, open source, and hacking.', sort_order: 2, icon_color: '#16A085', icon_label: 'PR' },
  { category_id: 4, name: 'Privacy & Security', description: 'OPSEC, encryption, anonymity, and digital rights.', sort_order: 3, icon_color: '#2C3E50', icon_label: 'PS' },
  { category_id: 4, name: 'Science', description: 'Physics, biology, chemistry, space, and research.', sort_order: 4, icon_color: '#D35400', icon_label: 'SC' },

  // The Agora (cat 5)
  { category_id: 5, name: 'Articles & News', description: 'Current events and news articles worth discussing.', sort_order: 1, icon_color: '#C0392B', icon_label: 'NW' },
  { category_id: 5, name: 'Deep Thoughts', description: 'Philosophy, ethics, and existential musings.', sort_order: 2, icon_color: '#7F8C8D', icon_label: 'DT' },
  { category_id: 5, name: 'Debates', description: 'Structured arguments and serious discourse.', sort_order: 3, icon_color: '#E67E22', icon_label: 'DB' },

  // Meta (cat 6)
  { category_id: 6, name: 'Forum Discussion', description: 'Feedback, suggestions, and discussion about the forum itself.', sort_order: 1, icon_color: '#95A5A6', icon_label: 'FD' },
  { category_id: 6, name: 'Bug Reports', description: 'Found a bug? Report it here.', sort_order: 2, icon_color: '#E74C3C', icon_label: 'BG' },
];

const insertSubforum = db.prepare(`
  INSERT INTO subforums (category_id, name, description, sort_order, icon_color, icon_label)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const sf of seedSubforums) {
  insertSubforum.run(sf.category_id, sf.name, sf.description, sf.sort_order, sf.icon_color, sf.icon_label);
}

console.log(`Created ${seedSubforums.length} subforums.`);

// --- Seed Threads and Posts ---

interface SeedThread {
  subforum_id: number;
  username: string;
  title: string;
  content: string;
  created_at: string;
  is_sticky?: number;
  replies?: { username: string; content: string; created_at: string }[];
}

const seedThreads: SeedThread[] = [
  // Announcements
  {
    subforum_id: 1,
    username: 'Admin',
    title: 'Welcome to Solidarity Forum',
    content: `Welcome to Solidarity Forum!\n\nThis is a community built on the principle of anonymity. We do not collect email addresses, phone numbers, or any personal information beyond your chosen username and password.\n\n**Important:** Please save your recovery codes when you register. If you lose your password and recovery codes, your account cannot be recovered. This is by design.\n\nRules:\n1. No doxxing or posting of personal information\n2. No illegal content\n3. Be civil in debates — attack arguments, not people\n4. NSFW content must be spoiler-tagged\n5. No spam or commercial advertising\n\nEnjoy the forum.`,
    created_at: '2024-01-01 12:00:00',
    is_sticky: 1,
    replies: [
      { username: 'AnonymousUser', content: 'Great to be here. Love the no-email signup.', created_at: '2024-01-02 08:30:00' },
      { username: 'NightOwl', content: 'Finally a forum that respects privacy. Looking forward to contributing.', created_at: '2024-01-02 15:45:00' },
    ],
  },
  {
    subforum_id: 1,
    username: 'Admin',
    title: 'Forum Rules and Guidelines',
    content: `Please read the rules before posting.\n\nViolations will result in warnings. Repeated violations will result in bans.\n\nThe moderation team reserves the right to remove any content that violates these rules or is deemed harmful to the community.`,
    created_at: '2024-01-01 12:30:00',
    is_sticky: 1,
  },

  // Introductions
  {
    subforum_id: 2,
    username: 'NightOwl',
    title: 'Hello from a night dweller',
    content: `Hey everyone. I mostly post late at night when I can't sleep. Looking forward to some good late-night discussions.`,
    created_at: '2024-03-10 03:00:00',
    replies: [
      { username: 'AnonymousUser', content: 'Welcome! You will find plenty of us online at odd hours.', created_at: '2024-03-10 03:15:00' },
    ],
  },
  {
    subforum_id: 2,
    username: 'TechWizard',
    title: 'Privacy enthusiast checking in',
    content: `Found this place through a recommendation. Love that there is no email required. Running Tor so glad the forum does not block it.`,
    created_at: '2024-06-12 14:00:00',
  },

  // Off-Topic
  {
    subforum_id: 3,
    username: 'AnonymousUser',
    title: 'What are you doing right now?',
    content: `The classic forum thread. Post what you are currently doing.\n\nI am drinking coffee and browsing this forum.`,
    created_at: '2024-02-15 10:00:00',
    replies: [
      { username: 'NightOwl', content: 'Trying to fix my sleep schedule. It is not going well.', created_at: '2024-02-15 04:30:00' },
      { username: 'BookWorm', content: 'Reading "The Brothers Karamazov" for the third time.', created_at: '2024-02-15 11:00:00' },
      { username: 'LurkMaster', content: 'Lurking, as usual.', created_at: '2024-02-15 12:00:00' },
      { username: 'TechWizard', content: 'Configuring my new NixOS setup. Almost done (said that 3 hours ago).', created_at: '2024-02-15 16:00:00' },
    ],
  },
  {
    subforum_id: 3,
    username: 'DebateChamp',
    title: 'Hot take: pineapple belongs on pizza',
    content: `I will die on this hill. Hawaiian pizza is delicious and the sweet-savory combination is objectively good. Fight me.`,
    created_at: '2024-05-10 18:00:00',
    replies: [
      { username: 'NightOwl', content: 'You are objectively wrong and I can prove it mathematically.', created_at: '2024-05-10 18:30:00' },
      { username: 'AnonymousUser', content: 'Based take. Pineapple pizza haters are cowards.', created_at: '2024-05-10 19:00:00' },
    ],
  },

  // Random
  {
    subforum_id: 4,
    username: 'LurkMaster',
    title: 'Post count thread - post here to increase your count',
    content: `This thread exists solely so we can all pad our post counts. Go.`,
    created_at: '2024-04-20 20:00:00',
    replies: [
      { username: 'NightOwl', content: '+1', created_at: '2024-04-20 20:01:00' },
      { username: 'AnonymousUser', content: '+1', created_at: '2024-04-20 20:02:00' },
      { username: 'DebateChamp', content: 'This is beneath me. But also +1.', created_at: '2024-04-20 20:03:00' },
    ],
  },

  // Art & Literature
  {
    subforum_id: 7,
    username: 'BookWorm',
    title: 'What are you reading right now?',
    content: `Share what books you are currently reading.\n\nI just started "Blood Meridian" by Cormac McCarthy. The prose is incredible but extremely violent.`,
    created_at: '2024-07-20 09:00:00',
    replies: [
      { username: 'DebateChamp', content: '"Meditations" by Marcus Aurelius. Essential reading for anyone interested in stoicism.', created_at: '2024-07-20 10:00:00' },
      { username: 'NightOwl', content: 'Re-reading "Neuromancer" by William Gibson. Cyberpunk classic.', created_at: '2024-07-21 02:00:00' },
    ],
  },

  // Games
  {
    subforum_id: 8,
    username: 'NightOwl',
    title: 'Best games to play at 3 AM?',
    content: `Looking for games that hit different when played in the dead of night. Horror games are obvious but I am open to anything atmospheric.`,
    created_at: '2024-08-01 03:00:00',
    replies: [
      { username: 'LurkMaster', content: 'Outer Wilds. Trust me. Play it blind.', created_at: '2024-08-01 08:00:00' },
      { username: 'TechWizard', content: 'Factorio. You will look up and it will be 6 AM.', created_at: '2024-08-01 14:00:00' },
    ],
  },

  // Internet & Technology
  {
    subforum_id: 11,
    username: 'TechWizard',
    title: 'Linux distro tier list 2024',
    content: `S tier: Arch, NixOS, Void\nA tier: Fedora, Debian\nB tier: Ubuntu, Mint\nC tier: Manjaro (sorry)\nD tier: Pop!_OS (fight me)\n\nDiscuss.`,
    created_at: '2024-06-15 11:00:00',
    replies: [
      { username: 'DebateChamp', content: 'Imagine not putting Gentoo in S tier. Do you even compile?', created_at: '2024-06-15 12:00:00' },
      { username: 'AnonymousUser', content: 'Ubuntu works fine for 90% of people. This elitism is tiresome.', created_at: '2024-06-15 13:00:00' },
      { username: 'NightOwl', content: 'I use Arch btw.', created_at: '2024-06-16 01:00:00' },
    ],
  },

  // Privacy & Security
  {
    subforum_id: 13,
    username: 'TechWizard',
    title: 'Essential privacy tools everyone should use',
    content: `Here is my recommended starter pack for digital privacy:\n\n- **Browser:** Firefox with uBlock Origin, or Tor Browser\n- **Search Engine:** DuckDuckGo or SearXNG\n- **Email:** ProtonMail or Tutanota\n- **Messaging:** Signal or Session\n- **VPN:** Mullvad or ProtonVPN\n- **Password Manager:** KeePassXC or Bitwarden\n- **2FA:** Aegis Authenticator (Android) or Raivo OTP (iOS)\n\nFeel free to add your own recommendations.`,
    created_at: '2024-06-20 15:00:00',
    replies: [
      { username: 'Moderator', content: 'Pinned. Great resource for newcomers.', created_at: '2024-06-20 16:00:00' },
      { username: 'NightOwl', content: 'I would add GrapheneOS for phone OS. Stock Android and iOS are surveillance machines.', created_at: '2024-06-21 03:00:00' },
    ],
  },

  // Debates
  {
    subforum_id: 17,
    username: 'DebateChamp',
    title: 'Is true anonymity possible on the modern internet?',
    content: `With advanced fingerprinting, AI-powered traffic analysis, and the increasing centralization of the internet, is it actually possible to be truly anonymous online anymore?\n\nI argue it is becoming exponentially harder but still achievable for those willing to put in the effort. Thoughts?`,
    created_at: '2024-05-15 14:00:00',
    replies: [
      { username: 'TechWizard', content: 'True anonymity requires operational security at every layer. One mistake can unravel everything. It is possible, but the margin for error is razor thin.', created_at: '2024-05-15 15:00:00' },
      { username: 'AnonymousUser', content: 'For most people, "good enough" anonymity is achievable. You do not need to be invisible, just not worth the effort to track.', created_at: '2024-05-15 16:00:00' },
      { username: 'Moderator', content: 'This is exactly the kind of discussion this forum was built for. Great thread.', created_at: '2024-05-15 17:00:00' },
    ],
  },

  // Forum Discussion
  {
    subforum_id: 18,
    username: 'AnonymousUser',
    title: 'Feature request: Dark mode',
    content: `Can we get a dark mode toggle? My eyes are burning at 2 AM. NightOwl, back me up here.`,
    created_at: '2024-08-10 22:00:00',
    replies: [
      { username: 'NightOwl', content: 'Absolutely. I need this more than anyone.', created_at: '2024-08-10 23:00:00' },
      { username: 'Admin', content: 'It is on the roadmap. We will get to it.', created_at: '2024-08-11 10:00:00' },
    ],
  },
];

const insertThread = db.prepare(`
  INSERT INTO threads (subforum_id, user_id, title, created_at, is_sticky, is_locked, is_announcement, view_count, reply_count, last_post_at, last_post_user_id, last_post_username)
  VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?)
`);

const insertPost = db.prepare(`
  INSERT INTO posts (thread_id, user_id, content, created_at)
  VALUES (?, ?, ?, ?)
`);

const updateSubforum = db.prepare(`
  UPDATE subforums SET thread_count = ?, post_count = ?, last_thread_id = ?, last_post_at = ?, last_post_username = ?
  WHERE id = ?
`);

const updateUserPostCount = db.prepare(`
  UPDATE users SET post_count = ? WHERE id = ?
`);

// Track post counts
const postCounts: Record<string, number> = {};

// Track subforum stats
const subforumStats: Record<number, { threadCount: number; postCount: number; lastThreadId: number; lastPostAt: string; lastPostUsername: string }> = {};

for (const threadData of seedThreads) {
  const userId = userMap[threadData.username];
  const replyCount = threadData.replies?.length || 0;
  const viewCount = Math.floor(Math.random() * 500) + 50;

  // Determine last post info
  let lastPostAt = threadData.created_at;
  let lastPostUserId = userId;
  let lastPostUsername = threadData.username;

  if (threadData.replies && threadData.replies.length > 0) {
    const lastReply = threadData.replies[threadData.replies.length - 1];
    lastPostAt = lastReply.created_at;
    lastPostUserId = userMap[lastReply.username];
    lastPostUsername = lastReply.username;
  }

  const result = insertThread.run(
    threadData.subforum_id,
    userId,
    threadData.title,
    threadData.created_at,
    threadData.is_sticky || 0,
    viewCount,
    replyCount,
    lastPostAt,
    lastPostUserId,
    lastPostUsername
  );

  const threadId = Number(result.lastInsertRowid);

  // Insert OP post
  insertPost.run(threadId, userId, threadData.content, threadData.created_at);
  postCounts[threadData.username] = (postCounts[threadData.username] || 0) + 1;

  // Insert replies
  if (threadData.replies) {
    for (const reply of threadData.replies) {
      const replyUserId = userMap[reply.username];
      insertPost.run(threadId, replyUserId, reply.content, reply.created_at);
      postCounts[reply.username] = (postCounts[reply.username] || 0) + 1;
    }
  }

  // Update subforum stats
  const sfId = threadData.subforum_id;
  const totalPostsInThread = 1 + replyCount;
  if (!subforumStats[sfId]) {
    subforumStats[sfId] = { threadCount: 0, postCount: 0, lastThreadId: 0, lastPostAt: '', lastPostUsername: '' };
  }
  subforumStats[sfId].threadCount += 1;
  subforumStats[sfId].postCount += totalPostsInThread;
  if (lastPostAt > subforumStats[sfId].lastPostAt) {
    subforumStats[sfId].lastThreadId = threadId;
    subforumStats[sfId].lastPostAt = lastPostAt;
    subforumStats[sfId].lastPostUsername = lastPostUsername;
  }
}

// Update subforum stats in DB
for (const [sfId, stats] of Object.entries(subforumStats)) {
  updateSubforum.run(stats.threadCount, stats.postCount, stats.lastThreadId, stats.lastPostAt, stats.lastPostUsername, Number(sfId));
}

// Update user post counts
for (const [username, count] of Object.entries(postCounts)) {
  updateUserPostCount.run(count, userMap[username]);
}

console.log(`Created ${seedThreads.length} threads with replies.`);

// --- Seed Forum Settings ---
const defaultSettings: Record<string, string> = {
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

const insertSetting = db.prepare('INSERT INTO forum_settings (key, value) VALUES (?, ?)');
const settingsTransaction = db.transaction(() => {
  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value);
  }
});
settingsTransaction();

console.log(`Created ${Object.keys(defaultSettings).length} forum settings.`);
console.log('Database seeded successfully!');

db.close();
