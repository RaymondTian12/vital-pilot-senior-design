# Reports: use the deployed implementation

## Correction to PR #21

The deployed branch `claude/dreamy-bell-v6ntot` already contains database PDF storage, structured previews, and a matching mobile Reports screen. The previous local checkout used a different mobile/backend contract. Adding a replacement storage implementation was the wrong integration approach. PR #21 has been merged into `main`, but must not be merged wholesale into the deployed branch as a report fix.

This correction is on `fix/mobile-render-report-integration`, based on deployed commit `83acda3`. It retains the team's renderer, `ClinicalReports.pdf_data` / `report_data`, existing report history, native preview, PDF download, and notification implementation. No database migration or storage environment variable is required by this correction.

## Actual API contract

- `GET /reports/generate?days=7|30|90` returns PDF bytes, with `X-Report-Id` identifying the saved report.
- `GET /reports/history` returns `report_title`, `downloadable` and `previewable` fields.
- `GET /reports/{report_id}/preview` returns the structured report snapshot.
- `GET /reports/{report_id}/download` returns the saved database PDF.

The old script's requirement for `/reports`, `/reports/{id}/pdf` was for the other implementation and is superseded. Run this read-only check against Render:

```sh
python3 scripts/check_mobile_backend.py https://vital-pilot-senior-design.onrender.com
```

## Small consent update, not a renderer replacement

New mobile generation explicitly sends `include_ai=false&ai_consent=false` by default. The backend adds authenticated `/reports/capabilities` and optional generation flags. New mobile checks capabilities before generation because an old server would ignore unknown flags and still invoke Gemini. Until this small backend update is deployed, existing history/preview/download work, and new generation displays an update-needed message rather than ignoring the user's AI choice.

With explicit AI opt-in, new prompts omit name/email and include age, sex, saved measurement summaries, assessment context and dates. The explanation remains part of the saved report. Existing callers omitting the new flags retain the original behavior; this patch does not migrate those callers to an explicit-consent flow. No live model request has been made during automated validation.

Deploy this branch's focused diff into the existing deployed branch. Keep its existing build/start commands and database settings. Do not switch Render to the older main implementation or apply PR #21's replacement routes. After deployment:

```sh
python3 scripts/check_mobile_backend.py https://vital-pilot-senior-design.onrender.com --require-consent
```

## Test on iPhone

1. Set `EXPO_PUBLIC_API_BASE_URL=https://vital-pilot-senior-design.onrender.com`, then restart Metro with `npx expo start --dev-client --clear`. Release builds need a rebuild for an embedded API URL change.
2. Sign in with a test account. Existing reports should show their titles and enable **View in app** / **Download** based on the server flags. Open one of each without generating a new report.
3. After the consent update deploys, generate a 7-day report with AI off. View it in-app and download its PDF; both should show no AI explanation. Verify the saved report still opens after a backend restart.
4. If explicitly consenting to share test data, enable AI and generate after the cooldown. Repeat 30/90-day selection. Reports use rolling UTC windows; charts use local calendar-day windows, so boundaries can differ.
5. Double-tap generation: only one request should start. A timeout should advise checking history, and changing accounts during download must discard its result.
6. Verify another account cannot preview/download the first account's report. Missing stored bytes or structured previews should keep the existing explanatory 410 errors.

Do not assume `/health` confirms every database migration. Chat-history schema validation and TestFlight release testing remain separate tasks.
