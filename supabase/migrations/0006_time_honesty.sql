-- Honesty & estimation: how long you thought vs. how long it took,
-- and how often a task has been pushed to another day.
alter table public.tasks
  add column if not exists estimate_min integer,
  add column if not exists actual_min integer,
  add column if not exists reschedule_count integer not null default 0;
