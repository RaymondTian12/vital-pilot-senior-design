# Chart visibility and supported provider search

These changes are on `feature/mobile-charts-provider-fixes-20261109`. They do not
change clinical thresholds or Raymond's assessment icons. Existing uncommitted
report/profile fixes remain present and are not overwritten.

## Chart rendering

The chart measures its card content rather than estimating from the screen.
Seven-day spacing includes explicit margins and reserves space for the Y axis,
keeping the final day visible. Habit bars render without native animation; a
minimum-height marker distinguishes recorded zero from a transparent missing day.
The chart library only supports the minimum-height setting at chart level, not
on each data item.

Longer periods initially scroll near their latest recorded day. Inspect latest
day selects and scrolls to it; previous/next controls also scroll the selection
into view. Empty data disables inspection. Metric, field, period and glucose
context changes reset the selected day. Missing native SVG support produces a
rebuild message while the raw reading table remains usable.

The BP legend now uses separate teal and blue swatches matching the series
colors instead of gray text glyphs. User device verification on November 9, 2026
confirmed that the sleep bar and both BP legend markers look correct.

Michael reported an animation fix in team chat. The fetched `origin/main` did not
yet contain a corresponding chart change during this work. Reconcile that change
when it is published rather than replacing his work blindly. No animation or
assessment-icon changes from another branch were merged here.

## Supported specialties

`GET /doctors/search` accepts optional `specialty_group` values `all`,
`primary_care`, `cardiology`, `pulmonology`, and `endocrinology`. Existing
`specialty` requests are unchanged; supplying both parameters returns 422.
Mobile uses groups and labels the union **All supported specialties**.

The supported taxonomy codes are:

| Group | Codes |
| --- | --- |
| Primary care | 207Q00000X (Family Medicine), 207R00000X (Internal Medicine), 208D00000X (General Practice) |
| Cardiology | 207RC0000X (Cardiovascular Disease) |
| Pulmonology | 207RP1001X (Pulmonary Disease) |
| Endocrinology | 207RE0101X (Endocrinology, Diabetes & Metabolism) |

Sources: [NUCC taxonomy](https://taxonomy.nucc.org/) and
[HL7's published taxonomy listing](https://build.fhir.org/ig/HL7/fhir-directory-attestation/ValueSet-HealthcareProviderTaxonomy.html).
Membership is based on exact codes, not substring matches to broad specialties.
Taxonomies are self-reported directory data, not credential verification.

All supported classifications are queried separately using NPI's documented
`taxonomy_description` filter, with at most three concurrent lookups, six-second
request timeouts and a 13-second aggregate wait. Returned records are checked
against the exact permitted codes, deduplicated by NPI and practice address,
distance-sorted when coordinates are supplied, and then limited for the client.
An eligible secondary taxonomy is displayed as Matched specialty; the primary
specialty and other taxonomies remain in professional details.

The response adds `matched_specialty`, `matched_specialty_is_primary` and
`search_incomplete`. Partial lookups retain successful results with an explicit
notice. Total directory failure returns a sanitized 502. City/state, result-page
and approximate-distance limitations still apply; this is not a complete radius
search. Approved in-app care-team membership and sharing permissions are unchanged.

## Curated portraits

`backend/provider_portraits.json` records NPI, expected names, official image URL,
source-page URL, attribution and verification notes. NPI and names must match
before the API returns `portrait_url`, `portrait_source_url` and
`portrait_attribution`.

The initial three portraits were checked against official sources and the NPI
Registry on November 9, 2026:

- [Bremmy Alsbrooks — Baylor Scott & White](https://www.bswhealth.com/resident/bremmy-alsbrooks), NPI 1750030664.
- [Maria Renela Suller — Baylor Scott & White](https://www.bswhealth.com/physician/maria-renela-suller), NPI 1669777850.
- [Susmitha Aluri — Comanche County Memorial Hospital residency](https://ccmhhealth.com/residency/susmitha-aluri/), NPI 1275282048.

Official image URLs returned images successfully and were visually inspected.
Images remain hosted by their official sources; an image may later become
unavailable. Initials replace missing or failed portraits. Clinic/building photos
remain separate and labeled; legacy or arbitrary `photo_url` values are never
used as verified headshots. No generic or generated person images were added.

The follow-up expansion now covers 27 of the 42 demo providers, with 262 verified
portraits across the broader 644-provider search snapshot. See the
[latest research audit](provider_portrait_targeted_20261111.md) for official sources, matching
evidence, remaining gaps and device checks.

## Validation

- Mobile rendering tests cover every metric and 7/30/90 periods, final-day-only
  observations, zero versus missing bars, BP series and legend colors, empty
  selections, selection reset, scroll targets, and missing native SVG support.
- Provider tests mock classification queries, secondary matches, exclusions,
  deduplication, partial/total failures, timeout cancellation and distance sorting
  before the limit. Existing specialty callers remain covered.
- Portrait tests cover NPI/name mismatches, source metadata, image failure and
  initials fallbacks.
- All 64 mobile tests, mobile TypeScript and the full 122-test backend suite
  passed (one optional backend integration test skipped).
- A live Arlington/TX supported-group search returned HTTP 200, 20 supported
  results, two verified portraits and no partial-lookup flag. No patient data,
  GPS coordinates or database writes were used for that search.
- User confirmed sleep and BP legend fixes on the connected iPhone. The complete
  30/90-day interaction matrix still needs manual device testing; mocked render
  tests do not replace that verification.

Restart the backend to enable grouped searches and portrait metadata, and reload
mobile. No new native package, paid service or database migration was added.
