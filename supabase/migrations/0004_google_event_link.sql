-- Link tasks to the Google Calendar event we pushed for them,
-- so deleting the task can also remove the event.
alter table public.tasks
  add column if not exists google_event_id text;
