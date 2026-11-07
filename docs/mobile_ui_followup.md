# Raymond's mobile follow-up

## Implemented in source

- Metric history has its own route, expandable records, pagination and retry.
- Consistent status badges use text/icons and distinct normal/warning/urgent/unknown colors.
- Home and Notifications use the same server summary alert references, deduplicated
  during a session. Read status does not survive restarting the app.
- Water draft adjustments support quarter/half/full cups. Numeric validation remains
  aligned with backend storage constraints; no new clinical thresholds were invented.
- Pulmonology is included in provider search and peak-flow history follow-up.
- Profile > Goals & personal best reads and updates goals after onboarding; old goal
  values are recorded in MetricGoalsHistory. Large step goals require the migration below.
- Mobile sends an IANA timezone with sleep/water/activity totals. Repeated saves
  replace the latest existing entry for that local day under a user-row lock, and
  refresh the assessment snapshot. Existing duplicate legacy rows are preserved.
  Older clients that omit timezone retain their previous append behavior.
- Peak-flow entry no longer asks for personal best. New assessments use the saved
  Peak Flow setting; missing settings produce missing-context results. Legacy clients
  can still provide a best when none is stored. Existing assessment snapshots remain.
- The temporal engine's logging-streak function is called by the live summary/report
  backend, scoped to the loaded window. Clinical persistence/reset/velocity policies
  are not enabled without agreed rule configuration.
- Reports now load real 7/30/90-day readings. Habit bars use latest local-day totals;
  measurement charts show observations, including separate BP components. Truncated
  datasets are labeled. PDF export, private history/downloads and optional Gemini narratives are now connected; see `docs/report_generation.md`.
- Doctor portal, provider verification and patient sharing now use the team's
  merged `origin/main` implementation (`/portal/*`, `/doctor-portal`, `/sharing`).
  Our duplicate sharing/provider API and screen were replaced during integration.
  The local admin account directory remains read-only; the team's full admin
  approval workflow is on a separate branch and is not merged yet.

## Database rollout

Review and apply `database/migrations/20261102_mobile_portals.sql` with the team's
normal database tool before testing goals and sharing. It creates the consent
relation and widens goal/history numeric columns. It does not delete existing data
or grant any provider access. This migration was applied to the configured database on November 2, 2026.
Verification confirmed both goal columns are DECIMAL(10,2) and the consent table
exists with zero grants. No existing provider was granted access.
Restart the backend and Expo after applying. New databases use the updated schema.
Use existing, team-provisioned patient/provider/admin test accounts. A provider
account also requires its corresponding Providers row. Provider and patient lists
are currently capped at 100; the admin list and metric history have pagination.

## Remaining team integration

AI/PDF reports now use the team's Gemini provider and report statistics, with PDF-only
fallback when AI is unavailable. Server Gemini credentials and a rebuilt native app are
required for live AI/native-sharing tests. See `docs/report_generation.md`.
Agree on persistent clinical temporal policies before enabling engine conditions.
Doctor/admin portals currently provide the read-only MVP above; further management
operations require explicit product requirements and authorization rules.

## Verification

Automated checks cover local-day habit replacement, missing timezone validation,
goal validation/history writes, saved peak-flow best, 90-day reports/live streaks,
provider access denial without consent, role checks, and cached daily-total updates.
MySQL row-lock/concurrency behavior needs a dedicated disposable MySQL test database;
SQLite tests do not validate InnoDB locking. No shared database was used for tests.

On a phone: edit goals, save/re-save each habit and verify the same history ID,
check DST/day rollover and a new day, save peak flow without typing a best, open
real reports, review notifications, and test sharing/grant/revoke using separate
patient/provider accounts. Confirm denied access and account-switch isolation.
Check large text, keyboard visibility, small screens and network failures.

## Team sync on November 2, 2026

Backup commit `f4d0603` preserves the full local work before integrating
`origin/main`. The integration branch retains goals, metric history, notifications,
doctor distances and report exports while adopting the team's provider portal.
The earlier PatientSharingConsents table is unused by the canonical portal; it was
left in place without deleting data. PatientProviderAssignments is now the sharing
source of truth. Review the team's November 1 migration status before deployment;
its consent migration revokes existing ACTIVE assignments and must not be rerun
blindly. No shared-database writes were made during this Git integration.

The report provider and statistics now follow the Gemini report branch; mobile
PDF/history/share work is preserved, with no live AI calls made. Omar's shared
Gemini chatbot endpoint and Mohammad's admin branch are separate integrations.

## Team sync on November 7, 2026

The new integration branch includes origin/main through `db2183f`: the full admin
portal, doctor review controls, visible sign-out, registration improvements and
Omar's Gemini backend chat route. Admin accounts enter `/admin-portal`; the older
read-only directory remains a secondary route. Source changes for the selected
report model were committed before merging. Editor settings were preserved in a
separate stash; secrets and the shared database were untouched by this sync.

The backend now requires `google-genai`; it is installed in the local virtual
environment. Gemini clients initialize on request so missing AI configuration
returns a service error instead of breaking backend startup. An incoming admin
annotation was made compatible with the existing Python 3.9 environment.

Mobile Pilot AI remains a preview. Omar's endpoint accepts
`POST /chat {message, history:[{role, content}]}` and returns `{reply}`. The current
mobile helper uses `{id,role,text}` history and expects `{text}`, so it still needs
an explicit adapter and enabled chat UI. The endpoint currently uses conversation
text, not a patient-reading database query. No live AI requests were made in tests.

Incoming admin/content/provider migrations require review before running the new
management features against an older database. Do not rerun consent-revocation
migrations blindly. No migrations were applied during this Git merge.
