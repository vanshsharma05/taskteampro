# Work Mode — Context for the Redesign

Paste this whole document into the new chat. It gives you (Claude) everything needed to build the **Work mode** (team side) of TaskTeamPro from designer images, matching the design system already established on the homepage and login pages.

---

## 1. The project

**TaskTeamPro** — a task planner. Live at **https://www.taskteampro.com**, deployed on Vercel from GitHub `vanshsharma05/taskteampro` (auto-deploys on push to `main`). Installable as a PWA.

- **Stack:** Next.js (App Router, this is a **modified Next.js** — read `node_modules/next/dist/docs/` before writing framework code, per AGENTS.md), Tailwind v4, framer-motion, Supabase (Postgres + auth), lucide-react icons.
- **Local path:** `c:\Users\vnshh\Desktop\teamtaskpro`
- **Timezone:** everything is IST (Asia/Kolkata).
- **Two halves:** *Personal* mode (`/tasks` — the honesty planner, already redesigned/rich) and *Work* mode (`/admin`, `/assign`, `/team`, `/staff` — **the part being redesigned now**, currently visually thin).
- **Deploy rule:** schema changes need SQL run in the Supabase dashboard *before* pushing code that reads new columns (the live app breaks otherwise). Ask the user to run migrations first.

---

## 2. The design system (already set by homepage + login — MATCH THIS)

The homepage (`src/components/landing.tsx`) and auth pages (`src/components/auth-layout.tsx`, `/login`, `/signup`) define the language. Work mode must feel like the same product.

**Color**
- Page ground: light `#F3F5F7`; cards pure white `#FFFFFF`; dark mode ground `neutral-950`, cards `neutral-900`.
- **Primary green — muted jade `#3D9E77`** (hover `#348A67`). This is THE brand action color. Not bright emerald. Used on primary buttons, active accents, positive states.
- Ink: `neutral-950`; secondary text `neutral-600` (light) / `neutral-300` (dark); borders `black/5`–`black/10`.
- Semantic: green `#3D9E77` = good/on-time/done; **amber** = busy/warning/at-risk; **red/rose** = overdue/overloaded/critical. (These carry meaning; the green is the brand accent, kept separate.)
- Cards: `rounded-2xl border border-black/10 bg-white shadow-sm` (or `shadow-lg` for floating). Buttons: `rounded-xl`. Both themes are mandatory and first-class.

**Type**
- Headings/display: **Space Grotesk** (bold, tight tracking) — `font-heading`, applied to h1–h6, big numbers, wordmark.
- Body: **Inter** — `font-sans`. Numbers use `tabular-nums` everywhere (Work mode is full of %s and counts).
- Scale in use: hero-ish 40–88px; section headings ~30–40px; card titles ~16px bold; body 15–17px; labels tiny uppercase tracked.

**Motion** (framer-motion)
- The house easing curve is `cubic-bezier(0.22, 1, 0.36, 1)` — used as `const EASE = [0.22,1,0.36,1]`.
- Scroll reveals: fade `opacity 0→1` + rise `translateY(30→0)` over **800ms**, triggered at 15% viewport visibility.
- Hover lifts: `-translate-y-1` + softer/larger shadow, 200ms ease-out.
- Respect `prefers-reduced-motion` (globally collapsed in `globals.css`).

**Logo**
- Wordmark is text-only in nav: `TaskTeamPro` (Space Grotesk). The "honest tick" mark (checkmark = clock hands breaking out of a dial) exists in `src/components/brand-logo.tsx` as `<LogoMark>` and in `public/brand/`, used in app sidebars and the icon — NOT in marketing nav.

**Tokens:** the app also has a shadcn-style CSS-variable system in `src/app/globals.css` (`--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--border`, etc., both themes). The in-app screens (`/tasks`, `/admin`) consume these tokens. **Note a known tension:** those tokens still use *indigo* as `--primary`, while the new marketing/brand accent is *jade green*. Part of this redesign is unifying on the jade — when building Work mode, prefer the jade `#3D9E77` for primary actions to match homepage, and flag if the token system should be migrated.

---

## 3. What Work mode IS (functional spec — design these)

Two roles inside one business account. Users toggle **Personal ⇄ Work** via a segmented control in the sidebar (business accounts only).

### Roles
- **Admin** = the small-business owner. Creates the company, assigns tasks to members, tracks reliability.
- **Member (staff)** = does assigned work.

### Screens (priority order)

**A. Admin Dashboard (`/admin`)** — the overview. Needs:
- Four headline stats: team members, active tasks, completed, overdue.
- Team member list — each row: avatar (email initials), name/email, **on-time reliability %** (the hero metric — make it prominent), workload/counts, and an **overloaded warning** state when someone has too much.
- Entry point to assign work.
- **Empty state:** new admin, no team yet → invites adding members.

**B. Assign Task (`/assign`)** — give a task to a member:
- Fields: title, assignee (member picker), due date + time, importance (normal/high), task type (**"special"** = one-off, **"cyclic"** = recurring with daily/weekly/monthly/yearly), and optionally **blocked_by** (this task waits on another task).
- A list of already-assigned tasks with filter (all/active/done).
- Success confirmation on assignment.

**C. Staff view (`/staff`, "My work")** — the member's list:
- Assigned tasks with due countdowns + Complete action.
- **Blocked tasks** — waiting on someone else's task to finish. Must be clearly but calmly shown (not alarming). There's also a "ready" state (was blocked, now unblocked).
- Completed section with undo.
- Their own reliability % visible to them.

**D. Team page (`/team`)** — member list + invite flow (share a code/link to join).

### States to design everywhere
Empty, populated, loading (skeletons exist via `src/components/shell-skeleton.tsx`), overloaded warning, blocked task, ready task, success confirmation.

### Known gaps this redesign should fix
- Work mode currently has **no honesty features, no mobile bottom-nav, no quick-add** — it's visually thinner than Personal. Decide: unify with Personal's patterns or intentionally differentiate (propose a direction).
- Personal mode's mobile pattern (bottom tab bar + FAB, `src/app/tasks/TaskBoard.tsx`) is the reference for how good mobile should feel.

---

## 4. The backend that ALREADY EXISTS (wire designs to this — don't invent data)

**Scoring is already built** — `src/lib/scoring.ts`:
- `ScoringTask` shape: `{ id, user_id, title, due_date "YYYY-MM-DD", due_time "HH:MM:SS", importance "normal"|"high", is_done, task_type "individual"|"special"|"cyclic", recurrence "daily"|"weekly"|"monthly"|"yearly"|null, completed_at, blocked?, blocked_by?, block_reason? }`.
- `taskStatus(task, now)` → `"ontime" | "late" | "overdue" | "pending" | "upcoming"`.
- `scoreTasks(tasks, now)` → `{ ontime, late, overdue, pending, dueTodayTotal, doneToday, score }`. **`score`** is the reliability %: `round((ontime + late*0.5) / (ontime+late+overdue) * 100)`, or `null` if nothing resolved yet. **This is the number to feature on the dashboard.**
- Helpers: `isBlocked`, `isReady`, `isRepeating`, `formatDue`, `formatTime`, `formatTimestamp`.

**Data model** (Supabase):
- `companies` — `{ id, name, admin_id, created_at }`. One per business, owned by admin. RLS: admin-only.
- `profiles` — `{ id, account_type "individual"|"business", company_id, role "admin"|"member", created_at }`.
- `tasks` — the shared task table. Work tasks have `company_id` set (personal tasks have it null). Fields include everything in `ScoringTask` plus the personal-mode columns (category, estimate_min, subtasks, etc.). Blocking fields: `blocked`, `blocked_by`, `block_reason`.

**Routes & their current loaders** (all Server Components fetching via `@/utils/supabase/server`):
- `/admin/page.tsx` → loads company + members + all company tasks (parallelized), renders `AdminDashboard`.
- `/assign/page.tsx` → company + members (minus admin) + company tasks, renders `AssignView`.
- `/staff/page.tsx` → profile + the member's own company tasks, renders `StaffView`.
- `/team/page.tsx` → `TeamView`.
- Shared chrome: `src/components/app-shell.tsx` (sidebar with Personal/Work switch, `LogoMark`, role badge).

**Reuse, don't rebuild:** `scoreTasks`/`taskStatus` (the reliability math), `AppShell`, the Supabase server/client helpers, the shadcn UI primitives in `src/components/ui/`, and the skeletons. Only the *presentation* is being redesigned.

---

## 5. Hard constraints
- Mobile-first; primary actions in thumb reach; 44px+ touch targets.
- Light + dark, both first-class (deliver/consume as token sets).
- WCAG AA contrast; visible keyboard focus; reduced-motion fallback.
- `tabular-nums` on all the percentages/counts.
- Match the homepage design language (§2) exactly — same jade, type, cards, motion.

---

## 6. How the designer is delivering
The designer sends **images** (AI-generated mockups are fine — that's how the homepage came in). Working screen-by-screen. First image will be the **Admin Dashboard, desktop**. When images arrive, build to them precisely (the homepage was built pixel-close from one comp), then wire the reliability numbers to the real `scoreTasks` data.

**When you (new chat) get the first image:** build that screen, keep the jade/type/card/motion system from §2, pull real data shapes from §4, run `npm run build` + lint, and push. Ask the user to run any SQL first if you add columns.
