-- Monday Pro v1.0 — initial schema
-- Run this in Supabase SQL Editor after creating your project.

-- =============================================================================
-- TABLES
-- =============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  avatar_color text not null default '#6366F1',
  role text not null default 'member',
  created_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#6366F1',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  color text not null default '#6366F1',
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null,
  description text not null default '',
  assignee_id uuid references auth.users(id) on delete set null,
  status text not null default 'todo' check (status in ('todo','in_progress','review','done')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  due_date date,
  position int not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists tasks_board_id_idx on public.tasks (board_id);
create index if not exists tasks_assignee_id_idx on public.tasks (assignee_id);
create index if not exists comments_task_id_idx on public.comments (task_id);
create index if not exists boards_workspace_id_idx on public.boards (workspace_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);

-- =============================================================================
-- RLS POLICIES (permissive v1.0: workspace members can do anything in their workspace)
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.boards enable row level security;
alter table public.tasks enable row level security;
alter table public.comments enable row level security;

-- Profiles: anyone authenticated can read all profiles (needed for assignee picker);
-- users can only update their own profile.
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert to authenticated with check (id = auth.uid());

-- Workspaces: members can read; owner can update/delete; anyone authenticated can create.
drop policy if exists "workspaces_select_members" on public.workspaces;
create policy "workspaces_select_members" on public.workspaces
  for select to authenticated using (
    id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );

drop policy if exists "workspaces_insert_authenticated" on public.workspaces;
create policy "workspaces_insert_authenticated" on public.workspaces
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "workspaces_update_owner" on public.workspaces;
create policy "workspaces_update_owner" on public.workspaces
  for update to authenticated using (owner_id = auth.uid());

drop policy if exists "workspaces_delete_owner" on public.workspaces;
create policy "workspaces_delete_owner" on public.workspaces
  for delete to authenticated using (owner_id = auth.uid());

-- Workspace members: members see their workspace's membership; users can join (insert self) or leave (delete self).
drop policy if exists "members_select_in_workspace" on public.workspace_members;
create policy "members_select_in_workspace" on public.workspace_members
  for select to authenticated using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );

drop policy if exists "members_insert_self" on public.workspace_members;
create policy "members_insert_self" on public.workspace_members
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "members_delete_self" on public.workspace_members;
create policy "members_delete_self" on public.workspace_members
  for delete to authenticated using (user_id = auth.uid());

-- Boards: members of the workspace can do anything.
drop policy if exists "boards_all_members" on public.boards;
create policy "boards_all_members" on public.boards
  for all to authenticated using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  ) with check (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );

-- Tasks: members of the board's workspace can do anything.
drop policy if exists "tasks_all_members" on public.tasks;
create policy "tasks_all_members" on public.tasks
  for all to authenticated using (
    board_id in (
      select b.id from public.boards b
      join public.workspace_members m on m.workspace_id = b.workspace_id
      where m.user_id = auth.uid()
    )
  ) with check (
    board_id in (
      select b.id from public.boards b
      join public.workspace_members m on m.workspace_id = b.workspace_id
      where m.user_id = auth.uid()
    )
  );

-- Comments: members of the task's workspace can do anything.
drop policy if exists "comments_all_members" on public.comments;
create policy "comments_all_members" on public.comments
  for all to authenticated using (
    task_id in (
      select t.id from public.tasks t
      join public.boards b on b.id = t.board_id
      join public.workspace_members m on m.workspace_id = b.workspace_id
      where m.user_id = auth.uid()
    )
  ) with check (
    task_id in (
      select t.id from public.tasks t
      join public.boards b on b.id = t.board_id
      join public.workspace_members m on m.workspace_id = b.workspace_id
      where m.user_id = auth.uid()
    )
  );

-- =============================================================================
-- SAFE SIGNUP TRIGGER
-- =============================================================================
-- IMPORTANT: this trigger MUST NEVER raise — if it does, auth.users insert rolls
-- back and signup appears broken. SECURITY DEFINER lets it write to public.*
-- regardless of RLS. EXCEPTION block swallows any failure (app does lazy creation
-- as a fallback in middleware).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
  new_board_id uuid;
  default_name text;
  palette text[] := array['#6366F1','#10B981','#F43F5E','#F59E0B','#0EA5E9','#8B5CF6','#14B8A6','#EC4899'];
  picked_color text;
begin
  default_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'New User');
  picked_color := palette[1 + (abs(hashtext(new.id::text)) % array_length(palette, 1))];

  -- Profile
  insert into public.profiles (id, name, avatar_color, role)
  values (new.id, default_name, picked_color, 'member')
  on conflict (id) do nothing;

  -- Default workspace
  insert into public.workspaces (name, color, owner_id)
  values ('My Workspace', '#6366F1', new.id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'admin')
  on conflict (workspace_id, user_id) do nothing;

  -- Default board with sample tasks
  insert into public.boards (workspace_id, name, color)
  values (new_workspace_id, 'My First Board', '#6366F1')
  returning id into new_board_id;

  insert into public.tasks (board_id, title, description, assignee_id, status, priority, position, created_by) values
    (new_board_id, 'Welcome to Monday Pro 👋', 'This is a sample task. Click to edit, drag between columns to change status.', new.id, 'todo', 'medium', 0, new.id),
    (new_board_id, 'Try dragging this card', 'You can move tasks across status columns to update their state.', new.id, 'in_progress', 'high', 1, new.id),
    (new_board_id, 'Leave a comment', 'Open a task to see the comments thread.', new.id, 'review', 'low', 2, new.id),
    (new_board_id, 'Mark something done', 'Completing tasks is satisfying.', new.id, 'done', 'medium', 3, new.id);

  return new;
exception when others then
  -- Swallow any error so auth.users insert always succeeds.
  -- Middleware will lazy-create profile/workspace on next request.
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
