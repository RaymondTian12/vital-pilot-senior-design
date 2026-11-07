# Mobile AI and PDF reports

## Setup

The generator now follows the team's Gemini report implementation in commit
`bb233ed` on `origin/claude/dreamy-bell-v6ntot`. Its count/range/average reporting
was adapted to use timezone-aware latest daily habit totals. The authenticated
mobile generation/history/download/share workflow is preserved. This is a selective
reconciliation, not a merge of that entire branch. The website chatbot is unchanged.

Install backend requirements and configure the server-side environment:

```sh
.venv/bin/python -m pip install -r backend/requirements.txt
```

Add `GEMINI_API_KEY` to the root `.env` and restart the backend. Do not paste keys
into chat or mobile config. `backend/reporting.env.example` documents optional
model/storage settings. PDF-only generation works without a key. The AI call has
been tested with mocked responses; no live key was configured during implementation.
The default model is `gemini-3.5-flash`, matching Omar's current model choice. Set
`GEMINI_REPORT_MODEL` to a model enabled on the team's project if that model is
unavailable. Model access and billing must be available on the team's API project.

Mobile now depends on `expo-file-system` and `expo-sharing`. Install workspace
packages, rebuild/reinstall the native development app, then restart Expo:

```sh
cd vitalpilot/frontend/mobile
npx expo run:ios --device --port 8082
```

Use an available port if 8082 is occupied. Older binaries may show an actionable
message rather than opening the share sheet. Native sharing needs phone verification.

## User flow

Open Reports, select 7/30/90 days, and tap Generate PDF. Optional AI explanation is
off by default. Enabling it and generating is explicit consent to send the reduced
measurement summary, dates, relevant assessment context and classifications to
Google Gemini. Names, emails and patient IDs are excluded. The app sends no health data to
AI while simply viewing reports. An unavailable AI service produces a saved-data
PDF with an explicit notice instead of losing the report.

Download/share opens the device share sheet. A temporary cache copy is removed
when sharing completes. Recipients receive a sensitive exported copy; revoking
portal permission cannot recall shared files. Web uses an authenticated Blob download.

## Backend behavior

- `GET /reports/capabilities`: whether AI is configured, without revealing keys.
- `POST /reports`: authenticated date/time window and timezone, optional
  `include_ai` and required `ai_consent` when enabled. Reads only the current user's
  data. Requires an existing health profile and at least one saved reading.
- `GET /reports?offset=0`: current patient's generated reports, pages of 20.
- `GET /reports/{id}/pdf`: verifies ownership on every download; no public links
  or authentication tokens in URLs.

Metadata uses the existing ClinicalReports table. No report-specific migration is
needed. PDF files live outside public routing in `.reports/`, with private file
permissions and random filenames. This directory is ignored by Git. For deployment,
set `VITALPILOT_REPORT_DIR` to a private persistent volume, and back it up consistently
with the database. Local files are not shared across multiple server instances.
No retention/deletion workflow or object-storage integration is implemented yet.

AI uses the existing `httpx` dependency with the Gemini `generateContent` REST API,
server-side credentials in the `x-goog-api-key` header, a bounded output, and a
35-second provider timeout. This avoids adding a Python SDK requirement to the
project's Python 3.9 environment. Blocked, empty and incomplete responses fall back
to the saved-data PDF. Output
is labeled as AI-generated and is rendered as escaped text; assessments are shown
separately and remain authoritative. This does not guarantee AI correctness or make
claims about the provider's broader data-retention policies. Failures are sanitized.
The one-generation-per-minute limit is in-memory per user/process, not a distributed
production quota. No automatic retry: check report history after uncertain requests.

Tables include up to 100 newest entries per metric and explicitly label limits;
summary counts cover all loaded readings. The existing per-metric query limit is
also disclosed when reached. Blood-pressure classifications use current thresholds;
other saved assessments retain their stored context. Missing data never becomes zero.

## Verification and integration

Tests cover valid PDFs, escaping text, AI consent, no-key/provider failure paths,
authenticated ownership, traversal rejection, private file permissions, rollback
cleanup and generation throttling. Check multi-page reports with fictional readings,
sharing/cancelling, account switches, unavailable native modules and no network on
an actual phone before demoing.

The team doctor portal from origin/main is integrated. The Gemini report provider
and numeric statistics are now reconciled; no Google Gemini key was configured or
live health-data requests made during implementation. The original branch's public
GET-generation route, patient-identifying AI context, and raw provider error text
were not ported. We retain explicit AI consent, minimized context and authenticated
POST generation/private downloads. A prior-period AI comparison and identifying
patient header from the original branch are not included in this mobile version.
Omar's chatbot and Mohammad's full admin portal remain separate integrations.

API reference: [Gemini text generation](https://ai.google.dev/gemini-api/docs/text-generation).
Native sharing follows the [Expo SDK 57 sharing API](https://docs.expo.dev/versions/v57.0.0/sdk/sharing/).

Model note (November 3, 2026): Google documents `gemini-3.5-flash` as deprecated
and automatically routed to `gemini-3.6-flash`. The configured name follows Omar's
request; it does not guarantee the underlying served model is 3.5. See
https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash .
