# TeamTaskPro v1 &nbsp;·&nbsp; _legacy_

> **This is version 1.** A new, complete version is being built separately. This
> codebase is the stable v1 that currently powers the live site — keep it running,
> but new feature work belongs in v2.
>
> - **Live:** https://www.taskteampro.com (brand shown to users: **TaskTeamPro**)
> - **Package:** `teamtaskpro-v1` · **Status:** maintenance only

An honest task planner — capture a task in one sentence (typed or spoken), and the
app schedules it, syncs it with Google Calendar, and holds you accountable
(estimation-bias learning, time debt, week-overload forecast, slip diagnosis,
backlog cleanup). Plus a Work mode where an owner delegates tasks to a team and
tracks on-time reliability.

## Stack

- **Framework:** Next.js (App Router) — a modified build; read `node_modules/next/dist/docs/` before framework changes (see `AGENTS.md`)
- **UI:** Tailwind v4, framer-motion, lucide-react
- **Backend:** Supabase (Postgres + auth), migrations in `supabase/migrations/`
- **AI parsing:** Llama 3.1/3.3 via Groq (`/api/parse-task`), on-device fallback
- **Notifications:** web push (`/api/push/*`, pg_cron every minute)
- **Deploy:** Vercel on push to `main` (repo: `vanshsharma05/taskteampro`)

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
```

Requires `.env.local` — Supabase keys, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`,
`GROQ_API_KEY`, VAPID push keys, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.

## Docs

- `docs/design-brief.md` — function-only product brief
- `docs/work-mode-context.md` — Work-mode context for a fresh session
- `AGENTS.md` / `CLAUDE.md` — project instructions

## Schema note

The live `tasks` table has drifted ahead of the numbered migrations — columns are
added via the Supabase SQL editor first, then documented as a migration file.
Always run new SQL in Supabase **before** deploying code that reads new columns.
