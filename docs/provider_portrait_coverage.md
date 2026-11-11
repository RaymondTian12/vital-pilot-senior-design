# Demo provider portrait coverage

**Latest coverage (November 11): 262/644 verified; 382 unresolved.** See the [individual research audit](provider_portrait_targeted_20261111.md). Counts below describe earlier passes.

**November 10 update:** the demo subset now has **27/42** verified portraits.
Anjani Amin was resolved through the official WellMed profile. The expanded
search inventory has **216/644** portraits; see the
[latest research audit](provider_portrait_followup.md) and its complete inventory.
The November 9 counts below describe the original curation pass.

Verified on **2026-11-09** on `feature/mobile-charts-provider-fixes-20261109`.

The clinic-photo mappings in `vitalpilot/frontend/mobile/src/app/doctors.tsx`
contain **42 individual providers**. The registry now covers **26 of 42 (62%)**:
**23 newly verified portraits** plus the original three. **16 remain without a
verified portrait** and continue to display initials. This inventory describes
these demo mappings, not all providers available through NPI search.

Names, specialties and practice locations were compared with the public
[CMS NPI Registry](https://npiregistry.cms.hhs.gov/). Every registry entry stores
its exact CMS API lookup URL, official source page, attribution, verification date
and matching evidence. Where an official profile supplies an NPI, that identifier
must match. Otherwise, both specialty/credential and practice were cross-checked.
Leisha Bevoni's additional NPI practice location establishes the Inwood match.
Janet Adeniran and Euginia Agbatekwe were previously name-only clinic mappings;
their NPIs were resolved from CMS without changing the clinic mappings.

All 23 new images returned HTTP 200 with an image content type and were visually
inspected as individual portraits. URLs were extracted from official profile
HTML/image metadata, including the full-resolution lazy-image URLs. No image URL
was constructed from a guessed NPI or filename. The original three were also
rechecked for availability. Hospital/practice CDN hosts are retained as supplied
by those official pages. Demo clinic addresses may differ from current official
profiles; matching notes explain those cases. Images remain hosted by their
publishers.

## Verified inventory

| Provider | NPI | Known demo practice / current-source note | Official portrait source |
| --- | --- | --- | --- |
| Abdulmuttaleb Al Soufi | 1922505080 | Pine Bluff, AR (NPI); current BSW Grand Prairie | [Baylor Scott & White Health](https://www.bswhealth.com/physician/abdulmuttaleb-al-soufi) |
| Susmitha Aluri | 1275282048 | CCMH, 3401 W Gore Boulevard, Lawton, OK | [Comanche County Memorial Hospital residency program](https://ccmhhealth.com/residency/susmitha-aluri/) |
| Maria Renela Suller | 1669777850 | BSW Midlothian, 4431 E Highway 287 | [Baylor Scott & White Health](https://www.bswhealth.com/physician/maria-renela-suller) |
| Sarah Abdellatif | 1043660178 | Methodist Cedar Hill, 950 Belt Line Road | [Methodist Health System](https://www.methodisthealthsystem.org/provider/sarah-abdellatif-do) |
| Karla Acosta-Monroe | 1003306705 | BSW Bryan, 2612 W Villa Maria Road | [Baylor Scott & White Health](https://www.bswhealth.com/physician/karla-acosta-monroe) |
| Akhil Agarwal | 1457700163 | BSW Austin, 11209 S Interstate 35 | [Baylor Scott & White Health](https://www.bswhealth.com/physician/akhil-agarwal) |
| Daniel Addison | 1598091092 | UTSW Cardio-Oncology, 6202 Harry Hines Boulevard, Dallas | [UT Southwestern Medical Center](https://utswmed.org/doctors/daniel-addison/) |
| Tayo Addo | 1457328403 | UTSW Heart and Vascular, 2001 Inwood Road, Dallas | [UT Southwestern Medical Center](https://utswmed.org/doctors/tayo-addo/) |
| David Aguilar | 1326128695 | UTSW Heart and Vascular, 2001 Inwood Road, Dallas | [UT Southwestern Medical Center](https://utswmed.org/doctors/david-aguilar/) |
| Ossama Abou Hassan | 1083252332 | BSW Temple, 2401 S 31st Street | [Baylor Scott & White Health](https://www.bswhealth.com/physician/ossama-hassan) |
| Farah Al-Saffar | 1972846285 | BSW Dallas, 3410 Worth Street | [Baylor Scott & White Health](https://www.bswhealth.com/physician/farah-al-saffar) |
| Amit Alam | 1588906986 | BSW Dallas (demo); current NYU Langone | [NYU Langone Health](https://nyulangone.org/doctors/1588906986/amit-h-alam) |
| Shema Ahmad | 1316118300 | BSW Round Rock, 425 University Boulevard | [Baylor Scott & White Health](https://www.bswhealth.com/physician/shema-ahmad) |
| Tres Barrera | 1942356522 | BSW Round Rock, 425 University Boulevard | [Baylor Scott & White Health](https://www.bswhealth.com/physician/tres-barrera) |
| Leisha Bevoni | 1508956210 | UTSW Hillcrest (demo); additional NPI/official Inwood practice | [UT Southwestern Medical Center](https://utswmed.org/doctors/leisha-bevoni/) |
| Salomon Banarer | 1841232444 | Dallas Diabetes and Endocrine Center, 7777 Forest Lane C-340 | [Dallas Diabetes and Endocrine Center / Privia Health](https://www.myprivia.com/myddec/providers/dr-salomon-banarer) |
| Cheri Andrews | 1437110418 | Catalyst SW Green Oaks, Arlington | [Catalyst Physician Group](https://www.catalystphysiciangroup.com/provider/cheri-andrews/) |
| Chad Bartel | 1720472970 | Catalyst Viridian, Arlington | [Catalyst Physician Group](https://www.catalystphysiciangroup.com/provider/chad-bartel/) |
| Alyson Barton | 1154090264 | Arbrook, Arlington (demo); current Texas Health Bedford | [Texas Health Resources](https://www.care.texashealth.org/providers/thpg/texas-health-internal-medicine/nurse-practitioner---family/alyson-paige-barton-aprnfnp-c) |
| Bremmy Alsbrooks | 1750030664 | BSW resident / 3301 Matlock Road, Arlington | [Baylor Scott & White Health](https://www.bswhealth.com/resident/bremmy-alsbrooks) |
| Aamir Amin | 1962611830 | HeartPlace South Arlington / Mansfield | [HeartPlace](https://www.heartplace.com/provider/aamir-a-amin-md) |
| Atif Sohail | 1265431787 | Arbrook, Arlington (demo); current Heart & Sleep Clinics, Matlock Road | [Texas Health Resources](https://www.care.texashealth.org/providers/affiliated/heart--sleep-clinics-of-america/cardiology/atif-sohail-md) |
| Manikumar Bheemarasetti | 1497986533 | HeartPlace North Arlington, 902 W Randol Mill Road | [HeartPlace](https://www.heartplace.com/provider/manikumar-bheemarasetti-mbbs-md-rpvi) |
| Thomas Sperry | 1578977856 | HeartPlace North Arlington, 902 W Randol Mill Road | [HeartPlace](https://www.heartplace.com/provider/thomas-p-sperry-md) |
| Shelle Barber | 1750580262 | Catalyst Fielder, Arlington | [Catalyst Physician Group](https://www.catalystphysiciangroup.com/provider/shelle-barber/) |
| Janet Adeniran | 1578980678 | Methodist South Arlington, 6507 S Cooper Street | [Methodist Health System](https://www.methodisthealthsystem.org/provider/janet-adeniran-do) |

## Remaining gaps

These outcomes mean that a usable official portrait was not verified during this
research, rather than proving that no photograph exists anywhere. Keep initials
until an official identity match and visual image check can be completed.

| Provider | NPI | Known practice | Verification outcome |
| --- | --- | --- | --- |
| Joshua Allen | 1932858016 | 1400 S Potomac Street, Aurora, CO | No matching official individual portrait verified. Search surfaced Joshua Allen MD profiles at Inova/CHRISTUS; this NPI is Joshua Allen DO in Aurora, so those were excluded. |
| Stacie Bingaman | 1073715165 | 400 W Arbrook Boulevard, Arlington; current Acclaim/JPS listing | [WellMed official listing](https://doctors.wellmedhealthcare.com/details/231822/stacie-bingaman-endocrinology_diabetes_and_metabolism-fort_worth) uses No_Photo.gif. No usable Acclaim/JPS official portrait verified. |
| Asha Abraham | 1417535154 | Methodist Charlton, 3500 W Wheatland Road, Dallas | No matching Methodist portrait verified. Excluded the Pediatric Associates of Dallas Asha Ann Abraham profile and other Asha Abraham specialties/NPIs; this record is Asha Baby Abraham, family medicine. |
| Bency Abraham | 1942942602 | Oak Street Pleasant Grove, Dallas (demo); current NPI Mission Viejo, CA | [Oak Street profile URL](https://www.oakstreethealth.com/doctors/bency-abraham) redirects to a general doctor directory, including the Spanish URL. Current NPI practice is Mission Viejo, CA. No current official individual image/identity pairing verified. |
| Mansoor Ahmad | 1639583321 | BSW Killeen, 3801 Scott and White Drive | [Official BSW profile](https://www.bswhealth.com/physician/mansoor-ahmad) publishes default-provider-photo.svg rather than an individual portrait. |
| Richard Berger | 1144317850 | Dallas Endocrinology, 7777 Forest Lane B430 | NPI confirms Richard E. Berger, endocrinology, Dallas. No accessible official individual portrait verified; third-party directory images excluded. BSW/Southwestern profile checks returned HTTP errors. |
| Anjani Amin | 1750365839 | WellMed, 1540 W Interstate 20, Arlington | **Resolved November 10:** [official WellMed profile](https://doctors.wellmedhealthcare.com/details/144280/anjani-amin-family_medicine-arlington) explicitly supplies the exact NPI and a named individual portrait. |
| Michael Graceffo | 1295799492 | HeartPlace South Arlington, 400 W Arbrook Boulevard | No individual portrait verified in current [HeartPlace directory](https://www.heartplace.com/providers); BSW/Southwestern profile checks returned HTTP errors. Third-party directory headshots excluded. |
| Michael Mitchell | 1669436655 | HeartPlace South Arlington, 400 W Arbrook Boulevard | No individual portrait verified in current [HeartPlace directory](https://www.heartplace.com/providers); BSW/Southwestern profile checks returned HTTP errors. Same-name physicians in other states excluded. |
| Stuart Lander | 1215991906 | HeartPlace North Arlington, 902 W Randol Mill Road | [Official Southwestern profile](https://www.southwesternhealth.org/find-a-provider/medical-staff/stuart-lander) confirms the North Arlington practice but exposes no individual portrait. The Medfinity profile could not be retrieved during verification. |
| Stephen Lenhoff | 1477517456 | HeartPlace North Arlington, 902 W Randol Mill Road | No current official individual portrait verified. Current HeartPlace directory did not supply a Lenhoff portrait; old HeartPlace and BSW/Southwestern profile URLs returned HTTP errors. |
| Shishir Sharma | 1669735734 | HeartPlace North Arlington, 902 W Randol Mill Road | [Official Southwestern profile](https://www.southwesternhealth.org/find-a-provider/medical-staff/shishir-sharma) confirms the North Arlington practice but exposes no individual portrait. Old HeartPlace and BSW profile URLs returned HTTP errors. |
| George Anagnostis | 1578523122 | Fielder, 1300 S Fielder Road, Arlington | [Catalyst provider URL](https://www.catalystphysiciangroup.com/provider/george-anagnostis/) redirects to the general provider directory. No individual portrait verified; do not use a different doctor from the redirected list. |
| Jim Anagnostis | 1144281205 | Fielder, 1300 S Fielder Road, Arlington | No current individual portrait verified on Catalyst Fielder/provider directory. Candidate individual profile returned an HTTP error; third-party images excluded. |
| Donna Baker | 1023079019 | Fielder, 1300 S Fielder Road, Arlington | No current individual portrait verified on Catalyst Fielder/provider directory. Candidate individual profile returned an HTTP error; third-party images excluded. |
| Euginia Agbatekwe | 1376065490 | 2700 Tibbets Drive, Bedford | CMS resolves the previously name-only demo mapping to NPI 1376065490 at 2700 Tibbets Drive. No official hospital/practice portrait page verified; third-party directory images excluded. |

## Validation and device checks

Registry tests check required metadata, real NPI check digits, HTTPS URLs,
verification dates, exact NPI/name matching, and unknown/mismatched identities.
Mocked doctor searches check expanded portraits and source metadata reach the
existing mobile response contract. Existing mobile rendering tests cover failed
image loading, initials fallback and exclusion of clinic images from portraits.
Live image checks are a curation step rather than network-dependent unit tests.

Validation passed: 16 relevant backend provider/distance tests, all 64 mobile
tests, mobile TypeScript checks and `git diff --check`. A separate check replayed
the actual public CMS records through doctor search and confirmed all 26
identities receive their matching portrait metadata.

Restart the backend, then search these examples on mobile:

- Arlington, primary care: Cheri Andrews, Chad Bartel, Shelle Barber.
- Arlington, cardiology: Manikumar Bheemarasetti, Thomas Sperry, Aamir Amin.
- Dallas, cardiology: Tayo Addo, David Aguilar, Daniel Addison.
- Cedar Hill, primary care: Sarah Abdellatif.
- Dallas, endocrinology: Salomon Banarer or Leisha Bevoni.

NPI search is page/limit dependent; an example may require narrowing the search.
Confirm each image and source link, then test an unmapped provider for initials.
A forced image-load failure should also show initials while keeping the name and
source link usable. Expanded portraits still require an iPhone check; automated
rendering tests do not establish on-device network availability.

No runtime scraping, new API fields, uploads, dependencies or migrations were
added by this expansion. Existing image error handling and strict matching are
unchanged. Reverify a source before replacing an image or changing an identity.
