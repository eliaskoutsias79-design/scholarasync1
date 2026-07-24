create extension if not exists pgcrypto;

create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null check (char_length(name) between 1 and 100),
  description text not null check (char_length(description) between 1 and 1000),
  subject text not null check (char_length(subject) between 1 and 100),
  school text check (school is null or char_length(school) <= 160),
  university text check (university is null or char_length(university) <= 160),
  privacy text not null default 'public' check (privacy in ('public', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_groups_owner_id_fkey
    foreign key (owner_id) references public.profiles(id) on delete cascade
);

create table if not exists public.study_group_members (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id),
  constraint study_group_members_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade
);

create table if not exists public.study_group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  invited_user_id uuid not null,
  invited_by uuid not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (group_id, invited_user_id),
  constraint study_group_invites_invited_user_id_fkey
    foreign key (invited_user_id) references public.profiles(id) on delete cascade,
  constraint study_group_invites_invited_by_fkey
    foreign key (invited_by) references public.profiles(id) on delete cascade,
  check (invited_user_id <> invited_by)
);

create table if not exists public.study_group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  sender_id uuid not null,
  content text not null check (char_length(btrim(content)) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_group_messages_sender_id_fkey
    foreign key (sender_id) references public.profiles(id) on delete cascade
);

create index if not exists study_groups_privacy_created_idx
  on public.study_groups (privacy, created_at desc);
create index if not exists study_group_members_user_idx
  on public.study_group_members (user_id, joined_at desc);
create index if not exists study_group_invites_user_status_idx
  on public.study_group_invites (invited_user_id, status, created_at desc);
create index if not exists study_group_messages_group_created_idx
  on public.study_group_messages (group_id, created_at);

create or replace function public.set_study_group_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_study_groups_updated_at on public.study_groups;
create trigger set_study_groups_updated_at
before update on public.study_groups
for each row execute function public.set_study_group_updated_at();

drop trigger if exists set_study_group_messages_updated_at on public.study_group_messages;
create trigger set_study_group_messages_updated_at
before update on public.study_group_messages
for each row execute function public.set_study_group_updated_at();

create or replace function public.add_study_group_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.study_group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (group_id, user_id)
  do update set role = 'owner';
  return new;
end;
$$;

drop trigger if exists add_study_group_owner_membership on public.study_groups;
create trigger add_study_group_owner_membership
after insert on public.study_groups
for each row execute function public.add_study_group_owner_membership();

create or replace function public.is_study_group_member(
  p_group_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.study_group_members
    where group_id = p_group_id
      and user_id = p_user_id
  );
$$;

create or replace function public.study_group_member_role(
  p_group_id uuid,
  p_user_id uuid default auth.uid()
)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.study_group_members
  where group_id = p_group_id
    and user_id = p_user_id;
$$;

create or replace function public.can_manage_study_group(
  p_group_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.study_group_member_role(p_group_id, p_user_id) in ('owner', 'admin'),
    false
  );
$$;

create or replace function public.has_pending_study_group_invite(
  p_group_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.study_group_invites
    where group_id = p_group_id
      and invited_user_id = p_user_id
      and status = 'pending'
  );
$$;

alter table public.study_groups enable row level security;
alter table public.study_group_members enable row level security;
alter table public.study_group_invites enable row level security;
alter table public.study_group_messages enable row level security;

drop policy if exists "study groups visible to public or members" on public.study_groups;
create policy "study groups visible to public or members"
on public.study_groups for select
to authenticated
using (
  privacy = 'public'
  or owner_id = auth.uid()
  or public.is_study_group_member(id)
  or public.has_pending_study_group_invite(id)
);

drop policy if exists "users create their own study groups" on public.study_groups;
create policy "users create their own study groups"
on public.study_groups for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "owners update study groups" on public.study_groups;
create policy "owners update study groups"
on public.study_groups for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "owners delete study groups" on public.study_groups;
create policy "owners delete study groups"
on public.study_groups for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "members view group memberships" on public.study_group_members;
create policy "members view group memberships"
on public.study_group_members for select
to authenticated
using (public.is_study_group_member(group_id));

drop policy if exists "users join public study groups" on public.study_group_members;
create policy "users join public study groups"
on public.study_group_members for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'member'
  and exists (
    select 1
    from public.study_groups
    where id = study_group_members.group_id and privacy = 'public'
  )
);

drop policy if exists "owners update member roles" on public.study_group_members;
create policy "owners update member roles"
on public.study_group_members for update
to authenticated
using (
  exists (
    select 1
    from public.study_groups
    where id = study_group_members.group_id and owner_id = auth.uid()
  )
  and role <> 'owner'
)
with check (
  exists (
    select 1
    from public.study_groups
    where id = study_group_members.group_id and owner_id = auth.uid()
  )
  and role in ('admin', 'member')
);

drop policy if exists "owners remove members or members leave" on public.study_group_members;
create policy "owners remove members or members leave"
on public.study_group_members for delete
to authenticated
using (
  (
    user_id = auth.uid()
    and role <> 'owner'
  )
  or (
    exists (
      select 1
      from public.study_groups
      where id = study_group_members.group_id and owner_id = auth.uid()
    )
    and role <> 'owner'
  )
);

drop policy if exists "invitations visible to recipient or managers" on public.study_group_invites;
create policy "invitations visible to recipient or managers"
on public.study_group_invites for select
to authenticated
using (
  invited_user_id = auth.uid()
  or public.can_manage_study_group(group_id)
);

drop policy if exists "managers create invitations" on public.study_group_invites;
create policy "managers create invitations"
on public.study_group_invites for insert
to authenticated
with check (
  invited_by = auth.uid()
  and invited_user_id <> auth.uid()
  and public.can_manage_study_group(group_id)
  and not public.is_study_group_member(group_id, invited_user_id)
);

drop policy if exists "managers refresh invitations" on public.study_group_invites;
create policy "managers refresh invitations"
on public.study_group_invites for update
to authenticated
using (public.can_manage_study_group(group_id))
with check (
  invited_by = auth.uid()
  and status = 'pending'
  and public.can_manage_study_group(group_id)
);

drop policy if exists "members view group messages" on public.study_group_messages;
create policy "members view group messages"
on public.study_group_messages for select
to authenticated
using (public.is_study_group_member(group_id));

drop policy if exists "members send group messages" on public.study_group_messages;
create policy "members send group messages"
on public.study_group_messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.is_study_group_member(group_id)
);

create or replace function public.respond_to_study_group_invite(
  p_invite_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.study_group_invites%rowtype;
begin
  select *
  into invitation
  from public.study_group_invites
  where id = p_invite_id
  for update;

  if invitation.id is null then
    raise exception 'Invitation not found';
  end if;

  if invitation.invited_user_id <> auth.uid() then
    raise exception 'This invitation belongs to another user';
  end if;

  if invitation.status <> 'pending' then
    raise exception 'Invitation has already been answered';
  end if;

  update public.study_group_invites
  set
    status = case when p_accept then 'accepted' else 'declined' end,
    responded_at = now()
  where id = p_invite_id;

  if p_accept then
    insert into public.study_group_members (group_id, user_id, role)
    values (invitation.group_id, auth.uid(), 'member')
    on conflict (group_id, user_id) do nothing;
  end if;
end;
$$;

create or replace function public.transfer_study_group_ownership(
  p_group_id uuid,
  p_new_owner_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_owner uuid;
begin
  select owner_id
  into current_owner
  from public.study_groups
  where id = p_group_id
  for update;

  if current_owner is null then
    raise exception 'Study group not found';
  end if;

  if current_owner <> auth.uid() then
    raise exception 'Only the owner can transfer ownership';
  end if;

  if p_new_owner_id = current_owner then
    raise exception 'This user already owns the group';
  end if;

  if not public.is_study_group_member(p_group_id, p_new_owner_id) then
    raise exception 'The new owner must already be a group member';
  end if;

  update public.study_group_members
  set role = 'admin'
  where group_id = p_group_id and user_id = current_owner;

  update public.study_group_members
  set role = 'owner'
  where group_id = p_group_id and user_id = p_new_owner_id;

  update public.study_groups
  set owner_id = p_new_owner_id
  where id = p_group_id;
end;
$$;

revoke all on function public.respond_to_study_group_invite(uuid, boolean) from public;
grant execute on function public.respond_to_study_group_invite(uuid, boolean) to authenticated;
revoke all on function public.transfer_study_group_ownership(uuid, uuid) from public;
grant execute on function public.transfer_study_group_ownership(uuid, uuid) to authenticated;

grant select, insert, update, delete on public.study_groups to authenticated;
grant select, insert, update, delete on public.study_group_members to authenticated;
grant select, insert, update, delete on public.study_group_invites to authenticated;
grant select, insert, update, delete on public.study_group_messages to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.study_group_messages;
exception
  when duplicate_object then null;
end;
$$;
