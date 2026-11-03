# Mobile AI and PDF reports

## Setup

The generator uses Michael's website implementation's provider and API: OpenAI
Responses with `gpt-5` by default. It does not switch the team to Gemini. The
website route is unchanged; mobile uses authenticated FastAPI report endpoints.

Install backend requirements and configure the server-side environment:

```sh
.venv/bin/python -m pip install -r backend/requirements.txt
```

Add `OPENAI_API_KEY` to the root `.env` and restart the backend. Do not paste keys
into chat or mobile config. `backend/reporting.env.example` documents optional
model/storage settings. PDF-only generation works without a key. The AI call has
been tested with mocked responses; no live key was configured during implementation.
Model access and billing must be available on the team's API project.

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
OpenAI. Names, emails and patient IDs are excluded. The app sends no health data to
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

AI uses the existing `httpx` dependency with the Responses REST API, server-side
credentials, `store=false`, a bounded output, and a 35-second provider timeout. Output
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

A remote fetch found newer team doctor-portal commits on origin/main. They were not
merged into the modified checkout. Reconcile those portal changes separately before
publishing the combined branch; report work does not replace them.

API integration reference: [OpenAI Responses documentation](https://developers.openai.com/api/docs/guides/migrate-to-responses?api-mode=responses).
Native sharing follows the [Expo SDK 57 sharing API](https://docs.expo.dev/versions/v57.0.0/sdk/sharing/).
