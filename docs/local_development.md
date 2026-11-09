# Local development

The main repository is the source for both the API and mobile app. A temporary
review checkout is no longer required. Run the commands below from the indicated
folders. Do not copy virtual environments, node_modules, native build outputs,
or secrets from another checkout.

## Initial setup

Use Node compatible with Expo SDK 57 (22.13 or newer supported LTS) and Python 3.9+
for the current backend. Use a new local virtual environment rather than the
legacy Windows environment tracked under `backend/.venv`.

From the repository root:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
npm ci
```

Create a root `.env` containing your team's development database configuration:
`dbname`, `dbhost`, `dbport`, `dbuser`, `dbpassword`, and `jwt_secret_key`.
Use the team's existing signing key when retaining existing development sessions.
These values are private; never put them in mobile environment variables.

The database must have the tables in `database/schema.sql`. For existing databases,
review the additive migrations before applying them with your normal database tool:

- `database/migrations/20261012_google_auth.sql`: Google identity support.
- `database/migrations/20261101_provider_portal.sql`: requires explicit patient grants before a provider can read records. See `docs/doctor_portal.md` for setup and review.
- `database/migrations/20261101_provider_registration.sql`: holds provider accounts for administrator verification before directory listing or patient access.
- `database/migrations/20261102_admin_portal.sql`: records admin portal review decisions.
- `database/migrations/20261102_admin_accounts.sql`: adds account suspension and an admin action audit log. Apply before deploying the updated API, because login reads `Users.is_active`.
- `database/migrations/20261102_welcome_content.sql`: stores optional admin-edited welcome-page text.
- `database/migrations/20261103_doctor_removal.sql`: adds the `REMOVED` doctor status and review decision. Apply before starting the updated backend.
- `database/migrations/20261020_metric_assessments.sql`: creates per-reading context/assessment
  storage and fills entirely absent glucose, oxygen, BMI, and peak-flow reference
  groups. Apply before starting the assessment-enabled backend; existing readings
  and configured groups are preserved.
- `database/migrations/20261017_blood_pressure_thresholds.sql`: inserts the nine
  repository BP thresholds only when no BP configuration exists. It leaves existing
  thresholds and readings untouched; partially configured BP thresholds require review.

Fresh databases also need the repository's clinical threshold seed. The full
`database/seed_clinical_thresholds.sql` deletes existing threshold configuration;
use it only when intentionally provisioning a fresh database. Starting the API does
not apply migrations or seeds. Consolidating source does not require changing the
existing shared database or patient records.

In `vitalpilot/frontend/mobile/.env.local`, set:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://YOUR_MAC_LAN_IP:8000
```

Find the active Wi-Fi address in macOS network settings. On many Macs,
`ipconfig getifaddr en0` prints it. Update the URL and restart Expo after changing
Wi-Fi networks. A physical phone cannot reach your Mac using localhost.
For web testing on the same Mac, use `http://localhost:8000` instead.

## Daily startup

Stop old review servers with Ctrl+C in their terminals first. To identify a port
conflict, use `lsof -nP -iTCP:8000 -iTCP:8081 -sTCP:LISTEN` and inspect the process
before stopping it.

Terminal 1, repository root:

```sh
.venv/bin/uvicorn backend.app:app --env-file .env --host 0.0.0.0 --port 8000
```

Terminal 2:

```sh
cd vitalpilot/frontend/mobile
npx expo start --dev-client --clear --port 8081
```

Connect the phone and Mac to the same Wi-Fi, then open the development client with
Expo's QR code. Check `http://YOUR_MAC_LAN_IP:8000/health` in the phone browser if API
requests fail. Expo's tunnel does not tunnel the backend.

Native dependencies, permissions, and bundle settings require a rebuilt iOS client:

```sh
cd vitalpilot/frontend/mobile
npx expo run:ios --device
```

Use this after adding Expo Location or Google sign-in, or when development signing
expires. An unchanged native app only needs the daily Expo server, not reinstalling.
Google sign-in requires the iPhone development build, not Expo Go. Keep the existing
bundle ID and development team. The phone must be connected/unlocked for installation.

## Automated verification

From the repository root:

```sh
.venv/bin/python -m unittest discover -s backend/tests -p 'test_*.py'
```

From `vitalpilot/frontend/mobile`:

```sh
npx tsc --noEmit
node --test tests/*.test.cjs
npx expo export --platform ios --output-dir /tmp/vitalpilot-ios-check
```

Backend metric tests use an isolated SQLite adapter. The optional MySQL integration
test is skipped unless `VITALPILOT_TEST_MYSQL_*` points to a dedicated disposable test
server; never point it at the shared development database. Unit tests do not validate
physical-device permissions, native signing, or live database persistence.

## Device acceptance checks

Use a designated test account and fictional readings, not a real patient's account.

1. Sign in, finish onboarding, and confirm the session restores after reopening.
2. Save a reading for each of the eight metrics, observe the confirmation, and reopen
   each history. Reopen the reading sheet and confirm the latest saved value appears
   at the top without pressing Save again. Check zero values for habits and weight
   with/without profile height.
3. Open Home with Sample preview off. Check today’s summary, earlier BP alerts,
   missing entries, recent trends, and latest-entry habit-goal progress.
4. Verify a failed save retains the draft and does not show success. Review history
   before retrying an uncertain save to avoid duplicate records.
5. Follow a care action to Find a Doctor and confirm the specialty is selected.
6. Allow location once; confirm the detected city/state. Also test denial, disabled
   location services, manual search, no results, and retry after a network failure.
7. Sign out and switch test accounts; previous readings and drafts must not carry over.
8. Check small-screen scrolling, keyboard dismissal, sheet drag, and reduced motion.

## Supported behavior and limits

Account flows, onboarding, all eight metrics’ persistence/history, BP classification, NPI
provider search, opt-in search-area detection, save feedback, and a daily Home summary are connected.
BP classifications depend on configured database thresholds. Clinical rules and
messaging still need the team's review against approved project requirements.

Weight requires the height saved during onboarding so BMI can be calculated. Other metrics return context-aware classifications and guidance. Glucose requires
confirmed fasting for fasting diagnostic ranges; peak flow requires an explicit
personal best, and adult BMI categories require age 20+. Missing context or
configuration is shown explicitly. Habit entries are compared with personal goals,
not treated as clinical diagnoses. The overall result prioritizes urgent health
alerts, warnings, then missing context; no-alert status is not a health guarantee. Nearby distance ranking, ZIP search, insurer matching,
appointment availability and general profile editing are not implemented. PDF reports
and optional Gemini report explanations are connected; see the AI/PDF setup below.
The registered-provider
`/care-team` route remains separate from the external NPI search and may be empty.


## Doctor distance search

In the native mobile app, tap **Use my location**, then **Search providers**.
The backend receives the one-time GPS origin and searches the selected city/state
in the NPI directory. It geocodes practice addresses with the U.S. Census Geocoder
and orders known straight-line distances first. Search is limited to 20 directory
results when coordinates are supplied; it is not a complete radius search and can
miss closer providers in neighboring cities. Unknown distances appear last.

Provider coordinates are cached in server memory for 24 hours. The GPS origin is
not persisted; the application redacts latitude/longitude in Uvicorn access logs.
Any separately configured reverse proxy must also redact these query parameters.
Geocoding has an eight-second lookup budget and can return partial distances.
Editing city/state clears the mobile GPS origin. Manual city/state search still
works without permission or geocoding. No new API key or migration is needed.

Device check: approve location, search, verify distance labels and ordering, edit
the city and confirm old results disappear, then test denied location permission
and manual search. Verify unknown distances remain usable for contact/map actions.

## Mobile goals and account portals

Review/apply `database/migrations/20261102_mobile_portals.sql` before testing the
new goals and sharing flows. It adds explicit patient consent and widens goal
numeric storage. Existing assignments do not imply consent. See
`docs/mobile_ui_followup.md` for rollout, API behavior and device acceptance checks.


## AI/PDF report setup

See `docs/report_generation.md` for backend key configuration, private file storage,
Expo rebuild steps, download/share behavior and verification. PDF-only reports do
not require AI credentials. Never place AI keys in mobile environment variables.

## Metric charts and report viewing

See `docs/metric_history_charts.md` for 7/30/90-day History and Reports behavior,
new native dependency rebuild instructions, and separate View report/Download PDF
flows. This feature does not need a database migration.

For mobile Gemini chat, optional saved-reading context and device checks, see
[Mobile Pilot AI](mobile_pilot_ai.md).
