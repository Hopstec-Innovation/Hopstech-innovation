# Hopstec ops spine & client portal — implementation summary

Documentation of work shipped for the **internal engineering ops console** and polish on the **customer portal**.  
Live site: [https://hopstecinnovation.com](https://hopstecinnovation.com)

Related commits (newest first): `118fdd7` → `4a103ac` (ops spine through staff login hardening).

---

## Commercial flow (locked)

This is the product spine both surfaces follow:

1. Client sends **SOW** (*cahier des charges*) **+ RFQ**
2. Hopstec drafts a **quotation**
3. Client accepts → sends an **approved PO**
4. On **PO reception** → **commit date** locked → work may start
5. Only then: **live run** (customer-visible progress)
6. Internal dispatch (department / service line / assignee / blockers) stays **staff-only**

```text
SOW + RFQ → Intake → Dispatch → Quotation → Accept → Approved PO → Commit → Live delivery → WIP / KPIs
```

**Visibility split**

| Client sees | Client never sees |
|---|---|
| Inquiry / engagement status | Assignee |
| SOW / RFQ they uploaded | Department load |
| Hopstec quotation | Sick leave / capacity notes |
| PO status, commit date | Internal reassignment |
| Live steps, WIP packs, invoices | Raw internal delay causes |

---

## Internal tool (engineering ops)

### Routes

| Path | Purpose |
|---|---|
| `/internal/login` | Staff-only magic-link sign-in (**not** linked from the public site or client portal) |
| `/internal` | Engagements list (commercial stage, commit, assignee summary) |
| `/internal/intake` | Intake queue from project inquiries; promote to engagement |
| `/internal/projects/:id` | Full ops console for one engagement |
| `/internal/team` | Team directory, job titles, provision / revoke staff (admin) |

Shortcut: `/dashboard` redirects by role (staff → `/internal`, client → `/client-portal`).

### Access model

| Role | Access |
|---|---|
| `client` / `user` | Client portal only |
| `staff` | Engineering ops (`/internal/*`) |
| `admin` | Ops + team provisioning |

- Shared helpers: `shared/roles.ts`
- Server gates: `staffProcedure` (admin or staff), `adminProcedure` (admin only) in `server/_core/trpc.ts`
- Engineering **job titles** (display / dispatch, not client-visible): Founder & Lead Engineer, Solutions Architect, Full-Stack / Backend / Frontend / Mobile Engineer, DevOps / Platform, IoT / Embedded, Delivery Manager, Technical Consultant, QA / Reliability

Staff login rules:

- Only **provisioned** `staff` / `admin` receive a magic link
- Unauthorised emails get a **generic** success message (no account enumeration)
- **Admins bypass** optional `STAFF_EMAIL_DOMAINS` (founder Gmail works)
- Email lookup is **case-insensitive**

### Phase A — Commercial gate

Implemented on engagements (`clientProjectsExtended` + docs/events):

- Stages: `intake` → `quoting` → `awaiting_po` → `committed` → `in_delivery` → `closed`
- Staff attach / review **SOW + RFQ**
- Upload / send **quotation**; mark sent; email client
- Record **approved PO** (upload + date) → system sets **commitDate** and stage `committed`
- Audit via `engagementEvents`

### Phase B — Internal dispatch (staff only)

On the engagement (never exposed on client tRPC selects):

- `department`, `serviceLine`, `leadAssigneeId`, `internalNotes`
- Reassign without client notification
- Blockers / capacity notes stay internal

### Phase C — Live delivery (commit-gated)

- Tables: `projectLiveRuns`, `projectLiveSteps`
- Default step template: Discover → Architect → Build → Test → Deploy → Handover (Hopsvoir-style)
- **`startLiveRun` only if stage ≥ committed and PO recorded**
- Internal console advances steps; client polls ~**5s** (no SSE in v1)
- Client **Live Now** on dashboard + project tracker

### Phase D — WIP + KPIs

- WIP CSV / Excel-oriented export of steps / % / notes (`getWipExport`, `WipExportButton`)
- Cycle-time KPIs from `commitDate` (`getDeliveryKpis`)
- Internal delay reasons stay internal unless staff publish a schedule update

### Key server modules

| File | Role |
|---|---|
| `server/opsRouter.ts` | Intake, engagements, documents, quotation, PO/commit, dispatch, team, timeline, KPIs |
| `server/liveRunRouter.ts` | Live runs / steps; start gated on commit; WIP export |
| `server/liveRunHelpers.ts` | Bundles, default steps, ownership helpers |
| `server/magicLinkRouter.ts` | Client vs team portal audiences; safe staff responses |

### Key UI modules

| File | Role |
|---|---|
| `client/src/pages/InternalStaffLoginPage.tsx` | Quiet staff sign-in |
| `client/src/pages/InternalEngagementsPage.tsx` | Engagement list |
| `client/src/pages/InternalIntakePage.tsx` | Inquiry → engagement |
| `client/src/pages/InternalProjectPage.tsx` | Commercial + dispatch + live console |
| `client/src/pages/InternalTeamPage.tsx` | Roles & job titles |
| `client/src/components/internal/InternalLayout.tsx` | Ops chrome + staff gate |

### Database migrations

| Migration | Contents |
|---|---|
| `drizzle/0006_live_project_tracker.sql` | Live runs / steps |
| `drizzle/0007_ops_commercial_spine.sql` | Commercial stage, commit, dispatch fields, engagement docs/events |
| `drizzle/0008_role_based_staff.sql` | `staff` role enum value + `users.jobTitle` |

Paste-friendly Neon script (idempotent where possible + founder admin bootstrap):

- `scripts/apply-ops-migrations-neon.sql`
- `scripts/apply-pending-migrations.sql` (minimal 0008)

Apply in **Neon SQL Editor** (do not run `.sql` files as shell commands).

---

## Client portal — what was polished / added

### Routes (customer)

| Path | Purpose |
|---|---|
| `/client-portal` | Login (client-only) + authenticated dashboard |
| `/client-portal/projects` | Project list |
| `/client-portal/projects/:id` | Project detail: commercial timeline, live tracker, docs, WIP, KPIs |
| `/client-portal/messages` | Messaging |
| `/client-portal/invoices` | Invoices |
| `/client-portal/support` | Tickets |
| `/client-portal/analytics` | Portfolio rollup (aligned to portal chrome) |
| `/client-portal/profile` | Profile |
| `/auth/verify` | Magic-link verification → role-based redirect |
| `/dashboard` | Role-aware redirect into the right surface |

### Auth & security polish

- **Client portal is client-only** — public “Hopstec team” toggle removed
- Staff sign-in moved to **`/internal/login`** (unlinked from public nav)
- Magic-link verify **no longer leaks SQL / emails** in the UI
- Global tRPC `errorFormatter` sanitizes internal errors (`server/_core/safeError.ts`)
- Client-side auth error sanitizer (`client/src/lib/safeErrorMessage.ts`)
- `robots.txt` disallows `/client-portal`, `/internal`, `/auth/`, `/dashboard`

### Delivery visibility (client-facing)

| Component | What clients get |
|---|---|
| `CommercialTimeline` | Read-only: SOW → Quotation → Awaiting PO → Committed |
| `LiveTracker` | Live step progress (~5s poll) after commit |
| `WipExportButton` | Tangible WIP export without internal ops fields |
| Dashboard **Live Now** | Active live runs across the client’s projects |

Internal fields (`department`, `leadAssigneeId`, `internalNotes`, etc.) are stripped from client project payloads.

### UX / brand polish

- Hopstec teal portal chrome (`portal.css`)
- Client login copy restored to client-focused messaging
- Analytics header restyled to portal language (rollup, not competing “Live Now”)
- Staff who open `/client-portal` are redirected to `/internal` (unless `?view=client`)
- Authenticated welcome can show role / job title where appropriate

---

## How to use (smoke path)

### Staff

1. Ensure Neon migrations `0006`–`0008` are applied (or `scripts/apply-ops-migrations-neon.sql`).
2. Promote founder (once):

```sql
UPDATE "users"
SET role = 'admin', "jobTitle" = 'Founder & Lead Engineer', "updatedAt" = now()
WHERE lower(email) = 'hervetshombe@gmail.com';
```

3. Sign in at `/internal/login` → magic link → `/internal`.
4. Intake → promote inquiry → attach SOW/RFQ → send quotation → record PO → commit.
5. Start live run; advance steps; assign department / service / lead.
6. Admins: `/internal/team` to provision other engineers.

### Client

1. Sign in at `/client-portal` (Client only).
2. See commercial timeline, live tracker (after commit), WIP export, invoices, messages.

### Env (production)

See `docs/PORTAL_PRODUCTION.md`. Core: `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `APP_URL`.  
Optional: `STAFF_EMAIL_DOMAINS` (non-admin staff only; leave unset if unsure).

---

## Defaults locked for v1

- PO reception = commit (quotation acceptance alone is not enough)
- One commercial pack per project; document versions allowed
- Same magic-link portal; `admin` / `staff` for `/internal/*`
- No SSE; polling for live; email for commercial notifications
- Live tracker gated behind commit

---

## Success criteria (target state)

- [x] Client can follow SOW/RFQ → quotation → PO → committed without seeing staffing
- [x] Staff cannot start a customer-visible live run before PO/commit
- [x] After commit, step advances reach the client within ~5s (poll)
- [x] WIP export is a client progress artifact without internal ops
- [x] Staff login is not advertised on the public client modal
- [x] Auth failures do not expose SQL or PII in the browser

---

## File index (quick)

```text
shared/roles.ts
drizzle/0006_live_project_tracker.sql
drizzle/0007_ops_commercial_spine.sql
drizzle/0008_role_based_staff.sql
scripts/apply-ops-migrations-neon.sql
server/opsRouter.ts
server/liveRunRouter.ts
server/liveRunHelpers.ts
server/magicLinkRouter.ts
server/_core/trpc.ts
server/_core/safeError.ts
client/src/pages/Internal*.tsx
client/src/components/internal/InternalLayout.tsx
client/src/components/project/{CommercialTimeline,LiveTracker,WipExportButton}.tsx
client/src/lib/safeErrorMessage.ts
docs/PORTAL_PRODUCTION.md
```
