-- Personal homework and deadline planner.
-- Run after the Study Groups and push-notification migrations.

create extension if not exists pgcrypto;

create table if not exists public.personal_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  subject text,
  due_date date not null,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  notes text,
  external_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_assignments_user_due_date_idx
  on public.personal_assignments (user_id, due_date);

alter table public.personal_assignments enable row level security;

drop policy if exists "Users can read their own assignments"
  on public.personal_assignments;
create policy "Users can read their own assignments"
  on public.personal_assignments
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own assignments"
  on public.personal_assignments;
create policy "Users can create their own assignments"
  on public.personal_assignments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own assignments"
  on public.personal_assignments;
create policy "Users can update their own assignments"
  on public.personal_assignments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own assignments"
  on public.personal_assignments;
create policy "Users can delete their own assignments"
  on public.personal_assignments
  for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.set_personal_assignment_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_personal_assignment_updated_at
  on public.personal_assignments;
create trigger set_personal_assignment_updated_at
before update on public.personal_assignments
for each row
execute function public.set_personal_assignment_updated_at();

grant select, insert, update, delete
  on public.personal_assignments
  to authenticated;

do $$
begin
  alter publication supabase_realtime
    add table public.personal_assignments;
exception
  when duplicate_object then null;
end
$$;
