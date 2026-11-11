"""Explicit patient-search groups; taxonomy membership comes from NPI codes.

Sources: https://taxonomy.nucc.org/ and
https://build.fhir.org/ig/HL7/fhir-directory-attestation/ValueSet-HealthcareProviderTaxonomy.html
Only the six agreed physician classifications are included, not every Internal
Medicine or Family Medicine subspecialty (which would reintroduce unrelated care).
"""

from concurrent.futures import ThreadPoolExecutor, wait
import httpx

TAXONOMIES = {
    "207Q00000X": "Family Medicine",
    "207R00000X": "Internal Medicine",
    "208D00000X": "General Practice",
    "207RC0000X": "Cardiovascular Disease",
    "207RP1001X": "Pulmonary Disease",
    "207RE0101X": "Endocrinology, Diabetes & Metabolism",
}
GROUPS = {
    "primary_care": ("207Q00000X", "207R00000X", "208D00000X"),
    "cardiology": ("207RC0000X",),
    "pulmonology": ("207RP1001X",),
    "endocrinology": ("207RE0101X",),
    "all": tuple(TAXONOMIES),
}
_pool = ThreadPoolExecutor(max_workers=3)
NPI_URL = "https://npiregistry.cms.hhs.gov/api/"


def lookup(params):
    response = httpx.get(NPI_URL, params=params, timeout=6.0)
    response.raise_for_status()
    data = response.json()
    if (
        not isinstance(data, dict)
        or data.get("Errors")
        or not isinstance(data.get("results", []), list)
    ):
        raise ValueError("Invalid directory response")
    return data.get("results", [])


def search_group(params, group):
    # Query every agreed classification before filtering, rather than taking one
    # unrestricted directory page and dropping most of its records afterward.
    futures = [
        _pool.submit(lookup, {**params, "taxonomy_description": TAXONOMIES[code]})
        for code in GROUPS[group]
    ]
    done, pending = wait(futures, timeout=13)
    records, failed, succeeded = [], len(pending), 0
    for future in futures:
        if future not in done:
            future.cancel()
            continue
        try:
            records.extend(future.result())
            succeeded += 1
        except (httpx.HTTPError, ValueError, TypeError):
            failed += 1
    return records, bool(failed), succeeded


def matched_taxonomy(taxonomies, group):
    allowed = set(GROUPS[group])
    matches = [t for t in taxonomies if t.get("code") in allowed]
    return next(
        (t for t in matches if t.get("primary")), matches[0] if matches else None
    )
