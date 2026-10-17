# Metrics API classification

Authenticated `POST /metrics` and `GET /metrics?metric_type=BLOOD_PRESSURE` return component and overall classifications against the deployed `ClinicalThresholds` rows. History is evaluated using current thresholds; this API does not persist a historical classification snapshot.

The `classification` object includes:

- `systolic` / `diastolic`: each matching threshold result, or `null` if no row matches.
- `overall`: the worse recognized component tier, **only when both components have recognized tiers**. Otherwise `null`.
- `status`: `classified` or `unclassified`.
- `unclassified_components`: names of missing/unrecognized component classifications.

An unclassified result retains the raw reading and any known component result. It is not a normal/clear result. Clients must display an explicit unavailable/unknown state when `status` is `unclassified` or `overall` is null, and must not discard a known component's alert. For example, if only the systolic threshold lookup succeeds, its result is still present under `systolic`.

Missing or changed threshold configuration must never silently downgrade an unrecognized component to the other component's normal tier. Invalid values outside configured ranges are also unclassified; the API does not invent additional clinical boundaries. Existing positive-integer validation remains in place. A database exception during classification returns an error and rolls back a new insert.

Run regression checks from the repository root:

```sh
python -m unittest discover -s backend/tests -v
```

Metrics tests run the real FastAPI routes and classifier through an isolated SQLite SQL adapter with boundaries loaded from `database/seed_clinical_thresholds.sql`. They cover classification boundaries, missing/unrecognized/out-of-range thresholds, auth/account isolation, input validation, and rollback. They do not replace integration testing against the deployed MySQL configuration.

Separate follow-ups: batch threshold lookups for history; align the mobile submission payload with the backend contract.
