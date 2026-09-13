# Client portal — production checklist

Magic-link auth for `/client-portal`. No Manus OAuth required.

## 1. Vercel environment variables

Set these for **Production** (and Preview if you test portal there):

| Variable | Example | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://…` | Neon (or Postgres) with migrations applied |
| `JWT_SECRET` | long random string | Cookie signing; never reuse a public value |
| `RESEND_API_KEY` | `re_…` | From [resend.com](https://resend.com) |
| `APP_URL` | `https://hopstecinnovation.com` | No trailing slash; used in magic-link emails |

Recommended:

| Variable | Example |
|---|---|
| `EMAIL_ADMIN` | `hk@hopstecinnovation.com` |

Leave unset (magic-link mode):

- `OAUTH_SERVER_URL`
- `VITE_OAUTH_PORTAL_URL`
- `VITE_APP_ID`

Redeploy after changing env vars.

## 2. Resend domain

1. Verify `hopstecinnovation.com` in Resend → Domains.
2. Production sends from `noreply@hopstecinnovation.com` (hardcoded in `server/emailService.ts`).
3. Confirm SPF/DKIM show verified before testing live login.

## 3. Database

1. `DATABASE_URL` points at the production Neon branch.
2. Schema is up to date. **Required for magic-link sign-in after ops spine deploy:**
   - Run `scripts/apply-pending-migrations.sql` in the Neon SQL editor (adds `users.jobTitle` + `staff` role), **or**
   - Run `pnpm db:push` locally against production `DATABASE_URL`.
3. If ops tables are missing, also apply `drizzle/0006_live_project_tracker.sql` and `drizzle/0007_ops_commercial_spine.sql`.
4. `magic_links` and `users` tables exist (Drizzle schema).

## 4. End-to-end smoke test

On production (or a Preview with the same env):

1. Open `https://hopstecinnovation.com/client-portal`.
2. Request a magic link with a real inbox you control.
3. Confirm the email arrives from `noreply@hopstecinnovation.com` within ~1 minute.
4. Open the link → lands on `/auth/verify` → session cookie set → portal dashboard.
5. Confirm the link cannot be reused (second open should fail cleanly).
6. Confirm an expired / invalid token shows the error state, not a blank page.

If step 2–3 fails:

- Check Vercel function logs for `[Email]` / `[MagicLink]`.
- Missing `RESEND_API_KEY` in production throws (no silent “success”).
- Wrong `APP_URL` produces links to the wrong host.

## 5. Security notes

- Prefer `APP_URL` set explicitly so emails never depend on `Origin` / `Referer`.
- Session cookie uses `SameSite=Lax` (see server cookie helpers).
- Do not commit `.env` or real secrets; use `.env.example` as the template.

## Quick local check

```bash
cp .env.example .env
# fill DATABASE_URL, JWT_SECRET, RESEND_API_KEY, APP_URL
pnpm install
pnpm db:push
pnpm dev
# open /client-portal — without RESEND_API_KEY, magic links log to the server console in development only
```
