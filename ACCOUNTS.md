# VFIT PRO V19 — private accounts

Authentication is handled by Supabase Auth. Only the publishable browser key is
shipped; no database password, secret key or service-role key is used.

The existing `public.vfit_user_data` table has a primary-key `user_id` referencing
`auth.users`, a JSONB `data` field, an `updated_at` timestamp, and owner-only RLS
policies for SELECT, INSERT, UPDATE and DELETE. Anonymous access is revoked.

Each account starts with the same five-day program and independently stores its
loads, repetitions, notes, favourites, active workout and history. There is not
yet a custom program editor. The previous anonymous localStorage values are
preserved and can be explicitly imported into one account on that device.

Unsynced changes are cached under a user-specific key. Writes use conditional
`updated_at` matching to avoid silently overwriting another device's work.
Conflicts require an explicit choice and keep a local recovery backup.
Auth and database traffic is never cached by the service worker.

Email/password sign-up is enabled, email confirmation is disabled, and no SMTP
provider is configured. Consequently email addresses are NOT verified and
password-reset emails are NOT available. The UI explicitly explains this.
Configure a mail provider and email verification before wider public release.

QA performed 2026-10-11:

- `node scripts/test-accounts.cjs`: 12 DOM integration checks with the real
  vendored Supabase SDK and a mock server. Requires jsdom (set VFIT_JSDOM_PATH).
- `node scripts/test-live-rls.cjs`: real password sign-up/sign-in and private
  database ownership checks against Supabase. This script creates synthetic
  auth accounts, so do NOT run casually on production. It removes only its own
  test progress rows and logs out its test sessions.
- Five days and all exercise image paths verified in the assembled build.
- Syntax checks and `git diff --check` passed.
- Full visual browser QA was not available in the container: the Chromium
  download failed. DOM interaction tests passed; final hosted visual review
  should use Safari/mobile.

The two synthetic auth accounts from the real test remain in Authentication >
Users with no progress data. They can be removed by the project owner:

- vfit-qa-mv3wriys-a@example.com
- vfit-qa-mv3wriys-b@example.com

No real user's progress was removed or changed by the tests.
