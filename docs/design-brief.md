# TeamTaskPro — Product Brief for Redesign

This document describes **what the product does** — its sections, capabilities, and user flows. It deliberately contains **no visual direction**: no colors, layouts, components, or styling. The design is your job, from a blank page.

---

## 1. What the product is

TeamTaskPro is a task planner built around one idea: **honesty about time**.

Most task apps let you plan a fantasy. TeamTaskPro captures a task from one spoken or typed sentence, schedules it, syncs it with Google Calendar — and then holds the user accountable: it learns how badly they estimate effort, shows overdue work as a growing "time debt", predicts which day next week will be overloaded, notices which tasks keep slipping and asks why, and stages a guided cleanup ritual when the backlog goes stale.

There is also a lightweight **Work mode**: a small-business owner assigns tasks to staff and sees each person's on-time reliability.

**Audience:** individuals first (students, freelancers, small-business owners in India — times display in IST like "5:15 PM"); small teams second.

**Platforms:** responsive website, installed on phones as an app (PWA). **Most real usage is on a phone** — design mobile-first, desktop as the expansive version. Light and dark appearance both required.

**Brand:** the name, the logo mark (a checkmark that doubles as clock hands breaking out of a clock dial), and the app icon are approved and stay. Everything else — palette, typography, layout, components, illustration, motion — is open.

---

## 2. Sections of the product

### A. Homepage (marketing)
**Job:** explain the product and convert visitors to sign-up.
Raw material to work with:
- The name contains its own three pillars: **Team · Task · Pro**
  - *Task* — capture a task by saying one sentence; date, time, repetition, priority and reminder set themselves; syncs to Google Calendar
  - *Pro* — the honesty engine: estimate-vs-reality learning, time debt, week overload forecast, slip diagnosis, backlog cleanup
  - *Team* — assign work, see who's on it, when it'll land, and who's reliable
- Entry points needed: Get started (sign-up), Log in
- Footer needs: privacy, terms, copyright
- Free to use today; no pricing page yet

### B. Sign up / Log in
- One-tap **Continue with Google**
- Email + password alternative (sign-up may require an email-confirmation step — needs a "check your inbox" state)
- Error states (wrong password, blocked popup, etc.)

### C. Onboarding
- New user chooses: **Individual** (straight to planner) or **Business**
- Business path: create a company, or join an existing one with an invite
- Google sign-ups skip straight to this choice; there is no product tour today (one may be worth designing)

### D. The personal planner (core of the product — where users live daily)

**Capture**
- A single input that accepts one natural sentence, typed **or spoken** (microphone; needs idle / listening / error states)
- The system extracts: action title, date ("tomorrow", "13 july", "in 3 days"), time ("at 5pm", "tonight"), repetition ("every mon and wed", "every half hour"), priority ("urgent"), category, and effort estimate ("for 30 min")
- The user sees **what was understood before saving** and can correct it
- A full manual form also exists with every field: title, note, category (6 defaults: Health, Home, Errands, Money, Work, Personal — plus user-created), repeat rules (once / daily / chosen weekdays / day of month / every N minutes inside a time window), date, time, effort estimate (preset durations), high-priority flag, and an "also put it on my Google Calendar" option

**Three views of the same tasks**
1. **Today** — the daily driver. Contains: a day summary (how many done/left, what's next, overdue count); task groups: overdue, to-do (ordered by time), snoozed (with wake time), skipped, completed; today's Google Calendar events (read-only); entry point to capture
2. **Upcoming** — future tasks grouped by day; repeating reminders as their own group; plus the **week forecast** (see honesty engine)
3. **Month calendar** — every day shows its tasks and their states plus Google events; user can add a task directly on a date; on small screens a tapped day should reveal that day's full agenda

**Actions on a task**
- Complete / un-complete
- Snooze (presets: 30 min, 1 h, 3 h, tomorrow morning; unsnooze)
- Skip (for a repeating task: just today; for a one-off: permanently, reversible)
- Reschedule (quick: today / tomorrow / next week / pick a date)
- Edit everything: title, note, time, category, effort estimate, subtasks (a small checklist inside the task), priority
- Duplicate; Delete (deletion must be forgiving — currently a short undo window rather than a confirm dialog; keep the principle)

**The honesty engine — the differentiator; make it feel premium, precise, never shaming**
- On completing an estimated task, the app asks **"how long did it really take?"** (one tap: half / as planned / double)
- After enough samples it learns the user's **personal estimation bias** — overall and per category ("you underestimate Money tasks ×1.8") — and translates new estimates into realistic durations
- **Time debt:** overdue work totals into a visible balance of hours owed
- **Week forecast:** each of the next 7 days gets a predicted load (tasks at realistic durations + calendar events) with three levels — clear, busy, overloaded — and a plain-language warning days in advance
- **Slip tracking:** pushing a due date later is counted; a task pushed 3+ times triggers a **diagnosis** — the app asks what's really wrong and offers four one-tap fixes: *too vague* (rewrite), *too big* (split into subtasks), *waiting on someone* (park it, note who), *I dread it* (shrink to a 10-minute starter version today)
- **Backlog bankruptcy:** when several tasks keep slipping, a guided cleanup lists them with their history ("pushed 5×, 23 days overdue") and gives each a fate: do today / someday / let it go — deletion framed as relief, with a summary before applying
- A **stats snapshot** exists: left today, done today, done this week, active repeating reminders, time debt, and the learned bias

**Also present in the planner**
- Search across all tasks (title, notes, category)
- Filter by category, with counts
- Browser notifications when a timed task is due, and repeated nudges for interval reminders ("every 30 min between 9–6")
- Google Calendar: a connect flow (one consent screen), events appear in Today + Calendar, app tasks can be created on the user's calendar, deleting the task removes the event; connection persists indefinitely once granted
- Keyboard shortcuts on desktop (new task, search)
- Theme toggle (light/dark), sign out, user identity display

### E. Work mode (business accounts)
- A clear switcher between **Personal** and **Work** contexts
- **Admin:** dashboard with totals (members, active, done, overdue) and a member list showing each person's **on-time reliability %**; assign tasks to members (one-time or recurring); manage/invite team members
- **Staff:** my assigned tasks with due countdowns, complete/undo; some tasks are **blocked** waiting on another person's task — that state must be visible
- Work mode currently lacks the honesty features and mobile patterns of Personal — the redesign may unify them or intentionally differentiate; propose a direction

### F. Legal
- Privacy policy and Terms — long-form prose pages (privacy includes required Google-data language that cannot be reworded)

### G. States that need design everywhere
- First-run / empty (new user with zero tasks — every view)
- Empty-section, loading, error, and success/confirmation states
- The bias features have a "not enough data yet" state that should coach rather than sit blank

---

## 3. Hard constraints (functional only)

1. **Mobile-first.** The installed phone app is the primary surface; respect notches and gesture bars; primary actions in thumb reach
2. **Light and dark themes**, both first-class; deliver the palette as two token sets
3. **Accessibility:** WCAG AA contrast, 40px+ touch targets, visible keyboard focus, reduced-motion fallback
4. Voice capture needs visible listening/error states
5. Numbers align (times, counts, percentages) — plan for tabular figures
6. Logo mark, app name, and app icon are fixed brand assets
7. Fonts: anything on Google Fonts is usable

---

## 4. Deliverable 1 — start here

**The homepage, complete flow, completely new design — mobile and desktop.**

Wanted:
- Full-page design for **both breakpoints** (phone + desktop), covering the entire scroll/journey from first pixel to footer
- Every state: initial load, any scroll or motion behavior described, nav, CTAs, hover/pressed states, light **and** dark
- The three-pillar story (Task / Pro / Team) told your way — the current site has a concept here, but you are explicitly free to discard it
- Typography and palette proposals (the two token sets) — the homepage will seed the system for the rest of the app

After homepage sign-off, the sequence is: sign-up/onboarding → the personal planner (capture, Today, task detail) → calendar & forecast → work mode.
