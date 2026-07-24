create table if not exists public.android_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  device_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists android_push_tokens_user_id_idx
  on public.android_push_tokens(user_id);

alter table public.android_push_tokens enable row level security;

drop policy if exists "users read their own android tokens"
  on public.android_push_tokens;
create policy "users read their own android tokens"
on public.android_push_tokens for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "users add their own android tokens"
  on public.android_push_tokens;
create policy "users add their own android tokens"
on public.android_push_tokens for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "users update their own android tokens"
  on public.android_push_tokens;
create policy "users update their own android tokens"
on public.android_push_tokens for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users remove their own android tokens"
  on public.android_push_tokens;
create policy "users remove their own android tokens"
on public.android_push_tokens for delete
to authenticated
using (user_id = auth.uid());

grant select, insert, update, delete
  on public.android_push_tokens
  to authenticated;
