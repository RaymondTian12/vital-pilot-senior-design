# Remaining-provider portrait research — November 10, 2026

**Latest coverage (November 11): 262/644 verified; 382 unresolved.** See the [individual research audit](provider_portrait_targeted_20261111.md). Counts below describe earlier passes.

Added **67 verified portraits**, bringing the registry from **149 to 216**.
The fixed search inventory remains **644 providers**: **216/644 (33.5%)** now
have verified portraits, and **428 remain unresolved**. All original 149 entries
were preserved without changing their metadata or images.

## Research method and limits

All **495 previously unresolved NPIs** received an additional official-directory
name search. The pass used published hospital/practice/university indexes and
directory pages, rather than guessed image filenames. Arlington and Dallas were
prioritized, then the remaining cities followed the saved inventory order.
The [full inventory](provider_portrait_inventory.json) records the shared index
URLs and each provider's checked directories, matching profiles and outcomes.

There were **148 providers with indexed name matches**, yielding **196 profile
checks**. For the other **347**, no name match was found in the inspected indexes.
That does not prove no official portrait exists elsewhere: these indexes are
incomplete, can omit current profiles, and some provider pages are not indexed.
The audit distinguishes these outcomes from image failures and identity conflicts.
No public-web completeness or guaranteed portrait coverage is claimed.

Sources included Texas Health, Baylor Scott & White physician and residency
indexes, Methodist, Ascension, Austin Regional Clinic, CU Medicine, HeartPlace,
Medical City, UAMS, Jefferson Regional and Memorial Health System of Southwest
Oklahoma (the current CCMH site). Additional UCHealth/Austin indexes were inspected
but exposed no matching provider links. Acclaim's index returned HTTP 403 and was
not bypassed. The UT Health Austin index redirect could not be resolved.

The 67 additions comprise 23 Texas Health, 11 Ascension, eight Methodist, seven
Austin Regional Clinic, seven Jefferson Regional, six Memorial Health Southwest
Oklahoma, three BSW physician/residency, and two CU Medicine portraits.
All accepted images returned HTTP 200 with image content and were visually checked
as real individual portraits. Source pages supplied the actual URLs, including
lazy-loaded images and primary profile metadata; no portrait URL was guessed.

An exact official NPI/structured identifier was required where present. Otherwise,
name, specialty and practice were matched against the exact CMS record. Two
address-format discrepancies were resolved explicitly using the same clinic and
matching practice phone: Fidelis Amadi's Everett Street/Drive listing and Sadeem
Mahmood's South Hazel/SHazel Street listing. Registry notes retain this evidence.

## Coverage by search city

| City | Distinct inventoried providers | Verified portraits |
| --- | --- | --- |
| Arlington | 63 | 22 |
| Dallas | 80 | 35 |
| Cedar Hill | 20 | 7 |
| Midlothian | 22 | 13 |
| Bryan | 36 | 3 |
| Austin | 80 | 12 |
| Killeen | 29 | 11 |
| Temple | 80 | 40 |
| Round Rock | 67 | 27 |
| Bedford | 45 | 20 |
| Pine Bluff | 33 | 8 |
| Lawton | 31 | 7 |
| Aurora | 80 | 25 |

Providers can appear in multiple cities/groups; do not sum rows as a distinct
global total. Counts refer to the saved first-page search snapshot, not every
provider practicing in a city.

## Rejected and unresolved evidence

- Twenty indexed profile checks identified a different NPI, including same-name
  physicians in other specialties. The inventory retains those source URLs.
- Twelve advertised image URLs were identifiable placeholders. Of 105 remaining
  image candidates, 24 advertised URLs failed to load. These were not substituted
  with another doctor's image.
- The CU Medicine Michael Mitchell, Gregory Allen and Sapna Patel profiles belong
  to different specialties/practices from the inventoried CMS records.
- The JRMC James A. Campbell Jr. profile is nephrology and embeds NPI 1689789984;
  the inventory's James Campbell record is pulmonary disease, NPI 1629078266.
- Renato Caballero II and III have separate official portraits. The reviewed
  evidence did not sufficiently connect either image to each target NPI and
  practice, so both remain unresolved instead of assigning by first/last name.
- Andrew Miller, John Cox and Neel Butala have named portraits, but the inspected
  sources did not resolve their practice/identifier ambiguity. They retain initials.
- Existing placeholders, including Stuart Lander's Texas Health image, remain
  excluded even when an official profile correctly identifies the provider.

## Added portraits

| Provider | NPI | Official source |
| --- | --- | --- |
| Jonathan Besas | 1124400031 | [Texas Health Resources](https://www.care.texashealth.org/providers/affiliated/texas-pulmonary--critical-care-consultants/pulmonary-disease/jonathan-besas-do) |
| Abigale Henry | 1598151615 | [Texas Health Resources](https://www.care.texashealth.org/providers/affiliated/texas-pulmonary--critical-care-consultants/pulmonary-disease/abigale-henry-md) |
| Chandana Konduru | 1669423281 | [Texas Health Resources](https://www.care.texashealth.org/providers/affiliated/diabetes--endocrine-care-south-west/endocrinology/chandana-konduru-md) |
| William Nesbitt | 1386608370 | [Texas Health Resources](https://www.care.texashealth.org/providers/affiliated/texas-cardiac-arrhythmia/cardiology/william-hampton-nesbitt-md) |
| Aref Obagi | 1154716256 | [Texas Health Resources](https://www.care.texashealth.org/providers/thpg/texas-health-heart-and-vascular-specialists/internal-medicine-interventional-cardiology/aref-obagi-md) |
| Imran Afridi | 1861459927 | [Methodist Health System](https://www.methodisthealthsystem.org/provider/imran-afridi-md) |
| Anshul Agarwal | 1285845743 | [Methodist Health System](https://www.methodisthealthsystem.org/provider/anshul-agarwal-md) |
| Cecil Bailey | 1871546598 | [Methodist Health System](https://www.methodisthealthsystem.org/provider/cecil-bailey-md) |
| Sharisse Holinej | 1467764209 | [Methodist Health System](https://www.methodisthealthsystem.org/provider/sharisse-holinej-md) |
| Brian Jones | 1225002298 | [Methodist Health System](https://www.methodisthealthsystem.org/provider/brian-d-jones-md) |
| Cersten Bradley | 1578206488 | [Methodist Health System](https://www.methodisthealthsystem.org/provider/cersten-bradley-md) |
| Dino Cekro | 1528350402 | [Methodist Health System](https://www.methodisthealthsystem.org/provider/dino-cekro-md) |
| Jeffrey Mcdaniel | 1366576282 | [Methodist Health System](https://www.methodisthealthsystem.org/provider/jeffrey-mcdaniel-md) |
| Charisse Hanne Te | 1861814311 | [Baylor Scott & White Health](https://www.bswhealth.com/physician/charisse-hanne-te) |
| Merlin Abraham | 1417215757 | [Austin Regional Clinic](https://www.austinregionalclinic.com/doctors/merlin-abraham) |
| Anne Adams | 1619394558 | [Austin Regional Clinic](https://www.austinregionalclinic.com/doctors/anne-adams) |
| Kelly Alberda | 1972525376 | [Ascension](https://healthcare.ascension.org/find-care/provider/1972525376/kelly-alberda) |
| Steven Alexander | 1306225784 | [Ascension](https://healthcare.ascension.org/find-care/provider/1306225784/steven-alexander) |
| Mohammad Alsumrain | 1639327885 | [Ascension](https://healthcare.ascension.org/find-care/provider/1639327885/mohammad-alsumrain) |
| Fidelis Amadi | 1366425365 | [Austin Regional Clinic](https://www.austinregionalclinic.com/doctors/fidelis-amadi) |
| Harsh Babbar | 1114105418 | [Ascension](https://healthcare.ascension.org/find-care/provider/1114105418/harsh-babbar) |
| James Black | 1831159789 | [Austin Regional Clinic](https://www.austinregionalclinic.com/doctors/james-black) |
| Padma Horvit | 1215949169 | [Austin Regional Clinic](https://www.austinregionalclinic.com/doctors/padma-horvit) |
| Leslie Barkis | 1669468039 | [Ascension](https://healthcare.ascension.org/find-care/provider/1669468039/leslie-barkis) |
| Nithin Kesireddy | 1871054270 | [Baylor Scott & White Health residency program](https://www.bswhealth.com/resident/nithin-kesireddy) |
| Andrew Kim | 1144750704 | [Baylor Scott & White Health](https://www.bswhealth.com/physician/andrew-i-kim) |
| Sarah Ali | 1881258937 | [Ascension](https://healthcare.ascension.org/find-care/provider/1881258937/sarah-ali) |
| Sandeep Badyal | 1073176533 | [Austin Regional Clinic](https://www.austinregionalclinic.com/doctors/sandeep-badyal) |
| Sarat Burri | 1831325380 | [Austin Regional Clinic](https://www.austinregionalclinic.com/doctors/sarat-burri) |
| Tannon Carroll | 1154484715 | [Ascension](https://healthcare.ascension.org/find-care/provider/1154484715/tannon-carroll) |
| Michael Lenis | 1295730828 | [Ascension](https://healthcare.ascension.org/find-care/provider/1295730828/michael-lenis) |
| Shanti Nulu | 1699961938 | [Ascension](https://healthcare.ascension.org/find-care/provider/1699961938/shanti-nulu) |
| Stephanie Shaw | 1760687354 | [Ascension](https://healthcare.ascension.org/find-care/provider/1760687354/stephanie-shaw) |
| Kamalpreet Singh | 1750543435 | [Ascension](https://healthcare.ascension.org/find-care/provider/1750543435/kamalpreet-singh) |
| Asma Ahmed | 1548904626 | [Texas Health Resources](https://www.care.texashealth.org/providers/thpg/texas-health-hospital-medicine/internal-medicine/asma-ahmed-md) |
| Neeraj Badhey | 1760508592 | [Texas Health Resources](https://www.care.texashealth.org/providers/thpg/texas-health-heart-and-vascular-specialists/internal-medicine-interventional-cardiology/neeraj-surender-badhey-md) |
| Madhuri Devdhar | 1558517193 | [Texas Health Resources](https://www.care.texashealth.org/providers/affiliated/endocrine-associates-of-mid-cities---dr-madhuri-devdhar/endocrinology/madhuri-mysorerao-devdhar-md) |
| David Eisen | 1356343867 | [Texas Health Resources](https://www.care.texashealth.org/providers/thpg/texas-health-heart-and-vascular-specialists/internal-medicine-cardiovascular-disease/david-roy-eisen-md) |
| Russell Fisher | 1740282268 | [Texas Health Resources](https://www.care.texashealth.org/providers/affiliated/mid-cities-cardiac-care-center---bedford/cardiology/russell-george-fisher-do) |
| Munawar Haider | 1124018155 | [Texas Health Resources](https://www.care.texashealth.org/providers/affiliated/preferred-primary-care/family-medicine/munawar-haider-md) |
| Muhammad Jawaid | 1922664770 | [Texas Health Resources](https://www.care.texashealth.org/providers/thpg/texas-health-hospital-medicine---southwest/family-medicine/muhammad-umar-jawaid-md) |
| Amritpal Khela | 1831659507 | [Texas Health Resources](https://www.care.texashealth.org/providers/thpg/texas-health-family-care/family-medicine/amritpal-kaur-khela-md) |
| Vani Kotha | 1124233846 | [Texas Health Resources](https://www.care.texashealth.org/providers/affiliated/endocrine-associates-of-mid-cities---dr-vani-kotha/endocrinology/vani-kotha-md) |
| Tu Khac Le | 1649258757 | [Texas Health Resources](https://www.care.texashealth.org/providers/thpg/texas-health-heart-and-vascular-specialists/internal-medicine-cardiovascular-disease/tu-khac-phan-le-md) |
| Ali Moustapha | 1740244730 | [Texas Health Resources](https://www.care.texashealth.org/providers/affiliated/heartplace---midcities/interventional-cardiology/ali-issam-moustapha-md) |
| Samuel Nussbaumer | 1073515508 | [Texas Health Resources](https://www.care.texashealth.org/providers/thpg/texas-health-heart-and-vascular-specialists/internal-medicine-interventional-cardiology/samuel-andre-nussbaumer-md) |
| Srinivas Paranandi | 1013909258 | [Texas Health Resources](https://www.care.texashealth.org/providers/thpg/texas-health-heart-and-vascular-specialists/internal-medicine-interventional-cardiology/srinivas-nanjunda-paranandi-md) |
| Gopala Krishna Rao | 1790934321 | [Texas Health Resources](https://www.care.texashealth.org/providers/affiliated/mid-cities-cardiac-care-center---bedford/interventional-cardiology/gopala-krishna-balappa-rao-md) |
| Iyad Rashdan | 1811955123 | [Texas Health Resources](https://www.care.texashealth.org/providers/affiliated/heartplace---midcities/interventional-cardiology/iyad-rashdan-md) |
| Alisa Thamwiwat | 1649565953 | [Texas Health Resources](https://www.care.texashealth.org/providers/affiliated/heartplace---midcities/interventional-cardiology/alisa-thamwiwat-md) |
| Venkatesan Vidi | 1962673392 | [Texas Health Resources](https://www.care.texashealth.org/providers/affiliated/mid-cities-cardiac-care-center---bedford/cardiology/venkatesan-dyanesh-vidi-mdmph) |
| Rajesh Vrushab | 1366405268 | [Texas Health Resources](https://www.care.texashealth.org/providers/affiliated/rajesh-vrushab-md/clinical-cardiac-electrophysiology/rajesh-basanna-vrushab-md) |
| Ashok Akula | 1730491960 | [Jefferson Regional](https://www.jrmc.org/providers/ashok-akula-md/) |
| Simmie Armstrong | 1033102181 | [Jefferson Regional](https://www.jrmc.org/providers/simmie-armstrong-md/) |
| Sarenthia Epps | 1871955526 | [Jefferson Regional](https://www.jrmc.org/providers/sarenthia-epps-md-mba/) |
| Ricki Fram | 1992994396 | [Jefferson Regional](https://www.jrmc.org/providers/ricki-fram-md/) |
| Sadeem Mahmood | 1245299924 | [Jefferson Regional](https://www.jrmc.org/providers/sadeem-mahmood-md-facc/) |
| Nabeel Siddiqui | 1902228810 | [Jefferson Regional](https://www.jrmc.org/providers/nabeel-siddiqui-md/) |
| Nicholas Willis | 1629292883 | [Jefferson Regional](https://www.jrmc.org/providers/nicholas-willis-md/) |
| Srilatha Ayirala | 1710174867 | [Memorial Health System of Southwest Oklahoma](https://www.memorialhealthswok.com/providers/srilatha-ayirala-md/) |
| Mercedez Bernard | 1801279419 | [Memorial Health System of Southwest Oklahoma](https://www.memorialhealthswok.com/providers/mercedez-bernard-do/) |
| Richard Campbell | 1851381875 | [Memorial Health System of Southwest Oklahoma](https://www.memorialhealthswok.com/providers/richard-campbell-md/) |
| Bassam Saliba | 1861412223 | [Memorial Health System of Southwest Oklahoma](https://www.memorialhealthswok.com/providers/bassam-saliba-md/) |
| Robert Sweeney | 1679527030 | [Memorial Health System of Southwest Oklahoma](https://www.memorialhealthswok.com/providers/robert-sweeney-md/) |
| Vijaya Velury | 1518915750 | [Memorial Health System of Southwest Oklahoma](https://www.memorialhealthswok.com/providers/vijaya-velury-md/) |
| Halis Akturk | 1417245143 | [University of Colorado Medicine](https://www.cumedicine.us/providers/pediatrics/Halis-Akturk) |
| Sherrie Ballantine-Talmadge | 1881868008 | [University of Colorado Medicine](https://www.cumedicine.us/providers/orthopedics/Sherrie-Ballantine-Talmadge) |

## Validation and device check

Validation passed: 18 backend provider/registry/distance tests, all 64 mobile
tests, and the mobile TypeScript check. All 216 identities were replayed using
actual CMS records through the search serializer in batches below its 200-result
limit. Inventory totals, source metadata, preservation of the original 149 entries,
and unique portrait assets were checked.

The user confirmed that the new portraits look good on the iPhone after the
requested examples: Cedar Hill primary care (Brian Jones), Arlington cardiology
(William Nesbitt), pulmonology (Jonathan Besas) and endocrinology (Chandana Konduru).
The response confirmed appearance; it did not separately confirm tapping every
source link or forcing an image-load failure. Existing automated mobile rendering
tests cover source-link rendering, failed-image initials fallback and separation
of clinic photos.

No API change, migration, upload, new dependency, paid service or runtime scraper
was added. Work stays on `feature/mobile-charts-provider-fixes-20261109`; existing
report and chart changes are preserved. No provider or practice was contacted.
