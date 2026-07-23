create extension if not exists pg_net with schema extensions;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "users read their own push subscriptions" on public.push_subscriptions;
create policy "users read their own push subscriptions"
on public.push_subscriptions for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "users add their own push subscriptions" on public.push_subscriptions;
create policy "users add their own push subscriptions"
on public.push_subscriptions for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "users update their own push subscriptions" on public.push_subscriptions;
create policy "users update their own push subscriptions"
on public.push_subscriptions for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users remove their own push subscriptions" on public.push_subscriptions;
create policy "users remove their own push subscriptions"
on public.push_subscriptions for delete
to authenticated
using (user_id = auth.uid());

-- Replace YOUR_WEBHOOK_SECRET before running this script.
create or replace function public.send_scholarasync_push_webhook()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://gumkggajfcoopaapouyh.supabase.co/functions/v1/send-web-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'YOUR_WEBHOOK_SECRET'
    ),
    body := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'type', TG_OP,
      'record', to_jsonb(NEW)
    )
  );
  return NEW;
end;
$$;

drop trigger if exists push_new_message on public.messages;
create trigger push_new_message
after insert on public.messages
for each row execute function public.send_scholarasync_push_webhook();

drop trigger if exists push_new_announcement on public.announcements;
create trigger push_new_announcement
after insert on public.announcements
for each row execute function public.send_scholarasync_push_webhook();

drop trigger if exists push_new_grade on public.grades;
create trigger push_new_grade
after insert on public.grades
for each row execute function public.send_scholarasync_push_webhook();

drop trigger if exists push_new_study_group_message on public.study_group_messages;
create trigger push_new_study_group_message
after insert on public.study_group_messages
for each row execute function public.send_scholarasync_push_webhook();

drop trigger if exists push_new_study_group_invite on public.study_group_invites;
create trigger push_new_study_group_invite
after insert on public.study_group_invites
for each row execute function public.send_scholarasync_push_webhook();
