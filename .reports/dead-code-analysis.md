# Dead Code Analysis Report

**Project:** Solidarity Forum
**Date:** 2026-02-07
**Tools Used:** depcheck 1.4.7, ts-prune 0.10.3, manual code review
**Initial Build:** PASSING

---

## Summary

| Category | Count |
|----------|-------|
| Unused public assets | 5 files |
| Unused exported functions | 3 functions |
| Unused exported types | 2 types |
| Unused devDependencies (false positives) | 3 packages |
| Duplicate code patterns | 1 pattern |
| Unreachable/dead code | 0 |

---

## 1. SAFE -- Unused Public Assets

The following SVG files in `public/` are default Next.js starter template assets.
They are NOT referenced anywhere in the source code.

| File | Source | Referenced? |
|------|--------|-------------|
| `public/file.svg` | Next.js starter template | NO |
| `public/globe.svg` | Next.js starter template | NO |
| `public/next.svg` | Next.js starter template | NO |
| `public/vercel.svg` | Next.js starter template | NO |
| `public/window.svg` | Next.js starter template | NO |

**Verdict:** SAFE TO REMOVE -- These are leftover template files with zero references.

---

## 2. SAFE -- Unused Exported Functions

### 2a. `getSetting()` in `src/lib/settings.ts` (line 61)

- Exported but never imported anywhere in the codebase.
- The codebase uses `getSettings()` (plural) which fetches all settings at once.
- `getSetting()` fetches a single setting by key.
- Only defined and exported in `src/lib/settings.ts`.
- Zero import references found.

**Verdict:** SAFE TO REMOVE -- No callers exist.

### 2b. `seedDefaultSettings()` in `src/lib/settings.ts` (line 116)

- Exported but never imported anywhere in the codebase.
- A nearly identical function `seedForumSettings()` already exists as a private function in `src/lib/db.ts` (line 172) and is called during database initialization.
- The `scripts/seed.ts` file seeds settings via direct SQL, not this function.

**Verdict:** SAFE TO REMOVE -- Duplicate of internal `db.ts` function; never called.

### 2c. `escapeHtml()` in `src/lib/utils.ts` (line 85)

- Exported, but only called internally by `renderPostContent()` in the same file (line 106).
- No external imports found.
- Since it is used by `renderPostContent()`, the function itself is NOT dead code,
  but the `export` keyword is unnecessary.

**Verdict:** SAFE TO UNEXPORT (change from `export function` to plain `function`) --
The function is used internally but never imported externally.

---

## 3. SAFE -- Unused Exported Types

### 3a. `Report` interface in `src/lib/types.ts` (line 92)

- Exported but never imported by any file.
- The admin reports page (`src/app/admin/reports/page.tsx`) defines its own local
  `AdminReport` interface instead.
- The API routes for reports use inline typing.

**Verdict:** SAFE TO REMOVE -- No imports found. Could be kept for future use, but is
currently dead code.

### 3b. `SessionData` interface in `src/lib/session.ts` (line 8)

- Exported but never imported externally.
- Used internally within `session.ts` as a type parameter for `getIronSession<SessionData>`.
- Components that need session info use the `/api/auth/me` endpoint and the `SessionUser`
  type from `src/lib/types.ts` instead.

**Verdict:** KEEP (CAUTION) -- While not imported externally, it is part of the session
module's public API and removing the export would be a minor API breaking change. The
export is harmless and may be useful for future middleware or custom auth flows.

---

## 4. CAUTION -- devDependencies Flagged by depcheck (FALSE POSITIVES)

depcheck flagged these devDependencies as unused:

| Package | Why flagged | Actual usage |
|---------|-------------|--------------|
| `@tailwindcss/postcss` | Not imported in source | Used by PostCSS config (`postcss.config.mjs`) |
| `@types/react-dom` | Not imported in source | Used by TypeScript for React DOM type checking |
| `tailwindcss` | Not imported in source | Used via `@import "tailwindcss"` in `globals.css` |

**Verdict:** DO NOT REMOVE -- These are all legitimate devDependencies used by the build
toolchain. depcheck does not understand PostCSS config or CSS `@import` directives.

---

## 5. CAUTION -- Duplicate Code Patterns

### 5a. `DEFAULT_SETTINGS` duplication

The same default settings object is defined in THREE places:

1. `src/lib/settings.ts` line 13 (exported as `DEFAULT_SETTINGS`)
2. `src/lib/db.ts` line 175 (inline in `seedForumSettings()`)
3. `src/app/admin/customization/page.tsx` line 9 (local `DEFAULT_SETTINGS` const)

Additionally, `scripts/seed.ts` has its own copy at line 611.

The `customization/page.tsx` copy is a client component that cannot import server-only
modules, so it necessarily maintains its own copy. The `db.ts` copy predates the
`settings.ts` module. The `seed.ts` copy is standalone.

**Verdict:** The `db.ts` inline copy (lines 175-199) could theoretically import from
`settings.ts`, but since both are server-side and the duplication is small and stable,
this is low priority. NOT a cleanup candidate right now since refactoring it risks
changing initialization behavior.

---

## 6. DANGER -- Config Files and Entry Points (DO NOT REMOVE)

The following were flagged by ts-prune as having "unused" default exports. These are
all Next.js convention files whose exports are consumed by the framework, not by
application code:

- `next.config.ts` -- default export (Next.js config)
- `src/app/layout.tsx` -- default export + `metadata` (Root layout)
- `src/app/page.tsx` -- default export + `dynamic` (Home page)
- All `page.tsx` files -- default exports (page components)
- All `route.ts` files -- HTTP method exports (GET, POST, PATCH, DELETE)
- All `layout.tsx` files -- default exports (layout components)

**Verdict:** DO NOT REMOVE -- These are all framework convention exports.

---

## 7. Analysis of All Exports

### `src/lib/utils.ts` -- All exports used

| Export | Used by |
|--------|---------|
| `formatCount` | Sidebar.tsx, SubforumRow.tsx, ThreadRow.tsx |
| `formatRelativeTime` | Sidebar.tsx, SubforumRow.tsx, ThreadRow.tsx, admin pages, profile |
| `formatDate` | PostView.tsx, profile page, admin/users |
| `formatTimestamp` | PostView.tsx |
| `stringToColor` | PostView.tsx, ThreadRow.tsx, profile page |
| `escapeHtml` | Used internally by `renderPostContent` only |
| `renderPostContent` | PostView.tsx |

### `src/lib/queries.ts` -- All exports used

| Export | Used by |
|--------|---------|
| `getCategoriesWithSubforums` | page.tsx (home) |
| `getSubforum` | forum/[id]/page.tsx |
| `getThreadsBySubforum` | forum/[id]/page.tsx |
| `getThread` | thread/[id]/page.tsx |
| `getPostsByThread` | thread/[id]/page.tsx |
| `getUserByUsername` | profile/[username]/page.tsx |
| `getRecentPostsByUser` | profile/[username]/page.tsx |
| `getForumStats` | page.tsx (home) |
| `getRecentActiveThreads` | page.tsx (home) |
| `getNewThreads` | page.tsx (home) |

### `src/lib/settings.ts` -- Partial usage

| Export | Used by |
|--------|---------|
| `DEFAULT_SETTINGS` | Used in same file only (by other functions) |
| `getSettings` | api/admin/settings/route.ts, api/settings/theme/route.ts |
| `getSetting` | **UNUSED** |
| `updateSettings` | api/admin/settings/route.ts |
| `resetSettings` | api/admin/settings/route.ts |
| `seedDefaultSettings` | **UNUSED** |

### `src/lib/types.ts` -- Partial usage

| Export | Used by |
|--------|---------|
| `User` | queries.ts (type cast) |
| `SessionUser` | LoginWidget, Navigation, PostActions, ReplyForm, ThreadModTools |
| `Category` | queries.ts, CategorySection.tsx |
| `Subforum` | queries.ts, SubforumRow.tsx |
| `Thread` | queries.ts, Sidebar.tsx, ThreadRow.tsx |
| `Post` | queries.ts, PostView.tsx |
| `ForumStats` | queries.ts, Sidebar.tsx |
| `Report` | **UNUSED** |
| `ModerationLog` | admin/page.tsx |
| `AdminStats` | admin/page.tsx |

### `src/lib/session.ts`

| Export | Used by |
|--------|---------|
| `SessionData` | Used internally only (not imported externally) |
| `getSession` | All API routes, admin layout, admin dashboard |

### `src/lib/db.ts`

| Export | Used by |
|--------|---------|
| `getDb` | queries.ts, settings.ts, all API routes, admin dashboard |

---

## Cleanup Plan (SAFE items only)

### Batch 1: Remove unused public assets
- Delete `public/file.svg`
- Delete `public/globe.svg`
- Delete `public/next.svg`
- Delete `public/vercel.svg`
- Delete `public/window.svg`

### Batch 2: Remove unused exports from `src/lib/settings.ts`
- Remove `getSetting()` function (lines 61-68)
- Remove `seedDefaultSettings()` function (lines 116-130)

### Batch 3: Remove unused type from `src/lib/types.ts`
- Remove `Report` interface (lines 92-108)

### Batch 4: Unexport `escapeHtml()` in `src/lib/utils.ts`
- Change `export function escapeHtml` to `function escapeHtml` (line 85)

---

## Cleanup Results

All 4 batches were executed and verified. Build passed after each batch.

### Batch 1: Remove unused public assets -- DONE
- Deleted `public/file.svg`
- Deleted `public/globe.svg`
- Deleted `public/next.svg`
- Deleted `public/vercel.svg`
- Deleted `public/window.svg`
- Build: PASSING

### Batch 2: Remove unused exports from `src/lib/settings.ts` -- DONE
- Removed `getSetting()` function (formerly lines 61-68)
- Removed `seedDefaultSettings()` function (formerly lines 116-130)
- Build: PASSING

### Batch 3: Remove unused type from `src/lib/types.ts` -- DONE
- Removed `Report` interface (formerly lines 92-108)
- Build: PASSING

### Batch 4: Unexport `escapeHtml()` in `src/lib/utils.ts` -- DONE
- Changed `export function escapeHtml` to `function escapeHtml` (line 85)
- Build: PASSING

### Items Preserved (not removed)
- `SessionData` export in `src/lib/session.ts` -- kept as module public API
- All devDependencies -- depcheck false positives
- All Next.js convention exports -- framework consumed
- `DEFAULT_SETTINGS` duplication -- stable, low-risk

### Impact
- Files deleted: 5 (public assets)
- Functions removed: 2 (`getSetting`, `seedDefaultSettings`)
- Types removed: 1 (`Report` interface)
- Exports reduced: 1 (`escapeHtml` made module-private)
- Lines of code removed: ~35
- Build status: PASSING (verified after every batch)
- Route table: UNCHANGED (all 36 routes intact)
