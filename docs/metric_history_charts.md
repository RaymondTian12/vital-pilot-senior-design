# Metric history charts and report viewing

## Implemented screens

Each metric's History route has 7/30/90-day controls (7 days initially), a latest
reading and period summary, an interactive chart, and a paginated reading table.
Reports starts at 30 days, offers a compact metric picker, and uses the same history
component and API for the selected metric. Opening full history carries its period.

Blood pressure displays systolic and diastolic daily averages. Glucose supports
all/fasting/nonfasting/unknown chart filters; the overview statistics explicitly
include all contexts. Weight and BMI use separate toggles/units. Oxygen and peak
flow show daily averages. Day selection displays the underlying range and count.
Sleep, activity and water show the latest saved total per local day, with averages
across logged days only. Recorded zero values are preserved; absent days have no
value and are not interpolated. Charts never classify averages as clinical results.

Chart date labels are sparse in longer windows; scroll horizontally to inspect
all dates. Tap a point/bar or use Previous/Next day to inspect values. The table
is the textual alternative, showing raw observations with expandable assessment
and context. Loading more table rows does not alter full-period summaries.

## API

`GET /metrics/history` requires the signed-in patient's authentication and accepts
`metric_type`, timezone-aware `start_at`/`end_at`, IANA `timezone_name`, `limit`
(default 20, maximum 200), and `offset`. The maximum window is 92 elapsed days so
90 local calendar days remain valid through daylight-saving transitions.

The response includes `daily` calendar bins (including missing dates), `summary`
full-period statistics, `latest`, paginated `records`, and `more`. Summaries count
all health observations, while habit summaries count the newest daily snapshot.
`raw_count` preserves the original number of habit entries. Glucose bins retain
separate context summaries. Records are read newest-first, with log ID breaking
timestamp ties. The server consumes the full date range in batches; there is no
first-page cap on chart calculations. No schema change or shared DB writes occur.

## View report versus Download PDF

Newly generated reports and history items have separate actions:

- View report opens `/report-viewer?id=...` using the already saved PDF.
- Download PDF opens native export/sharing options or downloads a browser file.

Both use the existing authenticated PDF endpoint, without regeneration or Gemini
calls. The viewer receives only a temporary local file or browser Blob URL.
Authentication remains in headers; no public report links or tokens in URLs are
created. The focused viewer owns cleanup, including late downloads after leaving.
An account switch cancels display/sharing. Missing files, expired sessions and
renderer errors show retry/download alternatives. Browser viewing uses its PDF
viewer; unsupported browser PDF rendering may require downloading instead.

## Native rebuild and checks

New packages: React Native Gifted Charts, Expo Linear Gradient, React Native SVG,
React Native PDF and React Native Blob Util. Reinstall/rebuild the development
client before phone testing; restarting Metro alone cannot install native modules.

```sh
cd vitalpilot/frontend/mobile
npx expo run:ios --device --port 8082
```

Android development builds must also be rebuilt with the new dependencies.
Old clients show a rebuild message where native modules cannot load. Backend must
be restarted to register `/metrics/history`.

Automated checks cover full-period statistics beyond 20 rows, all eight metric
routes, local boundaries/DST, missing days, zero/decimal habits, glucose context,
account scoping, and PDF temporary-file/auth behavior. TypeScript and Expo export
checks validate bundling; physical-device chart layout, scrolling, PDF zoom/page
navigation, large text and share-sheet behavior still need manual verification.
Use fictional test readings for presentation screenshots. No demo data is silently
inserted into the database or mixed into patient records.
