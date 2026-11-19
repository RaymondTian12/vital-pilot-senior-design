# Mobile reports on Render

The live service inspected on November 11, 2026 advertises the older report API (`GET /reports/generate?days=...`). The mobile app expects `POST /reports` with explicit dates, timezone and optional Gemini consent. Do not fall back to the old generation endpoint: it automatically sends data to Gemini and does not honor the mobile consent toggle.

The reconciled mobile backend provides:

- `GET /reports/capabilities`
- `GET /reports?offset=0` (also available as `/reports/history`)
- `POST /reports` returning report metadata
- `GET /reports/{report_id}/pdf` (also available as `/reports/{report_id}/download`)

## Deploy

1. Reconcile this report fix with the branch configured in the existing Render service. Review that branch's other changes before merging; do not simply switch branches and discard the team's notification, report-preview or deployment work.
2. Confirm `ClinicalReports.pdf_data` exists with `SHOW COLUMNS FROM ClinicalReports LIKE 'pdf_data';`. If absent, apply the existing team migration `database/migrations/20261104_report_pdf_storage.sql` once, through your normal database administration process. Do not rerun it when the column already exists. No migration has been applied by this fix.
3. Set `VITALPILOT_REPORT_STORAGE=database` and `environment=production` in Render. Production defaults to database storage; explicit configuration makes the choice visible. Database mode fails rather than silently saving PDFs to an ephemeral filesystem. Ensure the database account can insert/read the blob column.
4. Deploy the reconciled commit to the existing service. Start command: `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`. Build command: `pip install -r backend/requirements.txt`.
5. Run `python3 scripts/check_mobile_backend.py https://vital-pilot-senior-design.onrender.com`. This only checks the public route contract; it does not certify database migrations.
6. Set mobile `EXPO_PUBLIC_API_BASE_URL` to that HTTPS origin, restart Metro with its cache cleared, and rebuild the release app when changing a URL embedded in an installed release.

## Authenticated acceptance checks

Use a test account with saved readings. Generate a report with AI **off**, then view and download it. Verify report history and reopen it after a backend redeploy/restart; bytes must still come from the database. Verify a second test account cannot download the first account's report. With explicit consent, repeat generation with AI on after the cooldown. A missing database column must produce a sanitized error without saving a local PDF or calling an older generation route.

Existing database PDFs from the team's implementation remain readable. Old rows without PDF bytes and without an available legacy local file remain unavailable; regenerate them. The structured `/preview` endpoint and the legacy `GET /reports/generate` implementation on the other branch must be reconciled separately if callers still use them; these changes do not replace that branch wholesale.

For chat history, separately verify `ChatConversations` and the `ChatMessages.conversation_id` column and foreign key against `20261110_chat_conversations.sql`. A successful `/health` or public OpenAPI request cannot confirm those migrations. Do not run that migration blindly against existing populated tables.
