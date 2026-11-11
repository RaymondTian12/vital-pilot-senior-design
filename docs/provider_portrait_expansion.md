# Search portrait expansion — November 10, 2026

**Latest coverage (November 11): 262/644 verified; 382 unresolved.** See the [individual research audit](provider_portrait_targeted_20261111.md). Counts below describe earlier passes.

Latest follow-up: **216/644** verified portraits, with **428 unresolved**. See the
[follow-up audit](provider_portrait_followup.md). Counts below describe the earlier expansion pass.

The registry now has **149 verified portraits**, adding **123** to the previous
26. The researched first-page inventory contains **644 distinct NPIs**, so
**149/644 (23.1%)** have verified portraits and **495 remain unresolved**.
These counts describe this dated search snapshot, not the entire NPI directory.

The expansion adds 90 Baylor Scott & White, nine UT Southwestern, 23 UCHealth,
and one WellMed portrait. Every accepted image returned HTTP 200 with an image
content type and was visually checked as an individual portrait. Source pages
and exact CMS records were checked before entries were added. Verification notes,
source links, dates and attribution are stored in the existing registry.

## Inventory and reproducibility

The [machine-readable inventory](provider_portrait_inventory.json) records every
provider, search city/state/group, source attempt and verified/unresolved outcome.
All 52 city/group searches completed without a partial-results flag. Each used
the same supported-group implementation as mobile with limit 20, no gender or GPS
filter. Primary care combines the three supported taxonomy lookups before
filtering/deduplicating/limiting; the other groups use their specific taxonomy.
Searches may include additional practice locations and results can change.

Arlington and Dallas were researched first. All remaining uncurated results were
checked against candidate official BSW profile pages; Dallas results also received
UT Southwestern checks and Aurora results received UCHealth checks. An unavailable
candidate URL does not prove that a portrait cannot exist elsewhere. Only exact
NPI/name matches or confirmed name/specialty/practice matches were accepted.
Source discovery and image checks were one-time research outside application
runtime. No search-time scraping or application dependency was introduced.

| Search city | Distinct providers | Verified portraits |
| --- | --- | --- |
| Arlington | 63 | 17 |
| Dallas | 80 | 33 |
| Cedar Hill | 20 | 4 |
| Midlothian | 22 | 9 |
| Bryan | 36 | 3 |
| Austin | 80 | 3 |
| Killeen | 29 | 11 |
| Temple | 80 | 37 |
| Round Rock | 67 | 19 |
| Bedford | 45 | 2 |
| Pine Bluff | 33 | 1 |
| Lawton | 31 | 1 |
| Aurora | 80 | 23 |

Providers may occur in more than one city or group; table rows must not be summed
as a global distinct count. The inventory retains those memberships explicitly.

## Original gaps and exclusions

The original demo inventory now has **27/42 portraits**, with **15 remaining gaps**.
Anjani Amin was resolved through the official
[WellMed profile](https://doctors.wellmedhealthcare.com/details/144280/anjani-amin-family_medicine-arlington),
which displays NPI 1750365839 and the named individual portrait. The original
[coverage audit](provider_portrait_coverage.md) retains the remaining names and
reasons. The other 15 were revisited; none acquired sufficient new evidence.
The inaccessible Medfinity Stuart Lander profile remained unavailable.

Specific rejected candidates illustrate why automatic name matching is avoided:

- Caitlin Bell, NPI **1841751765** (endocrinology), does not receive the UCHealth
  cardiologist Caitlin Bell portrait: the official page identifies **1053843672**.
- Palak Choksi and Heather Brooks have generic UCHealth female-doctor icons;
  neither icon is included as a portrait.
- Neel Butala's named UCHealth portrait was not accepted because the inspected
  page lacked an explicit NPI and its practice location did not resolve the
  mismatch with the CMS Wheeling Street record.
- Bency Abraham's relocated practice, Asha Abraham's same-name profiles and
  unavailable/placeholder sources remain unresolved. Third-party directory
  photos, clinic images and stock faces were not substituted.

## Verification and iPhone checks

Run the relevant backend provider/distance tests, the mobile tests and mobile
TypeScript checks. The registry tests validate metadata, NPI checksums, HTTPS
links, exact names and unknown/mismatched providers. Expanded search fixtures
exercise the unchanged portrait response fields across publishers. A separate
CMS-record replay confirms identity matching for the newly curated records.

Completed checks: **17 backend provider/distance tests**, **64 mobile tests**,
mobile TypeScript, inventory count consistency and `git diff --check` passed.
All **149** curated identities matched their actual CMS records through the
existing doctor-search serialization.

Restart the backend and check these first-page examples on an iPhone:

| City and filter | Provider | NPI |
| --- | --- | --- |
| Arlington — Primary care | Anjani Amin | 1750365839 |
| Dallas — Cardiology | Rajjit Abrol | 1164530739 |
| Arlington — Pulmonology | Kashif Aslam | 1548432636 |
| Dallas — Endocrinology | Marconi Abreu | 1144428319 |
| Aurora — Cardiology | Larry Allen | 1003913674 |

Confirm portrait, source-link navigation and attribution. Check an unresolved
provider such as Stacie Bingaman for initials, and force an image-load failure to
verify the existing fallback. On November 10, the user confirmed portraits and
source links appeared on an iPhone for the four requested examples spanning
primary care, cardiology, pulmonology and endocrinology. A forced image-load
failure remains covered by the mobile rendering test; a separate device failure
test has not been confirmed. Existing clinic images remain separately labeled.

Work remains on `feature/mobile-charts-provider-fixes-20261109`. Existing report
and chart changes are preserved. No API contract, database migration, paid
service, image upload or new dependency was added.
