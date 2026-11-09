# Mobile Pilot AI

Pilot AI now connects to the authenticated Python `/chat` endpoint. The mobile
screen uses a compact header, suggested questions, a scrollable conversation and
a keyboard-aware composer above the tab bar. Earlier messages remain readable
when a new answer arrives; a New response button brings the reader back down.

The design uses the existing teal palette and components, informed by
[NN/g's chatbot research](https://www.nngroup.com/articles/ai-chatbots-design-guidelines/)
and [Apple's generative AI guidance](https://developer.apple.com/design/human-interface-guidelines/generative-ai).

## Configuration and running

Keep `GEMINI_API_KEY` in the backend environment, never an `EXPO_PUBLIC_` variable.
`GEMINI_CHAT_MODEL` optionally overrides the primary model; the default is the
team's `gemini-3.5-flash`. The existing shared model service retains its fallback
models. All generation attempts share a 30-second budget, with SDK retries
disabled. Fallbacks stop when fewer than ten seconds remain because Gemini rejects
shorter deadlines. Mobile uses a 40-second request timeout.

Restart the backend after updating Python files:

```sh
.venv/bin/uvicorn backend.app:app --env-file .env --host 0.0.0.0 --port 8000
```

Reload the mobile development app. This chat change introduces no new native
package and no database migration. The phone must be able to reach the backend
address configured in the mobile `.env.local`.

## Reading context and contracts

- `POST /chat` retains `{message, history:[{role, content}]}` → `{reply}` for
  existing web callers. Optional `context` and `context_consent:true` add saved
  readings; the response then also includes the actual context and its timestamp.
- `POST /chat/context` previews a selection without calling Gemini. A selection
  contains `metric_types`, `start_at`, `end_at` (exclusive), and `timezone_name`.
  Windows must span 7, 30, or 90 complete local calendar days. Duplicate metrics,
  invalid timezones, naive timestamps and client-supplied record fields fail
  validation. Context requests require an authenticated patient.
- The server queries only that patient's selected metrics using the existing
  history aggregation. The model receives bounded statistics, latest values,
  units, assessment counts and relevant measurement context. It receives no
  account identifiers or unrelated profile fields. The underlying query reads the
  full period; summaries do not use a truncated raw-table page.
- Habit statistics use each local day's latest snapshot. Assessment counts cover
  raw observations, including historical warnings; they are distinct from latest
  status and daily habit totals. Partially classified BP retains recognized
  component warnings. Legacy assessments may use current settings.
- The attachment sheet starts with no metrics selected and a 7-day period. Users
  preview before choosing Share with Gemini. No model request occurs until Send.
  Readings are fetched again on each turn, so newer saves can change the summary.
- Context changes/removal after messages require a new conversation. Failed
  context loading is never silently replaced with a general chat. Users can retry
  or explicitly start without readings.

Messages are limited to 4,000 characters. The backend accepts up to 100 history
messages for compatibility with the existing website; the most recent ten history messages
are sent, capped at 24,000 characters. Assistant output is limited to 6,000
characters. Only final model text is displayed, excluding thought parts.

Conversations, drafts and reading selections stay in memory across tab changes.
New chat, credential changes, sign-out and app restart clear them. Late responses
cannot populate a cleared conversation or another account. Retries reuse the
unanswered message; duplicate presses do not send additional requests. Health
payloads, prompts, provider errors and credentials are not logged by the new chat
flow. Google processes the text sent to Gemini; in-memory storage does not imply
that Google has no retention policy.

## Verification

Automated tests cover web contract compatibility, authentication, patient
isolation, all metric selections, 7/30/90-day and DST windows, consent and invalid
requests, missing data, historical/partial BP warnings, shared model deadlines,
final-text filtering, retries, duplicate sends and late-response rejection.
TypeScript and iOS/web exports were checked.

Live endpoint smoke tests returned HTTP 200 for a general educational question
and a consented fictional sleep summary. The latter used a mocked record loader;
no actual patient records were read or sent during live tests.

Still verify on a physical iPhone: keyboard/tab positioning, large text, long
answers, scrolling while responses arrive, attachment sheet dismissal, network
failure/retry and account changes. Bundle checks are not device interaction tests.
