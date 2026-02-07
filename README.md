# Solidarity Forum

An anonymous, persistent-account forum built with Next.js. No email or personal information required to register.

## Setup

```bash
npm install
npm run seed    # populate database with sample data
npm run dev     # start dev server at http://localhost:3000
```

## Test Accounts

| Username    | Password   | Role      |
|-------------|------------|-----------|
| Admin       | admin123   | admin     |
| Moderator   | mod123     | moderator |
| AnonymousUser | user123  | member    |

Admin panel: http://localhost:3000/admin (admin login required)

## Tech Stack

- **Next.js 14+** (App Router) — pages and API routes
- **TypeScript** — type safety
- **Tailwind CSS** — styling
- **SQLite** (better-sqlite3) — database
- **bcrypt** — password hashing
- **iron-session** — encrypted cookie sessions

## Project Structure

```
solidarity-forum/
├── scripts/
│   └── seed.ts                  # Database seed script (sample users, categories, threads)
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Root layout (nav + footer + theme)
│   │   ├── page.tsx             # Home — forum index with categories + sidebar
│   │   ├── globals.css          # Global styles and CSS variables
│   │   │
│   │   ├── forum/[id]/          # Subforum — thread listing
│   │   ├── thread/[id]/         # Thread — posts + reply form
│   │   ├── login/               # Login page
│   │   ├── register/            # Register page (username + password only)
│   │   ├── new-thread/          # Create new thread
│   │   ├── profile/[username]/  # User profile
│   │   │
│   │   ├── admin/               # Admin panel (admin/mod only)
│   │   │   ├── layout.tsx       # Admin layout with sidebar nav
│   │   │   ├── page.tsx         # Dashboard — stats overview
│   │   │   ├── users/           # User management (ban, role changes)
│   │   │   ├── threads/         # Thread moderation (sticky, lock, delete)
│   │   │   ├── posts/           # Post moderation (edit, delete)
│   │   │   ├── categories/      # Category/subforum management
│   │   │   ├── reports/         # Reports queue
│   │   │   └── customization/   # UI theme customization
│   │   │
│   │   └── api/                 # API Routes
│   │       ├── auth/            # register, login, logout, me
│   │       ├── threads/         # Create thread
│   │       ├── posts/           # Create post/reply
│   │       ├── reports/         # Submit report
│   │       ├── subforums/       # List subforums
│   │       ├── settings/theme/  # Public theme settings
│   │       └── admin/           # Admin APIs (users, threads, posts, categories, subforums, reports, settings)
│   │
│   ├── components/
│   │   ├── layout/              # Site-wide layout components
│   │   │   ├── Navigation.tsx   # Header nav bar
│   │   │   ├── Footer.tsx       # Site footer
│   │   │   └── ThemeProvider.tsx # Applies theme CSS variables
│   │   │
│   │   ├── forum/               # Forum content display
│   │   │   ├── CategorySection.tsx  # Collapsible category with subforums
│   │   │   ├── SubforumRow.tsx      # Single subforum row
│   │   │   ├── ThreadRow.tsx        # Single thread row
│   │   │   ├── PostView.tsx         # Full post with author sidebar
│   │   │   └── Breadcrumb.tsx       # Navigation breadcrumb
│   │   │
│   │   ├── forms/               # User input forms
│   │   │   ├── LoginWidget.tsx  # Login form (sidebar + standalone)
│   │   │   └── ReplyForm.tsx    # Thread reply form
│   │   │
│   │   ├── moderation/          # Inline mod tools (shown on forum pages)
│   │   │   ├── ThreadModTools.tsx   # Sticky/lock/delete thread buttons
│   │   │   └── PostActions.tsx      # Report/edit/delete post buttons
│   │   │
│   │   └── sidebar/             # Homepage sidebar
│   │       └── Sidebar.tsx      # Active threads, stats, members online
│   │
│   └── lib/                     # Shared server-side logic
│       ├── db.ts                # Database connection, schema, migrations
│       ├── queries.ts           # Database query functions
│       ├── session.ts           # Session management (iron-session)
│       ├── settings.ts          # Forum customization settings read/write
│       ├── types.ts             # Shared TypeScript interfaces
│       └── utils.ts             # Formatting helpers (dates, counts, post rendering)
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

## Database

SQLite file at `forum.db` (auto-created on first run, gitignored).

**Tables:** users, categories, subforums, threads, posts, reactions, private_messages, reports, forum_settings

## Key Design Decisions

- **No PII collected** — registration requires only username + password
- **No email verification** — accounts are active immediately
- **bcrypt** with 12 salt rounds for password hashing
- **30-day sessions** via encrypted httpOnly cookies
- **Parameterized SQL** everywhere to prevent injection
- **CSS variables** for theming — customizable via admin panel
