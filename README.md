# Monday Pro

Multi-user project management web app — boards, tasks, comments, drag-and-drop Kanban — built with Next.js 15 + Supabase. The full-stack cousin of [monday-lite](https://github.com/azliemohd51/monday-lite) (single-file localStorage version).

**Status:** v1.0 — happy-path MVP. Error states, loading skeletons, and edge-case polish are tracked for v1.1+.

## Quick setup (5 minutes)

### 1. Create a Supabase project
- Go to https://supabase.com → New Project
- Pick a region close to you, set a strong DB password
- Wait for provisioning (~2 min)

### 2. Run the migration
- Open the Supabase SQL Editor
- Paste the contents of `supabase/migrations/0001_init.sql`
- Click **Run**

### 3. Get your credentials
- In Supabase: Settings → API
- Copy the **Project URL** and **anon public** key

### 4. Configure env vars
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

### 5. Install + run
```bash
npm install
npm run dev
```
Open http://localhost:3000 → sign up → you'll land on a dashboard with a sample board.

## Features (v1.0)

- ✅ Email + password auth (Supabase Auth)
- ✅ Auto-provisioned workspace + sample board on signup
- ✅ Dashboard: tasks assigned to you, grouped by status, overdue alerts, summary stats
- ✅ Kanban board with **drag-and-drop** between status columns (@dnd-kit)
- ✅ Task detail drawer: title, description, assignee, status, priority, due date
- ✅ Comments thread per task with avatar + relative timestamps
- ✅ Multiple boards per workspace
- ✅ Profile page: name + avatar color picker
- ✅ Row-Level Security: users only see their workspace data
- ✅ Server Actions for all mutations, no separate API routes
- ✅ Inter font, status pills, polished light theme

## Deferred to v1.1+

- Table view (Kanban only in v1.0)
- Workspace switcher UI (each user has one auto-created workspace)
- Real-time updates via Supabase realtime
- File attachments per task
- Email notifications
- Analytics charts / metrics dashboard
- CSV import / PDF export
- Calendar view
- Subtasks, dependencies, time tracking, labels, rich text editor
- Board templates, custom fields, webhooks
- Granular role-based access (admin/manager/member per workspace)
- Error-state polish (loading skeletons, retry on failure, empty-state illustrations beyond basic text)

## Architecture

- **Next.js 15 App Router** — Server Components by default, Client Components for interactive (Kanban drag, drawer)
- **Server Actions** — all writes go through `src/app/(app)/actions.ts`
- **`import "server-only"`** — DB and auth modules can't accidentally ship to browser
- **Centralized queries** — `src/lib/queries.ts` aggregates SELECTs; pages call query helpers, not raw SQL
- **Middleware** — refreshes Supabase session, gates routes; works alongside per-page `getCurrentUser` which also lazy-creates profile + default workspace if the signup trigger failed
- **RLS** — permissive workspace-membership policies for v1.0. Granular roles are v1.1.

## Project structure

```
monday-pro/
├── supabase/migrations/0001_init.sql   ← run in Supabase SQL editor
├── src/
│   ├── middleware.ts
│   ├── app/
│   │   ├── layout.tsx, globals.css, page.tsx (redirect)
│   │   ├── login/, signup/             (auth pages + Server Actions)
│   │   └── (app)/                      (auth-required layout group)
│   │       ├── layout.tsx              (sidebar + topbar shell)
│   │       ├── actions.ts              (board/task/comment/profile mutations)
│   │       ├── dashboard/page.tsx      ("My Tasks" by status)
│   │       ├── boards/[id]/            (Kanban + drawer)
│   │       └── settings/profile/       (name + avatar color)
│   ├── lib/
│   │   ├── auth.ts                     (getCurrentUser + lazy-ensure)
│   │   ├── queries.ts                  (centralized SELECTs)
│   │   ├── types.ts                    (status/priority enums + colors)
│   │   └── supabase/                   (server, client, middleware clients)
│   └── components/
│       ├── sidebar.tsx, topbar.tsx, avatar.tsx, version-footer.tsx, ...
```

## Defensive signup design

Supabase has a `handle_new_user` trigger that creates `profiles`, default workspace, default board, and sample tasks on every signup. The trigger is **`SECURITY DEFINER`** and wrapped in `EXCEPTION WHEN OTHERS THEN RETURN NEW` so it can **never** block the `auth.users` insert — that would make signup appear broken.

If the trigger ever silently fails, `getCurrentUser()` in `src/lib/auth.ts` will **lazy-create** the missing profile + workspace + board on the user's next request. Belt and suspenders.

## Common first-run hiccups

1. **"Database error saving new user"** — Migration didn't run; signup falls back to lazy creation, which works but skips sample tasks. Re-run `0001_init.sql`.
2. **Blank page after login** — Check `.env.local` has correct Supabase URL + anon key. The browser console will show 401/CORS errors if wrong.
3. **Tasks not appearing across users** — RLS works correctly: you only see tasks in workspaces you're a member of. Invite users to your workspace by inserting into `workspace_members` (UI for inviting is v1.1).
4. **Drag-drop doesn't work on mobile** — `@dnd-kit` PointerSensor is desktop-first; touch sensor is v1.1.

## Versioning

v1.0 — initial MVP (Kanban, drawer, comments, dashboard, auth). Footer + file header comment.
