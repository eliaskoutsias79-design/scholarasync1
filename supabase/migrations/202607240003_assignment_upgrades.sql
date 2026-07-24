-- Deadline reminders, open-deadline list support, and Study Group sharing.
-- Run after 202607240002_personal_assignments.sql.
-- IMPORTANT: replace YOUR_WEBHOOK_SECRET before running this migration.
-- Never commit the real secret to GitHub.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

alter table public.personal_assignments
  add column if not exists reminder_at timestamptz,
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists group_id uuid
    references public.study_groups(id) on delete set null;

create index if not exists personal_assignments_reminder_idx
  on public.personal_assignments (reminder_at)
  where reminder_at is not null
    and reminder_sent_at is null
    and status <> 'completed';

create index if not exists personal_assignments_group_due_idx
  on public.personal_assignments (group_id, due_date)
  where group_id is not null;

drop policy if exists "Users can read their own assignments"
  on public.personal_assignments;
drop policy if exists "Users can read own or shared assignments"
  on public.personal_assignments;
create policy "Users can read own or shared assignments"
  on public.personal_assignments
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or (
      group_id is not null
      and public.is_study_group_member(group_id, auth.uid())
    )
  );

drop policy if exists "Users can create their own assignments"
  on public.personal_assignments;
create policy "Users can create their own assignments"
  on public.personal_assignments
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      group_id is null
      or public.is_study_group_member(group_id, auth.uid())
    )
  );

drop policy if exists "Users can update their own assignments"
  on public.personal_assignments;
create policy "Users can update their own assignments"
  on public.personal_assignments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      group_id is null
      or public.is_study_group_member(group_id, auth.uid())
    )
  );

create or replace function public.dispatch_due_assignment_reminders()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  assignment_record public.personal_assignments%rowtype;
  dispatched integer := 0;
begin
  for assignment_record in
    select *
    from public.personal_assignments
    where reminder_at is not null
      and reminder_at <= now()
      and reminder_sent_at is null
      and status <> 'completed'
    order by reminder_at
    for update skip locked
    limit 100
  loop
    perform net.http_post(
      url := 'https://gumkggajfcoopaapouyh.supabase.co/functions/v1/send-web-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', 'YOUR_WEBHOOK_SECRET'
      ),
      body := jsonb_build_object(
        'table', 'personal_assignment_reminders',
        'type', 'REMINDER',
        'record', to_jsonb(assignment_record)
      )
    );

    update public.personal_assignments
    set reminder_sent_at = now()
    where id = assignment_record.id;
    dispatched := dispatched + 1;
  end loop;
  return dispatched;
end;
$$;

revoke all
  on function public.dispatch_due_assignment_reminders()
  from public;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'scholarasync-assignment-reminders';

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'scholarasync-assignment-reminders',
    '* * * * *',
    'select public.dispatch_due_assignment_reminders();'
  );
end
$$;

do $$
begin
  alter publication supabase_realtime
    add table public.personal_assignments;
exception
  when duplicate_object then null;
end
$$;
