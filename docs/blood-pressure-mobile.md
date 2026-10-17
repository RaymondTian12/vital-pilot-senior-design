# Blood-pressure mobile integration

The iPhone Vitals sheet saves blood pressure through the authenticated metrics API. Other vital types remain draft-only. Sample preview never submits a reading.

## Contract and state

`POST /metrics` receives only `metric_type: "BLOOD_PRESSURE"`, `systolic_mmhg`, and `diastolic_mmhg`. The server supplies the measurement timestamp. `GET /metrics?metric_type=BLOOD_PRESSURE&limit=20&offset=N` supplies history. Existing classification fields, `status`, and `unclassified_components` are preserved in typed mobile responses.

Home and Vitals share an account-keyed, memory-only store. Saving publishes the confirmed row immediately, then refreshes the first page. History deduplicates by log ID, sorts newest first, and supports additional 20-row pages. Two or more loaded rows produce separate, chronological systolic/diastolic sparklines. Account changes clear this state and drafts; stale responses cannot populate another account. Session revision checks also stop a request from acquiring a new account's token during an account switch.

Only confirmed saves clear input drafts. A transport failure, unreadable save response, or server failure may be ambiguous: no automatic POST retry occurs. The user must refresh and inspect history, then explicitly enable retry if the reading is missing. This is not server-side idempotency; a delayed server transaction can still make a manual retry duplicate a reading. Do not promise exactly-once submission.

Classifications come from the backend. Unknown/partial classifications display an unavailable state and retain labeled known component results, including critical messages. A successful save does not imply a normal classification. Expired sessions offer sign-in again; ordinary errors retain drafts.

## UTC and historical records

Metrics connections set their MySQL session timezone to `+00:00`. Incoming aware timestamps are normalized to UTC before inserting into the TIMESTAMP column; naive legacy client timestamps are interpreted as UTC. Responses always include a UTC offset. Device UI uses local date/time formatting. Ordering uses `logged_at DESC, log_id DESC` for same-second ties.

No schema migration or historical timestamp rewrite is included. MySQL converts existing TIMESTAMP instants into UTC on read. Older writers used server-local `datetime.now()` with the database's session timezone; if those zones differed, an old stored instant may already be shifted. Audit the previous server/database timezone settings and known test readings before relying on historical patient timestamps. Never bulk-correct them based only on this assumption.

## Automated checks

- `python -m unittest discover -s backend/tests -v`: 28 passing tests plus one opt-in MySQL test (skipped without dedicated configuration).
- From the mobile workspace: `node --test tests/*.test.cjs` and `npx tsc --noEmit`.
- `npx expo export --platform ios --platform web` using the configured public test API URL.
- Actual exported screens were exercised in a temporary browser harness against mocked API responses: login, save, draft clearing, Home refresh, failed-save draft retention, and sample-save blocking. This does not validate live persistence or native accessibility.

For a dedicated MySQL test server, configure `VITALPILOT_TEST_MYSQL_HOST`, `VITALPILOT_TEST_MYSQL_USER`, `VITALPILOT_TEST_MYSQL_PASSWORD`, and optionally `VITALPILOT_TEST_MYSQL_PORT`, then run `python -m unittest backend.tests.test_metrics_mysql -v`. No application `.env` database credentials are read by this test. It creates a unique `vitalpilot_test_<uuid>` database, loads the relevant schema and seed, checks persistence with fresh clients/connections, UTC round-trip and account isolation, and drops only that owned database. The test user needs create/drop database privileges. Never point it at the production database server.

## Physical iPhone acceptance checklist

Pending manual verification; a paired device being listed does not establish a pass.

- [ ] Signed-in account saves a reading; result, latest Home card, and Vitals history agree.
- [ ] Force-close/reopen with SecureStore session restoration; real saved row returns.
- [ ] Invalid/blank/fractional values show errors; rapid Save presses create one request.
- [ ] Ordinary rejection preserves the draft. Offline/timeout requires history review before retry.
- [ ] Unknown classification is never shown as Normal; known critical component messages remain visible.
- [ ] Sample preview cannot save, and other vital types stay clearly draft-only.
- [ ] Sign-out/account switch clears readings/drafts and ignores old in-flight responses.
- [ ] Expired session offers sign-in; history errors are not presented as an empty history.
- [ ] Keyboard, small-screen layout, VoiceOver focus/announcements, and Reduce Motion work.
- [ ] Load-more pagination and local date/time formatting work against the isolated MySQL API.

No deployment, clinical-threshold changes, or automatic alerts are included. Keep the implementation PR in draft until dedicated MySQL and physical-device checks are signed off.
