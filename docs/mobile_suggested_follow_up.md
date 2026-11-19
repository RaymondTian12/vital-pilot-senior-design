# Mobile Suggested follow-up

The backend derives directory guidance from existing saved assessments. It does
not change thresholds, use AI, or create/send a medical referral. No migration
is needed for this feature.

`POST /metrics`, `GET /metrics`, `GET /metrics/history` (including `latest`),
and daily summaries expose an optional `suggested_follow_up` on each reading:

```json
{
  "status": "review",
  "explanation": "Discuss this assessed reading with a primary care provider, who can review it in context and help decide whether specialist care is needed.",
  "primary_specialty_group": "primary_care",
  "alternative_specialty_groups": ["cardiology"]
}
```

Normal health assessments and habit goals return null. Incomplete assessments
return `needs_context` with an explanation and no specialty. Recognized critical
blood-pressure components retain urgent guidance even if the overall assessment
is incomplete. Review and urgent results use primary care first; existing BP
cardiology and peak-flow pulmonology options remain alternatives. Snapshot
assessments in the database are not rewritten.

Mobile displays the guidance on Home, save results and the latest reading in
history. Older readings keep their assessment text without follow-up actions.
Urgent guidance and emergency actions appear before directory options. Missing
fields from an older backend omit the new card while preserving assessment text.
Navigation passes the specialty group and explanation to the existing provider
search, where users still choose location and see existing coverage/empty states.

## Validation

Passed: 57 relevant backend tests, all 71 mobile tests, mobile TypeScript,
and `git diff --check`. iPhone acceptance remains pending.

Automated tests exercise all eight metrics, assessment states, partial critical
BP, saved snapshot preservation, patient ownership, parity across endpoints,
primary-care-first navigation, alternatives, closing the entry sheet before
navigation, old responses and urgent-first rendering. Run:

```sh
.venv/bin/python -m unittest backend.tests.test_suggested_follow_up backend.tests.test_metrics backend.tests.test_metric_assessments backend.tests.test_metric_history backend.tests.test_provider_search backend.tests.test_doctor_distances backend.tests.test_chat_history -q
node --test vitalpilot/frontend/mobile/tests/*.test.cjs
npx --no-install tsc --noEmit -p vitalpilot/frontend/mobile/tsconfig.json
```

## iPhone acceptance check (pending)

Restart the backend and reload mobile. Use the fictional test account:

1. Open a saved warning reading. Confirm **Suggested follow-up**, its explanation
   and **Find primary care** appear on Home and in the latest history entry.
2. From an entry result, select primary care. Confirm the sheet closes and provider
   search selects Primary care, preserving the explanation. Enter city/state and
   search; an empty result should keep the existing location/retry controls.
3. For BP, check Cardiology as the secondary option. For peak flow, check Pulmonology.
4. For an urgent test reading, verify urgent guidance precedes provider options.
   Do not tap the emergency-call button during testing.
5. For unknown glucose context, verify explanatory text without directory buttons.
   Habit goal shortfalls must not generate a care recommendation.
6. Expand an older history entry and confirm no follow-up actions. Check large
   text and VoiceOver: header order, readable wrapping and labeled buttons.

No live patient data or shared database was modified for automated validation.

## Missing context and habit settings

Missing glucose context and peak-flow personal best now show the original
assessment explanation once, followed by **Next step** rather than a repeated
Suggested follow-up block. Glucose offers **Enter a reading with context**; in
the entry sheet it scrolls to the context selector without choosing fasting or
saving automatically. Elsewhere it opens glucose entry.

Missing sleep, water and steps goals offer **Set personal goal**. Missing
peak-flow personal best offers **Set peak-flow personal best**. These close an
open entry sheet before opening Goals & personal best. Settings affect new
readings; saved snapshots are preserved. Habit goal shortfalls remain separate
from doctor recommendations.
