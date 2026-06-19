-- Profiles table: stores each user's onboarding choice (Individual or Business)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  account_type text not null check (account_type in ('individual', 'business')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Tasks table: each Individual user's to-do items
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  due_date date not null,
  due_time time not null,
  importance text not null default 'normal' check (importance in ('normal', 'high')),
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

create index tasks_user_id_idx on public.tasks (user_id);

alter table public.tasks enable row level security;

create policy "Users can view their own tasks"
on public.tasks for select
using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
on public.tasks for insert
with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
on public.tasks for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
