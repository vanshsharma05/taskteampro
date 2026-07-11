# TeamTaskPro — Design Handoff

Complete UI/UX overview for redesign. Everything on this page is live at **https://www.taskteampro.com** (installable as a PWA on Android/iOS). Source of truth for tokens: `src/app/globals.css`; brand masters: `public/brand/`.

---

## 1. The product in one paragraph

TeamTaskPro is a task planner whose thesis is **honesty about time**. You capture a task by saying one sentence ("call mom tomorrow at 5pm") — voice or typed, parsed by AI — and the app schedules it, syncs it to Google Calendar, and then holds you accountable: it learns how badly you estimate (per category), shows overdue work as a *time debt balance*, forecasts which day next week will melt down, and stages a guided "bankruptcy" cleanup when your backlog goes stale. There is also a lightweight Work mode where a small-business admin assigns tasks to staff and sees on-time reliability scores.

**Positioning:** every competitor is lists and grids that flatter you. TeamTaskPro tells you the truth. The redesign should make *honesty* feel like the premium feature it is — calm, precise, a little clinical, never shaming.

**Platforms:** responsive web app (Next.js + Tailwind), installed to phone home screens as a PWA. Timezone is IST (Asia/Kolkata) throughout.

---

## 2. Users & modes

| Mode | Who | Where |
|---|---|---|
| **Personal** (primary) | Individual planning their day | `/tasks` — Today / Upcoming / Calendar views |
| **Work — Admin** | Small-business owner | `/admin` (dashboard), `/assign`, `/team` |
| **Work — Staff** | Team member | `/staff` (my assigned tasks) |

Business users toggle Personal ⇄ Work via a segmented control in the sidebar. Personal is the product's soul and where all the differentiating features live; Work is functional but under-designed (see §13).

---

## 3. Brand identity (recently created — keep, refine welcome)

**The mark — "the honest tick":** a checkmark whose vertex sits at the center of a clock dial, hands posed at ten-past-ten, the long stroke breaking out of the ring through a clean gap. It fuses the product thesis: *done + time*. Geometry: dark tile `#0A0A0B` (rx 116/512), white dial ring (r 140, stroke 26), white 12-o'clock dot, emerald tick (stroke 38). Masters: `public/brand/logo.svg` (+ maskable variant). Rendered sizes: 512/192 PNG, apple-touch 180, favicon .ico 16/32/48.

**Wordmark:** `TeamTask` in ink + `Pro` in emerald — Space Grotesk Bold, tight tracking. The name literally contains the three pillars (Team · Task · Pro); the landing page is built on this.

**Brand color:** emerald `#34D399` on near-black `#0A0A0B` / white. Emerald = done/positive throughout the app.

---

## 4. Current design tokens

Semantic tokens (shadcn-style CSS variables). **Any redesign must redefine these variables, not hardcode colors** — the whole app reads from them and must work in both themes.

### Light
| Token | Value | Used for |
|---|---|---|
| `background` | `#F7F8FA` | page ground |
| `foreground` | `#0F172A` | ink, primary buttons |
| `card` | `#FFFFFF` | rows, cards, sheets |
| `muted` / `secondary` | `#F1F5F9` | wells, chips ground |
| `muted-foreground` | `#64748B` | secondary text |
| `accent` | `#EEF2FF` (indigo-50) | active nav, hovers |
| `primary` / `ring` | `#4F46E5` (indigo-600) | focus, links, work-mode accent |
| `border` / `input` | `#E2E8F0` | hairlines |
| `destructive` | `#EF4444` | delete |

### Dark
`background #0B1120`, `card #111A2E`, `foreground #E5E9F0`, `muted/secondary/border #1E293B`, `muted-foreground #94A3B8`, `primary #6366F1`, `accent #1E2540`.

### Status accents (Tailwind scale classes, used semantically everywhere)
| Meaning | Color |
|---|---|
| Done / positive / brand | emerald 500–600 |
| Pending / info / work-mode | indigo 500–600 |
| Snoozed / warning / high-priority flag | amber 400–600 |
| Overdue / storm / destructive | red & rose 400–600 |
| Skipped / neutral | slate via `muted-foreground` |
| Rescheduled (calendar pills) | violet (rarely used) |

⚠️ **Known tension for the designer:** brand accent is *emerald*, functional accent (`primary`, active states, focus rings, work mode) is *indigo*. Deliberately unify or deliberately keep the split — right now it's drift, not a decision. This is the single highest-leverage token change.

### Type
- **Headings** `--font-heading`: **Space Grotesk** — bold, `tracking-[-0.01em]`, applied to all h1–h6, stat numbers, wordmark
- **Body** `--font-sans`: **Inter**
- **Mono** `--font-geist-mono`: Geist Mono (rarely used)
- Scale in practice: page titles `text-xl bold`, section labels `text-xs bold uppercase tracking-wider muted`, row titles `text-[15px] medium`, meta `text-[12px] muted`, stats `text-2xl–3xl bold tabular-nums`
- Fonts are negotiable in redesign; loaded via `next/font` (self-hosted, any Google font is cheap to swap)

### Shape & depth
- Radius base `0.65rem`; in practice: cards/rows `rounded-2xl`, sheets/cards-large `rounded-3xl`, buttons/chips `rounded-full`, small controls `rounded-[8px]`
- Shadows are minimal: `shadow-sm` on primary buttons/tiles, `shadow-2xl` on sheets. No glassmorphism except `backdrop-blur` on scrims + mobile tab bar.

### Motion
- Library: framer-motion. House spring: `stiffness 300–320, damping 26–32`
- Sheets slide up + fade (spring); list items `layout` animate; toasts rise from bottom; `prefers-reduced-motion` globally collapses animation to 0.01ms
- Landing page is fully scroll-linked (see §6.1)

---

## 5. Site map

| Route | What it is |
|---|---|
| `/` | Landing — scroll-story (name → 3 features → CTA) |
| `/login`, `/signup` | Auth: Google button + email/password, split-panel layout |
| `/onboarding` | Individual vs Business choice |
| `/company/new`, `/join` | Business setup / member join |
| `/tasks` | **The core app** (Personal board, 3 views) |
| `/admin`, `/assign`, `/team` | Work mode, admin side |
| `/staff` | Work mode, member side |
| `/privacy`, `/terms` | Legal (prose template) |

---

## 6. Screen-by-screen

### 6.1 Landing `/`
One scroll story (520vh, sticky viewport). Frame 1: nothing but "TeamTaskPro" in huge type (clamp 2.6rem–10rem), "Pro" emerald, tiny SCROLL hint. On scroll, the name's own letters carry three phases — the other letters scatter/blur (opacity .05, blur 6px) while **Team**, then **Task**, then **Pro** gathers center-stage with a headline + one-liner below ("Hand it off. Watch it land." / "Say it once. It's scheduled." / "It learns your real pace."). Letters reassemble at the end; CTA appears ("One app. All three." → Get started free / Log in) with a micro footer. A 130vmin brand dial rotates behind at 6% opacity. Minimal fixed header (mark + Log in) fades in after first scroll. *Recently rebuilt to owner's spec — treat as keep/polish, not replace.*

### 6.2 Auth `/login` `/signup`
Split layout: left panel (desktop only) — near-black, indigo glow blobs, logo, value pitch + 3 checked bullets; right — form. Form: "Continue with Google" (white pill, Google G), "or" divider, email + password fields, submit. Signup has a "check your email" success state. Staggered entrance animation. *Left panel copy still says team-accountability pitch — needs updating to the honesty story.*

### 6.3 Personal board `/tasks` — the app
**Layout:** desktop = fixed 256px sidebar + scrollable main (max-w-2xl lists; Today gets a 280px right rail on lg+). Mobile = hamburger drawer + **bottom tab bar** (Today/Upcoming/Calendar, active = filled + count badge on Today) + **FAB** (black circle, plus icon, bottom-right above tab bar). Safe-area insets respected everywhere (notch/gesture bar).

**Header:** time-of-day greeting ("Good morning") + subtitle "3 of 8 done · 2 overdue · 1 snoozed"; search icon (expands a search row; `/` focuses it; filters all views across title/notes/category); Add task button (desktop only — mobile uses FAB).

**Sidebar:** logo lockup + "Personal" badge; Personal⇄Work segmented toggle (business accounts); nav Today/Upcoming/Calendar with live count badges; category list (6 defaults with icons: Health/Home/Errands/Money/Work/Personal + user customs) with per-category counts, tap = filter; footer: avatar (initials), email, theme toggle, sign out.

#### Today view
Order top→bottom:
1. **Quick Add bar** — the signature input. Placeholder 'Try "call mom tomorrow at 5pm"'. Mic button (voice via browser speech recognition; red pulse while listening). As you type/speak, **live preview chips** show what was understood: parsed title, date, time, repeat, priority flag, category, effort estimate. Enter/Add saves; AI (Llama via Groq) parses on submit with on-device parser fallback.
2. **Bankruptcy banner** (conditional, amber) — "12 tasks keep slipping — a 5-minute cleanup beats a backlog you avoid looking at" → opens Bankruptcy sheet.
3. **Daily Digest card** — quiet: date, "3 of 8 done" + progress bar (emerald when complete), "Next: Standup · 2:30 PM", overdue count in red.
4. **Task sections** — label + count (+ inline actions): `Overdue` (red, "Move all to today"), `To do` (sorted by time, then priority), `Snoozed` (amber, shows wake time), `Skipped`, `Completed` (emerald, collapsible — auto-collapsed >5, "Clear" with two-step confirm).
5. **Google Calendar section** — read-only event rows (dashed border, calendar-color dot, time range) or a connect prompt.

**Task row anatomy:** circular check (tap target 40px, emerald fill on done) · title (strikethrough when done/skipped) · meta line (time, category+icon, repeat rule, subtask progress bar x/y, notes icon, snooze/skip/overdue badges) · high-priority flag · "Today" quick-move button (overdue only) · delete (hover-reveal on desktop). Row tap opens Detail sheet.

**Right rail (lg+):** **Snapshot card** — 2×2 stats (Left today / Done today / Done·7 days / Repeating) + honesty rows: *Time debt 3.5h* (red), *"Your estimates run ×1.4 low"* (amber/emerald), worst-category callout; **Google Calendar card** — connect/refresh/disconnect.

#### Upcoming view
**Week Forecast card** first — 7 day-bars sized by predicted load (tasks at *realistic* durations + calendar events), colored clear `<4h` emerald / busy `4–6.5h` amber / storm `>6.5h` rose, with a plain-language warning line ("Thursday looks overloaded — 7.2h scheduled. Move something now, not that morning."). Then date-grouped task sections (Tomorrow, Mon 14 Jul…) and a **Repeating reminders** section.

#### Calendar view
Month grid (max-w-5xl). Desktop cells: date number (today = filled circle), hover + to add on that date, task pills colored by status, dashed Google event pills, status legend footer. **Mobile:** cells show status *dots* only; tapping a day highlights it and renders a **day agenda list** below the grid (task rows + Google events + "Add task" preset to that date). Month prev/today/next controls.

### 6.4 Sheets (bottom sheets mobile / centered modals desktop, spring-in, scrim + blur)

**Add Task** — title input (autofocus) · optional note · category chips + custom · repeat chips (Once/Daily/Weekly+day-circles/Monthly+day-of-month/Every… interval with time window) · quick date chips (Today/Tomorrow/Anytime) + collapsible calendar · collapsible time picker (quick chips Morning/Noon/Evening/Night + wheel) · **"How long will it take?"** estimate chips (5m/15m/30m/1h/2h) · High-priority toggle · "Adding to Google Calendar" toggle (when connected) · sticky Add button.

**Task Detail** — editable title (inline) · meta chips · status banner (snoozed-until / skipped) · action row: Done/Undo, Snooze (menu: 30m/1h/3h/Tomorrow 9AM/unsnooze), Skip, Priority · **Procrastination Diagnosis** (conditional amber card when pushed 3+×): "What's really going on?" → Too vague (focuses title) / Too big (focuses subtask input) / Waiting on someone (skips + notes template) / I dread it (shrinks to 10-min "Start:" version today) · Due-date chips (Today/Tomorrow/Next week/date picker; pushing *later* increments the slip counter) · Time picker · estimate chips + bias hint ("Based on your track record, this realistically takes ~54 min") · category chips · subtask checklist (add/toggle/delete, progress) · notes (saves on blur) · footer: Delete / Duplicate.

**Bankruptcy** — header framing deletion as relief; each stale task card shows title, "pushed 5× · 23 days overdue", three fates: **Do today / Someday / Let it go** (rose when chosen); Apply button summarizes ("Apply · 2 today · 3 someday · 4 released").

### 6.5 Toasts (bottom-center pills, dark ground, above mobile tab bar)
- **Undo delete:** 'Deleted "call mom" — Undo' (6s; delete commits after)
- **Actual-time capture:** on completing an estimated task — "Took how long? ~15m / 30m ✓ / ~1h" one-tap (8s, dismissible) — this feeds the bias engine

### 6.6 Work mode (functional, visually thin — biggest redesign canvas)
- **Admin `/admin`:** AppShell (same sidebar pattern, indigo "Workspace" badge); 4 stat tiles (Members, Active, Done, Overdue); team list rows — avatar initials, email, on-time % score (tabular), status pill; empty state invites adding members
- **Assign `/assign`:** form to create/assign tasks to members (one-time or recurring)
- **Team `/team`:** member management, invite
- **Staff `/staff`:** my assigned tasks — active rows with due countdown + Complete button, Blocked rows (waiting on someone else's task), Done rows with Undo; on-time scoring is the incentive
- *Work mode has none of the honesty features, no bottom mobile nav, no quick add. Design should decide: match Personal patterns or intentionally differentiate.*

---

## 7. Component inventory
Buttons: black pill primary · outline pill secondary · text/ghost · icon buttons (40px targets) · FAB. Chips: selectable pills (fill-black when active; amber for priority; indigo for gcal). Section headers: uppercase label + count + optional action. Cards: `rounded-2xl/3xl border bg-card`. Badges: tiny rounded-full counts. Segmented control (Personal/Work). Nav items (sidebar + bottom tabs). Inputs: borderless title inputs, `rounded-[8px]` bordered fields, custom DatePicker (month grid) + TimePicker (chips + selects). Progress: thin bars (digest, subtasks), forecast bars. Toasts as above. Skeleton loading shells for all server pages. Empty states: icon-in-tile + heading + one-liner + CTA (Today/Upcoming have them; several screens don't).

## 8. Interaction rules already in place
Optimistic updates everywhere (UI first, network after) · destructive = undo-window (delete) or two-step inline confirm (Clear/bankruptcy) — never browser confirm dialogs · row hover reveals secondary actions on desktop; everything visible/tappable on mobile · keyboard: `n` new task, `/` search, Enter saves, Esc closes · voice input on Quick Add · pushing a date later = tracked slip; earlier = free · sections recompute live (snoozes wake within 60s) · Google events are read-only in-app; app tasks push *to* Google (30-min events).

## 9. Data-driven semantics the design must express
1. **Estimation bias:** honest ≈×1.0 (emerald) · underestimates >×1.15 (amber) · overestimates <×0.85 (indigo). Needs ≥3 samples; empty state coaches user to log actuals.
2. **Time debt:** minutes of overdue work at realistic durations — always red, always visible when >0.
3. **Forecast levels:** clear/busy/storm thresholds above — color + copy, days ahead.
4. **Staleness:** reschedule_count ≥3 or 14+ days overdue → diagnosis + bankruptcy eligibility.
5. **Work-mode reliability score:** on-time % per member.

## 10. Responsive & platform
Breakpoints used: `sm` 640 (calendar pills vs dots), `md` 768 (sidebar vs bottom tabs/FAB), `lg` 1024 (Today rail). PWA: standalone display, portrait, white theme-color (light) / #0a0a0a (dark), viewport-fit cover + `env(safe-area-inset-*)` on tab bar, FAB, sheet footers, toasts. Tap highlight disabled. Android maskable icons provided.

## 11. Accessibility & quality bar (keep or beat)
40px minimum touch targets (pseudo-element expanded) · aria-labels on all icon buttons · visible focus (`ring` token) · `prefers-reduced-motion` respected · both themes first-class · tabular-nums on all aligned numbers · text contrast ≥ WCAG AA on both grounds.

## 12. Copy voice
Plain, warm, a bit wry, never shaming: "All done for today. Nice." · "Your day is clear" · "Let it go" · "Move something now, not that morning." · "A 5-minute cleanup beats a backlog you avoid looking at." Errors say what happened and what to do. The redesign should keep this register.

## 13. Known UX debt — where a designer earns their fee
1. **Emerald vs indigo drift** (§4) — pick a system.
2. **Work mode** is a different, thinner product visually; no mobile nav, no honesty features, inconsistent components.
3. **Detail sheet is long** — 9 stacked sections; needs grouping/hierarchy (e.g., schedule cluster vs content cluster) rather than a scroll of equal-weight blocks.
4. **Auth left-panel pitch** is outdated (team copy, indigo glows predate brand).
5. **Snapshot rail** appears below the list on mobile — the honesty numbers (the product's soul) are effectively buried on the primary platform.
6. **Icon-language mix** — lucide icons everywhere but no custom iconography tying into the dial/tick brand geometry; empty states are generic icon-in-a-box.
7. **Category icons/colors** are defaults; categories have no color identity (rows are monochrome).
8. **Calendar desktop pills** get cramped ≥3 tasks/day; no overflow treatment ("+2 more").
9. **No onboarding/first-run tour** — new users see an empty board with many capabilities hidden (voice, `/`, `n`, estimates).
10. **Theme toggle** buried at sidebar footer; landing page respects theme but never offers it.

## 14. Constraints for the redesign
- Deliver colors as **CSS-variable token sets** (light + dark) mapping to §4 names — the codebase consumes tokens, so a re-skin is nearly free; new components cost engineering.
- Keep the information architecture (§5–6) unless a change is explicitly argued — features are live and validated.
- Both themes are mandatory, mobile-first (the PWA is the primary surface).
- Fonts: any Google Fonts family loadable via next/font.
- Landing scroll-story and the honest-tick brand stay (polish welcome).
- Motion must degrade under `prefers-reduced-motion`.

## 15. Asset & file index
`public/brand/logo.svg`, `logo-maskable.svg` (masters) · `public/icon-*.png`, `apple-touch-icon.png`, `src/app/favicon.ico`, `src/app/icon.png` · tokens `src/app/globals.css` · logo component `src/components/brand-logo.tsx` · screens `src/app/**` · components `src/components/**`. Live site: taskteampro.com (create a free account, or ask the owner for a seeded demo account to see populated states — bias/forecast need data).
