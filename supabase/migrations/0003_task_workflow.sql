-- Task workflow: snooze, skip, and subtasks (ported from taskorganizer)
alter table public.tasks
  add column if not exists snoozed_until timestamptz,
  add column if not exists skipped_on date,
  add column if not exists subtasks jsonb not null default '[]'::jsonb;

-- snoozed_until: task is hidden from "To do" until this moment passes.
-- skipped_on: for one-off tasks any value means "skipped"; for recurring
--             tasks it skips only that day's occurrence.
-- subtasks: array of { id: string, text: string, done: boolean }.
