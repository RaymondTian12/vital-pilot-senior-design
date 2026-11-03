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
  datasets are labeled. PDF export, private history/downloads and optional OpenAI narratives are now connected; see `docs/report_generation.md`.
- Mobile doctor portal lists explicitly consenting patients and provides paginated,
  read-only metric histories. Admin portal is a paginated read-only account directory.
  Provider/admin accounts are routed to the portal instead of patient tabs.
- Patients use Profile > Doctor sharing to confirm all-metric access for a registered
  provider or revoke it. Backend role/ownership/consent checks are authoritative;
  existing assignments alone never grant consent. Access does not recall previously
  viewed information. No role changes or provider self-registration are exposed.

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

AI/PDF reports now use Michael's OpenAI Responses API/model choice, with PDF-only
fallback when AI is unavailable. Server credentials and a rebuilt native app are
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
