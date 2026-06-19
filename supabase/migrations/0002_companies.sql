-- Companies table: each business has one company record, owned by its admin
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  admin_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;

create policy "Admins can view their own company"
on public.companies for select
using (auth.uid() = admin_id);

create policy "Admins can create their own company"
on public.companies for insert
with check (auth.uid() = admin_id);

create policy "Admins can update their own company"
on public.companies for update
using (auth.uid() = admin_id)
with check (auth.uid() = admin_id);

-- Link each profile to a company and a role within it
alter table public.profiles
  add column company_id uuid references public.companies (id) on delete set null,
  add column role text check (role in ('admin', 'member'));
